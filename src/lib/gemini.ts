import { GoogleGenerativeAI } from '@google/generative-ai';
import { UserProfile, DailyLog, CarbonScore } from '@/types';
import { calculateCarbonScore } from './carbon-engine';

// Initialize the Gemini API client
// Ensure this is only executed on the server side
if (typeof window !== 'undefined') {
  console.warn('CRITICAL SECURITY WARNING: Gemini API initialized on the client side. This exposes your API key.');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export const getGeminiModel = () => {
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

/**
 * Build the system prompt using user context for highly personalized responses.
 */
export function buildSystemPrompt(
  profile: UserProfile,
  logs: DailyLog[],
  score: CarbonScore | null
): string {
  const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;

  return `
You are EcoPilot, an expert AI sustainability coach. You combine environmental science expertise with behavioral psychology to help users reduce their carbon footprint.
You are encouraging, specific, data-driven, and concise.

USER CONTEXT:
Name: ${profile.name}
Transport: ${profile.lifestyle.primaryTransport} (${profile.lifestyle.dailyCommuteKm}km commute)
Diet: ${profile.lifestyle.dietType} (${profile.lifestyle.meatMealsPerWeek} meat meals/wk)
Energy: ${profile.lifestyle.homeType}, ${profile.lifestyle.electricityKwhPerMonth} kWh/mo
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
