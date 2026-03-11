finDash - AI-Powered Financial Portfolio Dashboard
finDash is a real-time, full-stack financial portfolio management platform equipped with an autonomous AI Agent. Built for modern web performance, it allows users to track stocks, read live market news, and consult a built-in AI analyst capable of fetching and synthesizing real-time web data.

🚀 Key Features
Real-Time Market Data: Live stock quotes, historical candlestick charts, and market news integrated seamlessly via the Finnhub API.

Autonomous AI Financial Analyst: A specialized AI agent powered by Groq (Llama 3). It utilizes a Manual RAG (Retrieval-Augmented Generation) architecture, executing background searches via the Tavily API to answer current market queries in fluent Hebrew.

Resilient Data Pipeline: Implements Upstash Redis caching to mitigate third-party API rate limits, ensuring UI stability and blazing-fast response times.

Secure Authentication: End-to-end user management and route protection powered by Clerk.

Portfolio Management: Persistent storage of user assets and holdings using Serverless PostgreSQL.

🛠️ Technology Stack
Frontend: Next.js 15 (App Router), React, TypeScript, Tailwind CSS

Backend: Node.js, Next.js Server Actions

Database & ORM: PostgreSQL (Neon Serverless), Prisma ORM

Caching: Upstash Redis

AI & APIs: Groq (Llama 3.3 70B), Vercel AI SDK, Tavily Search API, Finnhub Financial API

Authentication: Clerk

Validation: Zod

🏗️ System Architecture Highlights
Agentic RAG Implementation: The AI agent does not rely solely on frozen training data. When queried about current events, a router function (checkIfSearchNeeded) intercepts the request, triggers a background Tavily web search, and injects the raw real-time data into the LLM's system prompt before generating a response.

API Rate Limit Mitigation: To handle strict rate limits from financial data providers, external requests are wrapped in a robust fallback mechanism and cached via Redis, preventing UI red-screens during heavy development or traffic spikes.

⚙️ Getting Started
Prerequisites
Make sure you have Node.js and npm/yarn/pnpm installed. You will also need API keys for the services listed in the .env.example section.

Installation
Clone the repository:
git clone 
cd findash

Install dependencies:
npm install

Configure Environment Variables:
Create a .env file in the root directory and add the following keys:

DATABASE_URL="postgresql://user:password@endpoint.neon.tech/neondb"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
FINNHUB_API_KEY=your_finnhub_key
GROQ_API_KEY=gsk_...
TAVILY_API_KEY=tvly-...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

Initialize the Database:
npx prisma generate
npx prisma db push

Run the development server:
npm run dev

Open http://localhost:3000 with your browser to see the result.