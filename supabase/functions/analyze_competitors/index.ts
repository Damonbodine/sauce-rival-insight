
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Initialization
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client with service role key to bypass RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Analyze competitors function started");
    const { business_input_id } = await req.json();
    
    if (!business_input_id) {
      return new Response(
        JSON.stringify({ error: "Missing business_input_id parameter" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Get business input data
    const { data: businessData, error: businessError } = await supabase
      .from('business_inputs')
      .select('description, business_category, detected_industry')
      .eq('id', business_input_id)
      .single();

    if (businessError) {
      console.error("Error fetching business data:", businessError);
      return new Response(
        JSON.stringify({ error: `Error fetching business data: ${businessError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Get competitor sites data
    const { data: competitorsData, error: competitorsError } = await supabase
      .from('competitor_sites')
      .select('id, name, url, summary, firecrawl_id')
      .eq('business_id', business_input_id)
      .order('source_rank', { ascending: false });

    if (competitorsError) {
      console.error("Error fetching competitors data:", competitorsError);
      return new Response(
        JSON.stringify({ error: `Error fetching competitors data: ${competitorsError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!competitorsData.length) {
      return new Response(
        JSON.stringify({ message: "No competitors found for this business" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Fetch raw content for each competitor with a firecrawl_id
    const competitors = await Promise.all(
      competitorsData.map(async (competitor) => {
        if (competitor.firecrawl_id) {
          const { data: contentData, error: contentError } = await supabase
            .from('competitor_raw_content')
            .select('content')
            .eq('firecrawl_id', competitor.firecrawl_id)
            .maybeSingle();

          if (contentError) {
            console.error(`Error fetching content for competitor ${competitor.id}:`, contentError);
          }

          return {
            ...competitor,
            rawContent: contentData?.content || null
          };
        } else {
          return {
            ...competitor,
            rawContent: null
          };
        }
      })
    );

    // 4. Check if OpenAI API key is available
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Setup industry context
    const industry = businessData.detected_industry || 
                    businessData.business_category || 
                    "general business";
    
    // 6. Analyze each competitor using OpenAI directly instead of LangChain
    const competitorAttributes = await Promise.all(
      competitors.map(async (competitor, index) => {
        console.log(`Analyzing competitor ${index + 1}/${competitors.length}: ${competitor.name}`);
        
        // Build content for analysis
        const contentToAnalyze = [
          `Company Name: ${competitor.name}`,
          `Website: ${competitor.url}`,
          `Summary: ${competitor.summary || "Not available"}`,
          competitor.rawContent ? `Website Content: ${competitor.rawContent.substring(0, 10000)}` : "No raw content available"
        ].join("\n\n");

        const systemPrompt = `
          You are a business analyst specializing in competitive analysis for the ${industry} industry.
          Analyze the following competitor information and extract key details.
          Extract the following information in JSON format:
          1. Product Types: What products or services does this company offer?
          2. Price Points: What pricing information can you find (specific prices, positioning like premium/budget)?
          3. Unique Selling Propositions (USPs): What makes them special or different?
          4. Tone/Branding: How would you describe their brand voice and positioning?
          5. Target Customer: Who are they primarily selling to?

          Format your response as valid JSON with these keys: 
          {
            "productTypes": ["product1", "product2"],
            "pricePoints": "description of pricing",
            "uniqueSellingPropositions": ["USP1", "USP2"],
            "toneBranding": "description of tone and branding",
            "targetCustomer": "description of target customers"
          }
          Only return the JSON object and nothing else.
        `;

        try {
          // Direct OpenAI API call
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: "gpt-4o-mini", // Using a more affordable model that's still powerful
              messages: [
                {
                  role: 'system',
                  content: systemPrompt
                },
                {
                  role: 'user',
                  content: contentToAnalyze
                }
              ],
              temperature: 0.2, // Lower temperature for more factual responses
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
          }

          const openAIResponse = await response.json();
          const result = openAIResponse.choices[0].message.content;
          
          // Parse the JSON response
          let parsedResult;
          try {
            parsedResult = JSON.parse(result.trim());
          } catch (parseError) {
            console.error(`Error parsing JSON for ${competitor.name}:`, parseError);
            // Attempt to extract JSON from the response using regex
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                parsedResult = JSON.parse(jsonMatch[0]);
              } catch (e) {
                parsedResult = {
                  error: "Could not parse analysis",
                  raw: result
                };
              }
            } else {
              parsedResult = {
                error: "Could not parse analysis",
                raw: result
              };
            }
          }

          return {
            id: competitor.id,
            name: competitor.name,
            url: competitor.url,
            attributes: parsedResult
          };
        } catch (error) {
          console.error(`Error analyzing competitor ${competitor.name}:`, error);
          return {
            id: competitor.id,
            name: competitor.name,
            url: competitor.url,
            attributes: {
              error: "Analysis failed",
              message: error.message
            }
          };
        }
      })
    );

    // 7. Generate overall summary insights
    console.log("Generating summary insights across all competitors");
    
    const summaryPrompt = `
      You are a business strategy consultant specializing in the ${industry} industry.
      
      Business Description: ${businessData.description}
      
      Competitor Analysis Data:
      ${JSON.stringify(competitorAttributes, null, 2)}
      
      Based on the analysis of these ${competitorAttributes.length} competitors, provide strategic insights addressing the following:
      
      1. Trends: What common trends do you see across these competitors in terms of products, pricing, positioning, and target customers?
      2. Market Gaps: What opportunities or gaps exist in the market that aren't being addressed by these competitors?
      3. Differentiation Strategy: How could a new business differentiate itself from these existing players?
      
      Provide your insights in a detailed, actionable format that the business owner can use to inform their strategy.
      Your response should be well-structured with clear sections for each area above.
    `;

    let summaryInsights;
    try {
      // Direct OpenAI API call for summary insights
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // Using a more affordable model that's still powerful
          messages: [
            {
              role: 'system',
              content: 'You are a business strategy consultant. Provide detailed, actionable insights.'
            },
            {
              role: 'user',
              content: summaryPrompt
            }
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
      }

      const openAIResponse = await response.json();
      summaryInsights = openAIResponse.choices[0].message.content;
    } catch (error) {
      console.error("Error generating summary insights:", error);
      summaryInsights = `Error generating summary insights: ${error.message}`;
    }

    // 8. Save the analysis results to the database
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('competitor_analysis')
      .insert({
        business_id: business_input_id,
        attributes_json: competitorAttributes,
        summary_insights: summaryInsights
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving analysis:", saveError);
      return new Response(
        JSON.stringify({ error: `Error saving analysis: ${saveError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Competitor analysis completed successfully");
    
    return new Response(
      JSON.stringify({
        message: "Analysis completed successfully",
        analysisId: savedAnalysis.id,
        competitorsAnalyzed: competitorAttributes.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Unexpected error in analyze_competitors function:", error);
    return new Response(
      JSON.stringify({ error: `Unexpected error: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
