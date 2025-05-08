import { NextRequest, NextResponse } from "next/server";

// Get the OpenRouter API key from environment variables
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Supported models mapping
const MODEL_MAP: Record<string, string> = {
  "gpt-4.1": "openai/gpt-4.1",
  "gemini": "google/gemini-2.0-flash-001",
  "grok": "x-ai/grok-2-vision-1212",
};

export async function POST(req: NextRequest) {
  try {
    const { image, model, intensity } = await req.json();
    console.log('Request body:', { image: !!image, model, intensity });
    if (!image || !model || !intensity) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "OpenRouter API key not configured." }, { status: 500 });
    }
    const modelId = MODEL_MAP[model];
    if (!modelId) {
      return NextResponse.json({ error: "Unsupported model." }, { status: 400 });
    }

    // Build the prompt
    const prompt = `Roast this person based on their appearance in the image. Be witty, creative, and funny. Intensity: ${intensity}/10. Keep it lighthearted and not mean-spirited.`;

    // Prepare the OpenRouter API request
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: "system",
            content: "You are a playful AI roastmaster. Always keep it fun and never mean-spirited.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        max_tokens: 200,
      }),
    });

    console.log('OpenRouter API response status:', response.status);
    const data = await response.json();
    console.log('OpenRouter API response data:', JSON.stringify(data, null, 2));
    const roast = data.choices?.[0]?.message?.content || "No roast generated.";
    return NextResponse.json({ roast });
  } catch (err) {
    console.error('Error in /api/roast:', err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
} 