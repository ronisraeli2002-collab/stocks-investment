"use client";

import { useState } from "react";
// שים לב: אנחנו מייבאים את הפונקציה מהקובץ החדש שיצרת
import { askStockAgent } from "@/app/agent"; 
import { Send, Bot, Sparkles, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input"; // אם אין לך רכיב כזה, תגיד לי ונחליף ב-input רגיל
import { Button } from "@/components/ui/button";

export function StockAgentChat({ symbol }: { symbol: string }) {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  // הצעות לשאלות כדי שלמשתמש יהיה קל להתחיל
  const suggestions = [
    "מה אתה יודע על המניה?",
    "תן לי ניתוח טכני של המניה",
    "השווה עם מתחרות",
    "מה ההיסטוריה של המניה?"
  ];

const handleAsk = async (textToAsk: string) => {
    if (!textToAsk) return;
    
    setLoading(true);
    setResponse(""); 
    setQuery(textToAsk);

    try {
      // הקריאה לשרת
      const result = await askStockAgent(symbol, textToAsk);
      
      // חשיפת נתונים: מדפיסים לקונסול של הדפדפן את האובייקט הגולמי שחזר מהשרת
      console.log("📦 Raw response from Agent:", result);

      if (result && result.success) {
        // המודל סיים בהצלחה, אבל צריך לבדוק אם הוא באמת ענה
        if (!result.text || result.text.trim() === "") {
          setResponse("⚠️ המודל סיים לסרוק אך לא ניסח תשובה. נסה למקד את השאלה.");
        } else {
          setResponse(result.text);
        }
      } else {
        // השרת החזיר שגיאה מבוקרת - נציג אותה במקום טקסט גנרי
        setResponse(result?.text || "❌ שגיאה בשרת ה-AI.");
      }
      
    } catch (error) {
      // תפיסת שגיאות קריטיות (קריסת רשת או שרת)
      console.error("❌ Client Error:", error);
      setResponse("תקלת רשת או שגיאת שרת פנימית. לא ניתן להתחבר.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex flex-col h-full min-h-[400px]">
      
      {/* כותרת יפה */}
      <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg shadow-lg shadow-blue-900/20">
            <Bot className="text-white" size={24} />
        </div>
        <div>
          <h3 className="font-bold text-lg text-white">FinDash Analyst</h3>
          <p className="text-xs text-slate-400">אנליסט AI מכוון פיננסי (מופעל ע"י Groq Llama 3.3-70b-versatile)</p>
        </div>
      </div>

      {/* אזור התשובה */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 min-h-[200px]">
        {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 animate-pulse">
                <Loader2 className="animate-spin text-blue-500" size={32} />
                <span className="text-sm">מעבד את הנתונים שלי...</span>
            </div>
        ) : response ? (
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-5 text-slate-200 leading-relaxed text-sm whitespace-pre-wrap shadow-inner">
                {response}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                <Sparkles className="text-blue-400 mb-3" size={32} />
                <p className="text-slate-400 text-sm max-w-xs">
                  שאל אותי כל שאלה על מניית {symbol}.
                </p>
            </div>
        )}
      </div>

      {/* כפתורי הצעות מהירים */}
      {!response && !loading && (
        <div className="flex flex-wrap gap-2 mb-4">
            {suggestions.map((s) => (
                <button 
                    key={s}
                    onClick={() => handleAsk(s)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500/50 text-slate-300 px-3 py-1.5 rounded-full transition-all"
                >
                    {s}
                </button>
            ))}
        </div>
      )}

      {/* שורת הקלט */}
      <div className="relative mt-auto">
        <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk(query)}
            placeholder={`שאל משהו על ${symbol}...`}
            className="bg-slate-950 border-slate-700 pr-12 text-sm h-11 focus:ring-blue-500/20"
            disabled={loading}
        />
        <Button 
            onClick={() => handleAsk(query)}
            disabled={loading || !query}
            size="sm"
            className="absolute top-1.5 left-1.5 h-8 w-8 p-0 bg-blue-600 hover:bg-blue-500 rounded-md"
        >
            <Send size={14} className={loading ? "opacity-0" : "opacity-100"} />
        </Button>
      </div>

    </div>
  );
}