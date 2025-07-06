
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
      prompt = 'Professional business portrait, friendly smile, business attire, confident demeanor, digital art style';
    } else if (character === 'fred') {
      prompt = 'Friendly robot mascot character, modern tech design, colorful and approachable, digital art style';
    } else {
      throw new Error('Invalid character specified');
    }

    console.log(`Generating avatar for ${character} with simplified prompt:`, prompt);

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'b64_json'
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error details:', {
        status: response.status,
        statusText: response.statusText,
        errorData: errorData,
        character: character,
        prompt: prompt
      });
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('OpenAI response received successfully for', character);
    
    const imageBase64 = data.data[0].b64_json;
    
    return new Response(JSON.stringify({ 
      imageBase64,
      character 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-avatars function:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
