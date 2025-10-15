import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating theme with prompt:", prompt);

    const systemPrompt = `You are a formatting-strict generator for a skill-based bubble shooter. Output ONLY valid minified JSON that matches the schema below. Do not include markdown, comments, or extra fields.

Schema (all keys required):
{
  "themeName":"<string>",
  "tagline":"<string>",
  "colors":[ "<#RRGGBB>","<#RRGGBB>","<#RRGGBB>","<#RRGGBB>","<#RRGGBB>","<#RRGGBB>" ],
  "readability":{ "minContrastRatio": ">=4.5:1", "notes":"<string>" },
  "bubbles":{
    "style":"<string>",
    "rimHighlight":"<string>",
    "innerGradient":"<string>",
    "emojiTheme":"<string>",
    "set":[
      { "label":"Jellyfish","hex":"#ACC8E5","emoji":"🪼","prompt":"translucent blue jellyfish" },
      { "label":"Shell","hex":"#A0CED9","emoji":"🐚","prompt":"pearlescent seashell" },
      { "label":"Fish","hex":"#8BCCB5","emoji":"🐠","prompt":"tropical fish" },
      { "label":"Crab","hex":"#6B9F8D","emoji":"🦀","prompt":"red crab" },
      { "label":"Starfish","hex":"#547963","emoji":"⭐","prompt":"starfish texture" },
      { "label":"Octopus","hex":"#3B4C5D","emoji":"🐙","prompt":"octopus skin" }
    ],
    "hitFX":"<string>",
    "comboFX":"<string>",
    "trailFX":"<string>"
  },
  "background":{
    "description":"<string>",
    "layers":[ "<string>","<string>","<string>" ],
    "parallax":false
  },
  "ui":{
    "fontPrimary":"<string>",
    "buttonStyle":"<string>",
    "hudStyle":"<string>",
    "iconStyle":"<string>",
    "safeAreas":"<string>"
  },
  "shooter":{
    "design":"<string>",
    "muzzleFX":"<string>",
    "idleAnim":"<string>"
  },
  "particles":{
    "spriteSize":64,
    "pop":"<string>",
    "combo":"<string>",
    "confetti":"<string>"
  },
  "audio":{
    "sfx":{
      "shoot":"<short sfx note>",
      "popSmall":"<short sfx note>",
      "popBig":"<short sfx note>",
      "combo":"<short sfx note>",
      "win":"<short sfx note>",
      "lose":"<short sfx note>"
    },
    "music":null
  },
  "copy":{
    "tips":[ "<string>","<string>","<string>" ],
    "onWin":[ "<string>","<string>" ],
    "onLose":[ "<string>","<string>" ]
  },
  "scoringLabels":{
    "score":"<string>",
    "combo":"<string>",
    "accuracy":"<string>",
    "timeBonus":"<string>"
  },
  "config":{
    "roundSeconds":120,
    "board":{"rows":12,"cols":8,"seededSymmetry":true},
    "physics":{"gravity":0,"bounce":0.82,"aimAssist":0.06,"bankShots":true},
    "difficulty":{
      "starter":{"colorCount":5,"newRowEvery":7,"garbageRate":0,"comboBonus":1.0},
      "standard":{"colorCount":6,"newRowEvery":6,"garbageRate":0.02,"comboBonus":1.15},
      "pro":{"colorCount":6,"newRowEvery":5,"garbageRate":0.04,"comboBonus":1.3}
    }
  },
  "export":{
    "images":[
      {"id":"bubbleSprites","path":"assets/bubbles.png","note":"6x bubbles w/ centered emoji glyph"},
      {"id":"background","path":"assets/bg.png","note":"single-layer flattened bg"},
      {"id":"particles","path":"assets/particles.png","note":"pop/combo/confetti spritesheet"}
    ],
    "ui":[
      {"id":"buttons","path":"assets/ui/buttons.png"},
      {"id":"hud","path":"assets/ui/hud.png"},
      {"id":"icons","path":"assets/ui/icons.png"}
    ],
    "sfx":[
      {"id":"shoot","path":"assets/sfx/shoot.wav"},
      {"id":"popSmall","path":"assets/sfx/popSmall.wav"},
      {"id":"popBig","path":"assets/sfx/popBig.wav"},
      {"id":"combo","path":"assets/sfx/combo.wav"},
      {"id":"win","path":"assets/sfx/win.wav"},
      {"id":"lose","path":"assets/sfx/lose.wav"}
    ]
  }
}

CRITICAL EMOJI REQUIREMENTS (read this first):
- The "emoji" field MUST be an actual Unicode emoji character (🪼🐚🐠🦀🪸🐙), NEVER English words.
- If you write "shell" or "starfish" or any text instead of an emoji, YOUR RESPONSE WILL BE REJECTED.
- Each emoji must be a SINGLE visible symbol that renders as an icon/image in apps.
- Test yourself: Does it look like 🐚 or like "shell"? Only the first is valid.

VALID examples:
✓ {"emoji":"🐚"} - This is a shell emoji
✓ {"emoji":"🦀"} - This is a crab emoji  
✓ {"emoji":"🪼"} - This is a jellyfish emoji
✓ {"emoji":"⭐"} - This is a star emoji

INVALID examples (WILL CAUSE REJECTION):
✗ {"emoji":"shell"} - This is text, not an emoji
✗ {"emoji":"crab"} - This is text, not an emoji
✗ {"emoji":"starfish"} - This is text, not an emoji
✗ {"emoji":"star"} - This is text, not an emoji

Other rules:
- Prioritize legibility: emoji centered inside each bubble circle; do not overflow edges.
- Keep color palette consistent with background and UI; meet the stated contrast ratio for text vs. surfaces.
- Emojis must match the theme (e.g., ocean: 🪼🐚🐠; space: 🪐⭐🛸). Avoid faces unless theme demands.
- Tune copy to be short, upbeat, and theme-aligned.
- Always fill all keys; return compact minified JSON only.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 1.0,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const themeJson = data.choices[0].message.content;
    
    console.log("Generated theme:", themeJson);

    // Try to parse to validate it's valid JSON
    let parsedTheme;
    try {
      parsedTheme = JSON.parse(themeJson);
    } catch (e) {
      console.error("Failed to parse generated JSON:", e);
      return new Response(JSON.stringify({ error: "Generated invalid JSON" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PHASE 1: Validate that emoji fields contain actual emojis, not text
    const validateEmojis = (theme: any): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];
      
      if (!theme.bubbles?.set || !Array.isArray(theme.bubbles.set)) {
        errors.push("Missing bubbles.set array");
        return { valid: false, errors };
      }

      theme.bubbles.set.forEach((bubble: any, index: number) => {
        if (!bubble.emoji) {
          errors.push(`Bubble ${index} (${bubble.label}) missing emoji field`);
          return;
        }

        const emoji = bubble.emoji;
        
        // Check if it's just ASCII text (common AI mistake)
        if (/^[a-zA-Z\s]+$/.test(emoji)) {
          errors.push(`Bubble ${index} (${bubble.label}) has text "${emoji}" instead of emoji`);
          return;
        }

        // Check if it's suspiciously long (emojis are typically 1-4 chars in length)
        if (emoji.length > 6) {
          errors.push(`Bubble ${index} (${bubble.label}) has suspiciously long emoji: "${emoji}"`);
          return;
        }

        // Check if it contains common text words that AI might use
        const textWords = ['shell', 'fish', 'crab', 'star', 'octopus', 'jellyfish', 'planet', 'rocket', 'alien', 'ufo'];
        if (textWords.some(word => emoji.toLowerCase().includes(word))) {
          errors.push(`Bubble ${index} (${bubble.label}) contains text word in emoji field: "${emoji}"`);
        }
      });

      return { valid: errors.length === 0, errors };
    };

    const emojiValidation = validateEmojis(parsedTheme);
    
    if (!emojiValidation.valid) {
      console.error("Emoji validation failed:", emojiValidation.errors);
      return new Response(JSON.stringify({ 
        error: "AI generated invalid emojis",
        details: emojiValidation.errors 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✓ Emoji validation passed - all bubbles have valid emoji characters");

    // Generate hero banner image
    let heroBannerImage: string | undefined;
    try {
      console.log("Generating hero banner image...");
      const imagePrompt = `Create a vibrant hero banner image (16:9 aspect ratio, 1200x675 pixels) for a bubble shooter game. Theme: "${prompt}". Visual style: ${parsedTheme.background?.description || 'colorful and playful game environment'}. The image should be eye-catching, game-appropriate, with bold colors and a fun aesthetic. No text or typography in the image. Ultra high resolution.`;
      
      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-preview",
          messages: [{
            role: "user",
            content: imagePrompt
          }],
          modalities: ["image", "text"]
        })
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (imageUrl) {
          heroBannerImage = imageUrl;
          console.log("Hero banner generated successfully");
        }
      } else {
        console.warn("Image generation failed, continuing without banner:", imageResponse.status);
      }
    } catch (imageError) {
      console.warn("Image generation error (non-blocking):", imageError);
    }

    // Generate bubble spritesheet and upload to storage
    let bubbleSpritesheet: string | undefined;
    try {
      console.log("Generating bubble icon spritesheet...");
      
      // Build detailed prompt from bubble set
      const bubbleDescriptions = parsedTheme.bubbles.set
        .map((b: any, i: number) => `${i + 1}. ${b.label}: ${b.prompt || b.label}`)
        .join(", ");
      
      const spritesheetPrompt = `Create a spritesheet with 6 bubble game icons in a 3×2 grid layout (3 columns, 2 rows), 1024x1024 pixels total (each icon cell is 128x128). Theme: "${prompt}". 
      
Style requirements:
- Each icon should be a centered circular design (80-90px diameter) on transparent background
- Icons should be simple, recognizable symbols matching these descriptions: ${bubbleDescriptions}
- Use colors from this palette: ${parsedTheme.colors.join(", ")}
- Icons should match the game's visual style: ${parsedTheme.bubbles.style || 'clean and playful'}
- NO text, NO emoji characters, NO overlapping - just pure visual symbols
- Grid layout - First row: [Icon1] [Icon2] [Icon3], Second row: [Icon4] [Icon5] [Icon6]
- High contrast, game-ready graphics
- Transparent background (PNG format)

Example layout: If theme is "ocean", create: [jellyfish icon] [shell icon] [fish icon] [crab icon] [starfish icon] [octopus icon]`;

      const spritesheetResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-preview",
          messages: [{
            role: "user",
            content: spritesheetPrompt
          }],
          modalities: ["image", "text"]
        })
      });

      if (spritesheetResponse.ok) {
        const spritesheetData = await spritesheetResponse.json();
        const spritesheetUrl = spritesheetData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        if (spritesheetUrl) {
          console.log("Spritesheet generated, uploading to storage...");
          
          // Download the image from the AI-generated URL
          const imageResponse = await fetch(spritesheetUrl);
          if (!imageResponse.ok) {
            throw new Error(`Failed to download spritesheet: ${imageResponse.status}`);
          }
          
          const imageBlob = await imageResponse.blob();
          const imageBuffer = await imageBlob.arrayBuffer();
          
          // Create Supabase client
          const supabaseUrl = Deno.env.get("SUPABASE_URL");
          const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
          
          if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error("Supabase credentials not configured");
          }
          
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          
          // Generate unique filename
          const timestamp = Date.now();
          const filename = `spritesheets/spritesheet-${timestamp}.png`;
          
          // Upload to storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('game-assets')
            .upload(filename, imageBuffer, {
              contentType: 'image/png',
              cacheControl: '3600',
              upsert: false
            });
          
          if (uploadError) {
            console.error("Storage upload error:", uploadError);
            throw uploadError;
          }
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('game-assets')
            .getPublicUrl(filename);
          
          bubbleSpritesheet = urlData.publicUrl;
          console.log("Spritesheet uploaded successfully to:", bubbleSpritesheet);
        }
      } else {
        console.warn("Spritesheet generation failed, will fall back to emoji:", spritesheetResponse.status);
      }
    } catch (spritesheetError) {
      console.warn("Spritesheet generation error (non-blocking):", spritesheetError);
    }

    // Add spritesheet URL to theme object
    if (bubbleSpritesheet) {
      parsedTheme.bubbles.spritesheet = bubbleSpritesheet;
    }

    return new Response(JSON.stringify({ 
      theme: parsedTheme,
      heroBannerImage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-theme function:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
