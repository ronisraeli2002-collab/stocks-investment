"use server";

import { generateText } from "ai"; 
import { createOpenAI } from "@ai-sdk/openai";
import { tavily } from "@tavily/core";

// Initialize Groq via OpenAI SDK with Groq's endpoint
const groq = createOpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

if (!process.env.GROQ_API_KEY) {
  console.warn("⚠️ WARNING: GROQ_API_KEY not set in environment");
}

if (!process.env.TAVILY_API_KEY) {
  console.warn("⚠️ WARNING: TAVILY_API_KEY not set in environment");
}

export async function askStockAgent(symbol: string, userQuestion: string) {
  try {
    console.log("🤖 askStockAgent called with symbol:", symbol, "question:", userQuestion.substring(0, 50) + "...");
    
    // Step 1: Determine if we need to search for real-time data
    const needsSearch = checkIfSearchNeeded(userQuestion);
    let searchContext = "";
    
    if (needsSearch) {
      console.log("🔍 Question requires web search");
      searchContext = await performWebSearch(symbol, userQuestion);
    }
    
    // Step 2: Build system prompt with search results
    const systemPrompt = buildSystemPrompt(symbol, searchContext);
    
    // Step 3: Call Groq with context
    const response = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt,
      prompt: userQuestion,
      temperature: 0.7,
    });

    const finalText = response.text?.trim();
    
    if (!finalText) {
      console.warn("❌ Empty response from model");
      return {
        success: false,
        text: "הסוכן לא הצליח לעבד את הבקשה. אנא נסה שוב."
      };
    }

    console.log("✅ Response generated successfully, length:", finalText.length);
    return { success: true, text: finalText };
      
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.error("❌ Generation error:", errorMsg);
    
    if (errorMsg.includes("quota") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
      return {
        success: false,
        text: "❌ קוטה מוגבלת כרגע. אנא נסה בעוד דקות ספורות."
      };
    }
    
    return {
      success: false,
      text: `שגיאה: ${errorMsg}`
    };
  }
}

// Helper function: Determine if search is needed
function checkIfSearchNeeded(question: string): boolean {
  const keywords = [
    "היום",
    "אתמול",
    "חדשות",
    "מחיר",
    "NEWS",
    "TODAY",
    "PRICE",
    "LATEST",
    "עדכני",
    "קרה",
    "עכשיו",
    "RIGHT NOW",
    "RECENT",
    "CURRENT"
  ];
  
  const lowerQuestion = question.toLowerCase();
  return keywords.some(kw => lowerQuestion.includes(kw.toLowerCase()));
}

// Helper function: Perform web search
async function performWebSearch(symbol: string, question: string): Promise<string> {
  try {
    const searchQuery = `${symbol} stock ${question}`;
    console.log("🌐 Searching for:", searchQuery);
    
    const results = await tvly.search(searchQuery, {
      search_depth: "basic",
      include_answer: true,
      max_results: 5
    });

    if (!results?.results || results.results.length === 0) {
      console.log("⚠️ No search results found");
      return "";
    }

    const formatted = results.results
      .map((r: any) => `• ${r.title}\n  ${r.content}`)
      .join('\n\n');

    console.log("✅ Found", results.results.length, "results");
    return formatted;
  } catch (e) {
    console.error("❌ Search error:", e);
    return "";
  }
}

// Helper function: Build system prompt
function buildSystemPrompt(symbol: string, searchContext: string): string {
  return `
    You are a professional stock analyst. Your task is to analyze and discuss ${symbol}.

    LANGUAGE: Respond ONLY in HEBREW (עברית).

    CONTEXT:
    - If recent search results are provided below, use them to ground your analysis.
    - If no recent results are provided, proceed using the available context and general financial knowledge.

    RECENT DATA:
    ${searchContext ? `RECENT DATA FROM INTERNET SEARCH:
${searchContext}

Use this information in your analysis.` : "No recent search data provided."}

    INSTRUCTIONS:
    1. Answer in clear, professional Hebrew.
    2. Be direct and analytical.
    3. Provide actionable insights.
  `;
}