import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getStockData } from "./finance";

// Initialize Groq
const groq = createOpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// Perform AI analysis directly using Groq (no Python server needed)
export async function analyzeStockWithPython(symbol: string) {
  try {
    console.log(`🧠 Analyzing ${symbol} with Groq Llama...`);
    
    // Get current stock data
    const stockData = await getStockData(symbol);
    
    if (!stockData || stockData.price === 0) {
      return {
        symbol: symbol,
        trend: "NEUTRAL",
        prediction: 0,
        signal_strength: 0,
        sentiment: "UNKNOWN",
        reason: "לא ניתן להביא נתונים על המניה"
      };
    }

    // Call Groq for technical/sentiment analysis
    const response = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: `You are a professional stock analyst. Analyze the given stock data and provide sentiment and price prediction (in Hebrew).
      
      Return ONLY valid JSON with no markdown, no code blocks, just the raw JSON object:
      {
        "symbol": "SYMBOL",
        "trend": "Bullish|Bearish|Neutral",
        "prediction": <number>,
        "signal_strength": <0-100>,
        "reason": "reason in Hebrew"
      }`,
      prompt: `
        Stock: ${symbol}
        Current Price: $${stockData.price}
        Change: ${stockData.change > 0 ? '+' : ''}${stockData.change.toFixed(2)}%
        Name: ${stockData.name}
        
        Provide technical sentiment and a 5-10% price prediction range (estimate a realistic target price based on current trend).
        Return ONLY a valid JSON object.
      `,
      temperature: 0.5,
    });

    try {
      // Extract JSON from response (remove markdown code blocks if present)
      let jsonStr = response.text.trim();
      
      // Remove markdown code blocks if present
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }
      
      // Find JSON object
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log(`✅ AI Analysis for ${symbol}:`, parsed);
        return {
          symbol: parsed.symbol || symbol,
          trend: parsed.trend || "Neutral",
          prediction: typeof parsed.prediction === 'number' ? parsed.prediction : parseFloat(parsed.prediction) || stockData.price,
          signal_strength: typeof parsed.signal_strength === 'number' ? parsed.signal_strength : 50,
          reason: parsed.reason || "ניתוח AI בוצע"
        };
      }
    } catch (parseError) {
      console.warn("Could not parse JSON response:", parseError);
      console.log("Raw response:", response.text);
    }

    // Fallback: determine sentiment from current change
    const sentiment = stockData.change > 2 ? "Bullish" : stockData.change < -2 ? "Bearish" : "Neutral";
    const prediction = stockData.change > 0 
      ? stockData.price * 1.05 
      : stockData.change < 0 
      ? stockData.price * 0.95 
      : stockData.price;
    
    return {
      symbol: symbol,
      trend: sentiment,
      prediction: Math.round(prediction * 100) / 100,
      signal_strength: Math.abs(stockData.change) > 5 ? 75 : 50,
      reason: `${sentiment === 'Bullish' ? 'מינימום חיובי' : sentiment === 'Bearish' ? 'מינימום שלילי' : 'יציב'}`
    };

  } catch (error) {
    console.error("AI Analysis Error:", error);
    return {
      symbol: symbol,
      trend: "NEUTRAL",
      prediction: 0,
      signal_strength: 0,
      reason: "שגיאה בניתוח ה-AI"
    };
  }
}