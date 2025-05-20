
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Get request body
    const { business_input_id } = await req.json()

    // Validate input
    if (!business_input_id) {
      return new Response(JSON.stringify({ error: 'business_input_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Get business information
    const { data: businessData, error: businessError } = await supabase
      .from('business_inputs')
      .select('description, keywords')
      .eq('id', business_input_id)
      .single()

    if (businessError) {
      console.error('Error fetching business data:', businessError)
      return new Response(JSON.stringify({ error: 'Failed to fetch business data' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Build query string from business description and keywords
    let queryString = businessData.description
    if (businessData.keywords && businessData.keywords.length > 0) {
      queryString += ' ' + businessData.keywords.join(' ')
    }

    // Fetch competitors using Exa API
    const exaApiKey = Deno.env.get('EXA_API_KEY')
    if (!exaApiKey) {
      return new Response(JSON.stringify({ error: 'EXA_API_KEY is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const exaResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${exaApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: queryString,
        numResults: 10
      }),
    })

    if (!exaResponse.ok) {
      const errorText = await exaResponse.text()
      console.error('Exa API error:', errorText)
      return new Response(JSON.stringify({ error: 'Error calling Exa API', details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const exaData = await exaResponse.json()
    
    // Prepare competitor sites data for insertion
    const competitorSites = exaData.results.map((result: any) => ({
      business_id: business_input_id,
      name: result.title || new URL(result.url).hostname,
      url: result.url,
      summary: result.text || null,
      source_rank: result.score || null
    }))

    // Insert competitor sites into database
    const { data: insertData, error: insertError } = await supabase
      .from('competitor_sites')
      .insert(competitorSites)
      .select()

    if (insertError) {
      console.error('Error inserting competitor sites:', insertError)
      return new Response(JSON.stringify({ error: 'Failed to save competitor sites' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully saved ${competitorSites.length} competitor sites`,
        competitors: competitorSites.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
