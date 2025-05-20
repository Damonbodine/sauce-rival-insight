
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

    // Get the Firecrawl API key
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')
    if (!firecrawlApiKey) {
      return new Response(JSON.stringify({ error: 'FIRECRAWL_API_KEY is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fetch competitor sites that haven't been crawled yet
    const { data: competitors, error: fetchError } = await supabase
      .from('competitor_sites')
      .select('id, url, name')
      .eq('business_id', business_input_id)
      .is('firecrawl_id', null)
      .limit(10)

    if (fetchError) {
      console.error('Error fetching competitor sites:', fetchError)
      return new Response(JSON.stringify({ error: 'Failed to fetch competitor sites' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!competitors || competitors.length === 0) {
      return new Response(JSON.stringify({ message: 'No competitor sites found for crawling' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Process each competitor site
    console.log(`Starting to crawl ${competitors.length} competitor sites`)
    
    const results = {
      success: 0,
      failed: 0,
      sites: [] as Array<{ id: string, name: string, status: string }>
    }

    // Process sites in sequence to avoid rate limits
    for (const competitor of competitors) {
      try {
        console.log(`Crawling site: ${competitor.name} (${competitor.url})`)
        
        const crawlResponse = await fetch('https://api.firecrawl.dev/v0/crawl', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: competitor.url,
            dynamic: false,
            depth: 2,
            extractContent: true
          }),
        })

        const crawlData = await crawlResponse.json()
        
        if (!crawlResponse.ok) {
          console.error(`Firecrawl API error for ${competitor.url}:`, crawlData)
          
          // Update the competitor site with error status
          await supabase
            .from('competitor_sites')
            .update({
              crawl_status: 'error',
              crawl_error: `HTTP ${crawlResponse.status}: ${JSON.stringify(crawlData)}`,
              crawled_at: new Date().toISOString()
            })
            .eq('id', competitor.id)
          
          results.failed++
          results.sites.push({ 
            id: competitor.id, 
            name: competitor.name, 
            status: 'error' 
          })
          
          continue
        }

        // Update the competitor site with success status
        await supabase
          .from('competitor_sites')
          .update({
            firecrawl_id: crawlData.id,
            crawl_status: 'success',
            crawl_error: null,
            crawled_at: new Date().toISOString()
          })
          .eq('id', competitor.id)
        
        results.success++
        results.sites.push({ 
          id: competitor.id, 
          name: competitor.name, 
          status: 'success' 
        })
        
        console.log(`Successfully crawled ${competitor.name}, firecrawl_id: ${crawlData.id}`)
        
        // Add a small delay between requests to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (error) {
        console.error(`Error processing ${competitor.url}:`, error)
        
        // Update the competitor site with error status
        await supabase
          .from('competitor_sites')
          .update({
            crawl_status: 'error',
            crawl_error: error instanceof Error ? error.message : String(error),
            crawled_at: new Date().toISOString()
          })
          .eq('id', competitor.id)
        
        results.failed++
        results.sites.push({ 
          id: competitor.id, 
          name: competitor.name, 
          status: 'error' 
        })
      }
    }

    // Return summary of crawl results
    return new Response(
      JSON.stringify({
        message: `Crawl completed for ${results.success + results.failed} sites. ${results.success} succeeded, ${results.failed} failed.`,
        results
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
