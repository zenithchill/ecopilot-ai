import { NextResponse } from 'next/server';
import { getGeminiModel, buildSystemPrompt } from '@/lib/gemini';
import { chatRateLimiter, sanitizeString } from '@/lib/validators';
import { calculateCarbonScore } from '@/lib/carbon-engine';

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting
    if (!chatRateLimiter.canMakeRequest()) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in a minute.' },
        { status: 429 }
      );
    }

    // 2. Check API Key
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured. Please add GOOGLE_GEMINI_API_KEY to your environment variables.' },
        { status: 500 }
      );
    }

    // 3. Parse and Validate Request
    const body = await req.json();
    const { messages, profile, logs } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format.' }, { status: 400 });
    }

    const latestMessage = messages[messages.length - 1];
    if (!latestMessage || latestMessage.role !== 'user') {
      return NextResponse.json({ error: 'Last message must be from the user.' }, { status: 400 });
    }

    const sanitizedQuery = sanitizeString(latestMessage.content, 1000);
    
    // 4. Build Context
    const score = profile ? calculateCarbonScore(logs || [], profile.lifestyle) : null;
    const systemPrompt = profile ? buildSystemPrompt(profile, logs || [], score) : 'You are EcoPilot, a sustainability AI assistant.';

    // 5. Format History for Gemini
    // Gemini expects history in { role: 'user' | 'model', parts: [{ text: '...' }] } format
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Inject system prompt into history as the very first message from user (Gemini workaround for system instructions)
    // In newer Gemini SDKs, there's a systemInstruction field, but we'll use a safer backward compatible approach
    const model = getGeminiModel();
    
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt + '\n\nI understand my instructions. Please proceed.' }] },
        { role: 'model', parts: [{ text: 'Understood. I am ready to help you reduce your carbon footprint.' }] },
        ...history
      ],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    // 6. Generate Response
    const result = await chat.sendMessage(sanitizedQuery);
    const responseText = result.response.text();

    return NextResponse.json({ content: responseText });

  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while communicating with the AI. Please try again.' },
      { status: 500 }
    );
  }
}
