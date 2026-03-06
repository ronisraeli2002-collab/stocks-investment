"use client";

import { useState, useRef, useEffect } from "react";
import { askStockAgent } from "@/app/agent"; 
import { Send, Bot, Sparkles, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function StockAgentChat({ symbol }: { symbol: string }) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // הצעות לשאלות כדי שלמשתמש יהיה קל להתחיל
  const suggestions = [
    "מה אתה יודע על המניה?",
    "תן לי ניתוח טכני של המניה",
    "השווה עם מתחרות",
    "מה ההיסטוריה של המניה?"
  ];

const handleAsk = async (textToAsk: string) => {
    if (!textToAsk.trim()) return;
    
    // Add user message immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: textToAsk
    };
    
    setQuery("");
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      // Convert messages to the format expected by agent
      const history = messages.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      }));

      // Call agent with full conversation history
      const result = await askStockAgent(symbol, textToAsk, history);
      
      console.log("📦 Raw response from Agent:", result);

      if (result && result.success && result.text?.trim()) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: result.text
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: result?.text || "❌ שגיאה בשרת ה-AI. אנא נסה שוב."
        };
        setMessages(prev => [...prev, errorMessage]);
      }
      
    } catch (error) {
      console.error("❌ Client Error:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "תקלת רשת או שגיאת שרת פנימית. לא ניתן להתחבר."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex flex-col max-h-[700px]">
      
      {/* כותרת יפה */}
      <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg shadow-lg shadow-blue-900/20">
            <Bot className="text-white" size={24} />
        </div>
        <div>
          <h3 className="font-bold text-lg text-white">FinDash Analyst</h3>
          <p className="text-xs text-slate-400">אנליסט AI  פיננסי </p>
        </div>
      </div>

      {/* אזור התשובה - עם גבול גובה קבוע וגלילה */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-3 max-h-[500px] border border-slate-700/30 rounded-lg p-4 bg-slate-950/40">
        {messages.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                <Sparkles className="text-blue-400 mb-3" size={32} />
                <p className="text-slate-400 text-sm max-w-xs">
                  שאל אותי כל שאלה על מניית {symbol}.
                </p>
            </div>
        ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-lg p-3 max-w-[85%] text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-800 text-slate-200'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 bg-slate-800 text-slate-200 p-3 rounded-lg">
                    <Loader2 className="animate-spin" size={16} />
                    <span className="text-sm">מחפש...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
        )}
      </div>

      {/* כפתורי הצעות מהירים - הופיע רק בהתחלה */}
      {messages.length === 0 && !loading && (
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