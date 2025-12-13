"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { getHistory, getAiAnalysis } from "@/app/actions"; // מחקנו את removeStock מכאן כי הוא לא בשימוש ישיר
import { Trash2, Brain, Loader2, TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { StockChart } from "@/components/StockChart";

interface StockProps {
  id: number;
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  change: number;
  onDelete?: () => void; // הפונקציה שמגיעה מהדשבורד
}

export function StockCard({ id, symbol, name, quantity, price, change, onDelete }: StockProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      const historyData = await getHistory(symbol);
      setHistory(historyData);
    };
    loadHistory();
  }, [symbol]);

  const handleAnalyze = async () => {
    if (aiAnalysis) {
      setIsFlipped(true);
      return;
    }

    setIsAnalyzing(true);
    const result = await getAiAnalysis(symbol);
    setIsAnalyzing(false);

    if (result && !result.error) {
      setAiAnalysis(result);
      setIsFlipped(true);
      toast.success(`הניתוח של ${symbol} מוכן!`);
    } else {
      const errorMessage = result?.error || "שגיאה בהתחברות למוח";
      toast.error(errorMessage);
    }
  };
  
  const isPositive = change >= 0;
  const colorClass = isPositive ? "text-emerald-400" : "text-red-400";
  const chartColor = isPositive ? "#34d399" : "#f87171";
  const arrow = isPositive ? "▲" : "▼";

  return (
    <div className="relative h-[320px] w-full perspective-1000 group">
      
      <div 
        className={`relative h-full w-full transition-all duration-700 transform-style-3d ${isFlipped ? "rotate-y-180" : ""}`}
      >
        
        {/* --- צד קדמי (FRONT) --- */}
        <Card className={`absolute inset-0 backface-hidden bg-slate-900 border-slate-800 text-slate-100 flex flex-col justify-between hover:border-blue-500/50 transition-colors ${isFlipped ? "pointer-events-none" : "pointer-events-auto"}`}>
            
            {/* --- התיקון הגדול כאן: כפתור מחיקה --- */}
            <button
                onClick={(e) => {
                    e.stopPropagation(); // כדי שהכרטיס לא יתהפך כשלוחצים על הפח
                    if (onDelete) {
                        onDelete(); // מפעיל את הפונקציה של הדשבורד שמבצעת את המחיקה האמיתית
                    }
                }}
                className="absolute top-3 left-3 z-10 text-slate-400 hover:text-red-500 hover:bg-slate-800 rounded-full p-2 transition-all opacity-0 group-hover:opacity-100"
                title="מחק מניה"
            >
                <Trash2 size={16} />
            </button>

            {/* כפתור מוח */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleAnalyze();
                }}
                className="absolute top-3 right-3 z-10 text-purple-400 hover:text-purple-300 hover:bg-purple-900/30 rounded-full p-2 transition-all"
                title="AI Analysis"
            >
                {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Brain size={18} />}
            </button>

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pl-12 pr-12">
                <CardTitle className="text-xl font-bold">{symbol}</CardTitle>
                <span className={`font-mono text-sm ${colorClass} flex items-center gap-1`}>
                {arrow} {change.toFixed(2)}%
                </span>
            </CardHeader>
            
            <CardContent className="pl-12 flex-1 flex flex-col justify-end">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <div className="text-2xl font-bold text-white">
                            ${price.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-400">מחיר יחידה</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-bold text-emerald-300">
                            ${(price * quantity).toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-400">שווי אחזקות</div>
                    </div>
                </div>
                
                <div className="mt-auto">
                    <StockChart data={history} color={chartColor} />
                </div>
            </CardContent>
        </Card>


        {/* --- צד אחורי (BACK - AI) --- */}
        <Card 
            className={`absolute inset-0 h-full w-full backface-hidden rotate-y-180 bg-gradient-to-br from-slate-900 to-purple-950 border-purple-500/50 text-slate-100 flex flex-col cursor-default ${isFlipped ? "pointer-events-auto" : "pointer-events-none"}`}
        >
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    setIsFlipped(false);
                }}
                className="absolute top-3 left-3 z-50 text-slate-300 hover:text-white hover:bg-white/20 bg-black/40 p-2 rounded-full transition-all cursor-pointer"
                title="חזור לגרף"
            >
                <ArrowLeft size={20} />
            </button>

            <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-6">
                
                <div className="bg-purple-500/20 p-3 rounded-full animate-pulse">
                    <Brain size={32} className="text-purple-400" />
                </div>

                {aiAnalysis ? (
                    <div className="w-full space-y-4">
                        <div className="space-y-1">
                            <h3 className="text-slate-400 text-xs uppercase tracking-widest">AI Prediction</h3>
                            <div className="text-3xl font-mono font-bold text-white flex justify-center items-center gap-2">
                                ${aiAnalysis.prediction}
                                {aiAnalysis.prediction > price ? 
                                    <TrendingUp className="text-emerald-400" size={24}/> : 
                                    <TrendingDown className="text-red-400" size={24}/>
                                }
                            </div>
                        </div>

                        <div className={`p-3 rounded-xl border ${aiAnalysis.trend.includes("Bullish") ? "bg-emerald-950/30 border-emerald-500/30" : "bg-red-950/30 border-red-500/30"}`}>
                            <div className={`font-bold text-lg ${aiAnalysis.trend.includes("Bullish") ? "text-emerald-400" : "text-red-400"}`}>
                                {aiAnalysis.trend.includes("Bullish") ? "מגמה חיובית (BUY)" : "מגמה שלילית (SELL)"}
                            </div>
                            <div className="text-xs text-slate-400 mt-1 font-mono">
                                עוצמת שינוי צפויה: {aiAnalysis.signal_strength}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-slate-400 animate-pulse">טוען נתונים מהמוח...</div>
                )}
            </div>
        </Card>

      </div>

      <style jsx>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}