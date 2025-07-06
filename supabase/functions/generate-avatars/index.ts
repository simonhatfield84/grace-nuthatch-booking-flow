
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { character } = await req.json();
    
    let prompt = '';
    if (character === 'simon') {
      prompt = 'Professional portrait of a friendly British hospitality manager in his 40s, warm smile, business casual attire, confident but approachable demeanor, high quality digital art style, circular crop, clean background';
    } else if (character === 'fred') {
      prompt = 'Friendly AI assistant character, modern digital avatar, tech-inspired design with warm colors, approachable robotic features, professional but playful, high quality digital art style, circular crop, clean background';
    } else {
      throw new Error('Invalid character specified');
    }

    console.log(`Generating avatar for ${character} with prompt:`, prompt);

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'high',
        output_format: 'png'
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received for', character);
    
    // For gpt-image-1, the response contains base64 data
    const imageBase64 = data.data[0].b64_json;
    
    return new Response(JSON.stringify({ 
      imageBase64,
      character 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-avatars function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
