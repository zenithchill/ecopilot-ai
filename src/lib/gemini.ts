import 'server-only';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { UserProfile, DailyLog, CarbonScore } from '@/types';

// The 'server-only' import ensures this module can never be bundled in the client code.
// This is a robust Next.js security pattern to protect API keys.

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export const getGeminiModel = () => {
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

/**
 * Build the system prompt using user context for highly personalized responses.
 */
export function buildSystemPrompt(
  profile: UserProfile | null,
  logs: DailyLog[],
  score: CarbonScore | null
): string {
  const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;

  return `
You are EcoPilot, an expert AI sustainability coach. You combine environmental science expertise with behavioral psychology to help users reduce their carbon footprint.
You are encouraging, specific, data-driven, and concise.

USER CONTEXT:
Name: ${profile?.name || 'User'}
Transport: ${profile?.lifestyle.primaryTransport || 'Unknown'} (${profile?.lifestyle.dailyCommuteKm || 0}km commute)
Diet: ${profile?.lifestyle.dietType || 'Unknown'} (${profile?.lifestyle.meatMealsPerWeek || 0} meat meals/wk)
Energy: ${profile?.lifestyle.homeType || 'Unknown'}, ${profile?.lifestyle.electricityKwhPerMonth || 0} kWh/mo
Current Carbon Score: ${score?.score || 'N/A'} (Grade ${score?.grade || 'N/A'})
${latestLog ? `Latest Activity (Today): ${latestLog.activities.length} logs, Total: ${latestLog.totalCarbonKg} kg CO2` : 'No recent logs yet.'}

YOUR RULES:
1. Provide actionable, realistic advice tailored to the user's specific lifestyle.
2. Quantify impacts in kg CO₂ whenever possible.
3. Use relatable equivalents (e.g., "equivalent to X trees planted" or "driving X km").
4. Prioritize high-impact, low-effort changes.
5. Use positive reinforcement and a supportive tone.
6. Format your responses using Markdown for readability (use bolding, bullet points).
7. Keep responses concise unless specifically asked for a detailed explanation.
`;
}
