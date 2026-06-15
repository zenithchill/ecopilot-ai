import { NextResponse } from 'next/server';
import { getGeminiModel, buildSystemPrompt } from '@/lib/gemini';
import { chatRateLimiter, sanitizeString, sanitizeObject } from '@/lib/validators';

// Remove the permissive wildcard CORS origin
const corsHeaders = {
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  // Next.js handles CORS origin automatically via next.config.js headers
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting
    if (!chatRateLimiter.canMakeRequest()) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: corsHeaders }
      );
    }

    // 2. Check API Key
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      // Do not expose internal configuration state in production responses
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503, headers: corsHeaders }
      );
    }

    // 3. Parse and Validate Request Size
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 1024 * 512) { // Stricter 512KB limit
      return NextResponse.json({ error: 'Payload too large.' }, { status: 413, headers: corsHeaders });
    }

    const rawBody = await req.json();
    
    // Deep sanitize entire body to prevent NoSQL injection or prototype pollution
    const body = sanitizeObject(rawBody) as Record<string, unknown>;
    
    // Strict typing and validation for expected body fields
    const messages = Array.isArray(body.messages) ? body.messages : null;
    const profile = typeof body.profile === 'object' && body.profile !== null ? body.profile : null;
    const logs = Array.isArray(body.logs) ? body.logs : [];

    if (!messages) {
      return NextResponse.json({ error: 'Invalid messages format.' }, { status: 400, headers: corsHeaders });
    }

    const latestMessage = messages[messages.length - 1];
    if (!latestMessage || typeof latestMessage !== 'object' || latestMessage.role !== 'user' || typeof latestMessage.content !== 'string') {
      return NextResponse.json({ error: 'Invalid message structure.' }, { status: 400, headers: corsHeaders });
    }

    const sanitizedQuery = sanitizeString(latestMessage.content, 1000);
    if (!sanitizedQuery) {
      return NextResponse.json({ error: 'Message content is required.' }, { status: 400, headers: corsHeaders });
    }
    
    // 4. Build Context
    // We pass any type safely as the engine will perform runtime checks
    const systemPrompt = buildSystemPrompt(profile as import('@/types').UserProfile | null, logs as import('@/types').DailyLog[], null);

    // 5. Format History for Gemini
    const history = messages.slice(0, -1).map((msg: Record<string, unknown>) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: String(msg.content) }],
    }));

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

    return NextResponse.json({ content: responseText }, { headers: corsHeaders });

  } catch (error: unknown) {
    // Log the actual error internally
    console.error('Gemini API Error:', error);
    
    // Never leak the error details to the client
    return NextResponse.json(
      { error: 'An error occurred while communicating with the AI. Please try again.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
