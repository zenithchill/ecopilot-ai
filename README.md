# EcoPilot AI 🌱

EcoPilot AI is an intelligent sustainability assistant designed to help users understand, track, predict, and reduce their carbon footprint through personalized AI-driven actions, behavioral insights, and real-time coaching.

> Built for the Master Hackathon. "Duolingo + Fitbit + ChatGPT for sustainability."

## 🚀 Features

- **Smart Tracking**: Log transport, diet, and energy usage instantly.
- **AI-Powered Insights**: Get highly personalized, data-driven recommendations from an AI trained on environmental science.
- **Predictive Simulator**: Run 'what-if' scenarios (e.g., "What if I go vegan?") and see projected impacts instantly.
- **Gamified Goals**: Earn badges, level up, and maintain streaks to build sustainable habits.
- **Offline First & Secure**: All user data is stored locally in the browser (`localStorage` / `IndexedDB`), ensuring complete privacy. No backend required.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Custom dark-mode first design system)
- **State Management**: Zustand (Modular stores for User, Activity, Gamification, Chat)
- **AI**: Google Gemini API (`@google/generative-ai`)
- **Animations**: Framer Motion
- **Charts**: Recharts

## 📦 Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ecopilot-ai.git
   cd ecopilot-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Rename `.env.example` to `.env` and add your Gemini API Key:
   ```env
   GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📐 Architecture highlights

- **Zero-Backend Architecture**: To meet the <10MB hackathon constraint and ensure lightning-fast performance, the app relies purely on browser-native storage engines.
- **Scientific Foundation**: Emission calculations are based on established EPA, DEFRA, and IPCC conversion factors located in `src/lib/constants.ts`.
- **Modular Engines**: Logic is decoupled into dedicated engines (`carbon-engine`, `insights-engine`, `prediction-engine`).

## 🎨 Design System
Features a premium, modern startup aesthetic inspired by Linear and Notion, utilizing custom Tailwind tokens (`eco`, `ocean`, `earth`), glassmorphism effects, and smooth spring animations.

---
Built with ❤️ for a greener future.
