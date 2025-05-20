
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY') || '';
const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || '';

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessId, url } = await req.json();
    
    if (!businessId || !url) {
      return new Response(
        JSON.stringify({ error: "businessId and url are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Crawl the website using Firecrawl API
    console.log(`Starting to crawl URL: ${url}`);
    const crawlData = await crawlWebsite(url);
    
    if (!crawlData || crawlData.error) {
      throw new Error(`Failed to crawl website: ${crawlData?.error || 'Unknown error'}`);
    }

    // 2. Generate business description and keywords using OpenAI
    console.log("Website crawled, generating business description...");
    const analysisResult = await analyzeWebsiteContent(crawlData.content);
    
    if (!analysisResult || analysisResult.error) {
      throw new Error(`Failed to analyze website: ${analysisResult?.error || 'Unknown error'}`);
    }

    // 3. Update the business record in the database
    console.log("Updating business record with analysis results...");
    const { error: updateError } = await supabase
      .from('business_inputs')
      .update({
        description: analysisResult.description,
        keywords: analysisResult.keywords,
        url_analyzed: true
      })
      .eq('id', businessId);

    if (updateError) {
      throw new Error(`Failed to update business record: ${updateError.message}`);
    }

    // Return the analysis results
    return new Response(
      JSON.stringify({
        status: 'success',
        description: analysisResult.description,
        keywords: analysisResult.keywords
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze_business_website function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Function to crawl a website using Firecrawl API
async function crawlWebsite(url: string) {
  try {
    console.log(`Calling Firecrawl API for URL: ${url}`);
    
    const response = await fetch('https://api.firecrawl.dev/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        render: true,
        wait_for: 2000, // Wait 2 seconds for JS to load
        extract: {
          title: "title",
          description: "meta[name='description']",
          h1: "h1",
          h2: "h2",
          h3: "h3",
          paragraphs: "p",
          links: "a",
          metaKeywords: "meta[name='keywords']"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firecrawl API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return {
      content: data,
      error: null
    };
  } catch (error) {
    console.error("Error crawling website:", error);
    return {
      content: null,
      error: error.message
    };
  }
}

// Function to analyze website content and generate business description and keywords
async function analyzeWebsiteContent(websiteData: any) {
  try {
    const websiteInfo = {
      title: websiteData.title || '',
      description: websiteData.description || '',
      h1: websiteData.h1 || [],
      h2: websiteData.h2 || [],
      h3: websiteData.h3 || [],
      paragraphs: websiteData.paragraphs || [],
      metaKeywords: websiteData.metaKeywords || ''
    };

    // Prepare content for OpenAI
    const contentSummary = `
      Website Title: ${websiteInfo.title}
      Meta Description: ${websiteInfo.description}
      Meta Keywords: ${websiteInfo.metaKeywords}
      Main Headings (H1): ${websiteInfo.h1.slice(0, 5).join(' | ')}
      Sub Headings (H2): ${websiteInfo.h2.slice(0, 10).join(' | ')}
      Content Samples: ${websiteInfo.paragraphs.slice(0, 15).join(' ')}
    `;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a business analyst tasked with extracting business information from website content. Generate a concise, professional 2-3 sentence business description and a list of relevant keywords based on the website content provided.'
          },
          {
            role: 'user',
            content: `Based on the following website content, generate:
              1. A concise 2-3 sentence business description that explains what the business does, who they serve, and their value proposition.
              2. A list of 5-8 relevant keywords/phrases that describe the business, separated by commas.
              
              Website Content:
              ${contentSummary}
              
              Format your response as:
              Description: [your generated business description here]
              Keywords: [keyword1, keyword2, keyword3, etc.]`
          }
        ]
      })
    });

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error("OpenAI API returned no choices");
    }

    const analysisText = data.choices[0].message.content;
    
    // Extract description and keywords from the response
    const descriptionMatch = analysisText.match(/Description:\s*([\s\S]*?)(?=Keywords:|$)/i);
    const keywordsMatch = analysisText.match(/Keywords:\s*([\s\S]*?)$/i);

    const description = descriptionMatch ? descriptionMatch[1].trim() : "";
    const keywordsText = keywordsMatch ? keywordsMatch[1].trim() : "";
    const keywords = keywordsText
      .split(',')
      .map((keyword: string) => keyword.trim())
      .filter((keyword: string) => keyword.length > 0);

    return {
      description,
      keywords,
      error: null
    };
  } catch (error) {
    console.error("Error analyzing website content:", error);
    return {
      description: null,
      keywords: null,
      error: error.message
    };
  }
}
