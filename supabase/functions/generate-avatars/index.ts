
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Ultra-safe prompts that avoid content moderation
const getPrompts = (character: string) => {
  const prompts = {
    simon: [
      'Professional headshot, business suit, smiling',
      'Business portrait, professional attire',
      'Headshot of businessman, friendly expression'
    ],
    fred: [
      'Friendly cartoon figure, tech theme, bright colors',
      'Simple mascot design, colorful and cheerful',
      'Abstract tech symbol, friendly design'
    ]
  };
  return prompts[character as keyof typeof prompts] || [];
};

async function generateWithDallE(prompt: string, model: string = 'dall-e-3') {
  console.log(`Attempting generation with ${model} and prompt:`, prompt);
  
  const requestBody: any = {
    model: model,
    prompt: prompt,
    n: 1,
    size: '1024x1024',
    response_format: 'b64_json'
  };

  // DALL-E 2 doesn't support quality parameter
  if (model === 'dall-e-3') {
    requestBody.quality = 'standard';
  }

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const responseText = await response.text();
  
  if (!response.ok) {
    console.error(`${model} API error:`, {
      status: response.status,
      statusText: response.statusText,
      errorData: responseText,
      prompt: prompt
    });
    throw new Error(`${model} failed: ${response.status} - ${responseText}`);
  }

  return JSON.parse(responseText);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { character } = await req.json();
    
    if (!['simon', 'fred'].includes(character)) {
      throw new Error('Invalid character specified');
    }

    const prompts = getPrompts(character);
    let lastError = null;
    
    // Try DALL-E 3 with progressively simpler prompts
    for (const prompt of prompts) {
      try {
        console.log(`Trying DALL-E 3 for ${character} with prompt:`, prompt);
        const data = await generateWithDallE(prompt, 'dall-e-3');
        
        console.log(`DALL-E 3 success for ${character}`);
        const imageBase64 = data.data[0].b64_json;
        
        return new Response(JSON.stringify({ 
          imageBase64,
          character,
          method: 'dall-e-3',
          prompt: prompt
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.log(`DALL-E 3 failed for prompt "${prompt}":`, error.message);
        lastError = error;
        continue;
      }
    }

    // Fallback to DALL-E 2 with the simplest prompts
    console.log(`All DALL-E 3 attempts failed for ${character}, trying DALL-E 2`);
    
    for (const prompt of prompts) {
      try {
        console.log(`Trying DALL-E 2 for ${character} with prompt:`, prompt);
        const data = await generateWithDallE(prompt, 'dall-e-2');
        
        console.log(`DALL-E 2 success for ${character}`);
        const imageBase64 = data.data[0].b64_json;
        
        return new Response(JSON.stringify({ 
          imageBase64,
          character,
          method: 'dall-e-2',
          prompt: prompt
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.log(`DALL-E 2 failed for prompt "${prompt}":`, error.message);
        lastError = error;
        continue;
      }
    }

    // If all AI generation fails, return a helpful error
    throw new Error(`All avatar generation attempts failed. Last error: ${lastError?.message || 'Unknown error'}`);

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
