"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, TrendingUp, TrendingDown, Activity } from "lucide-react";

interface SummaryProps {
  value: number;  // שינינו את השם שיהיה ברור שזה הערך הנוכחי
  change: number; // שינינו את השם שיהיה ברור שזה השינוי הנוכחי
}

export function PortfolioSummary({ value, change }: SummaryProps) {
  // אין כאן יותר useState, useEffect או setInterval!
  // הרכיב הזה מתעדכן אוטומטית ברגע שהאבא (LiveDashboard) מעביר לו מספרים חדשים

  const isUp = change >= 0;

  return (
    <Card className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-xl shadow-blue-900/10" dir="rtl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        
        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
          <PieChart className="h-5 w-5 text-blue-400" />
          שווי תיק כולל
        </CardTitle>
        
        <div className="flex items-center gap-2 bg-slate-900/50 px-2 py-1 rounded-full border border-slate-700/50">
          <span className="text-[10px] font-mono text-emerald-400 font-bold tracking-wider">LIVE</span>
          <Activity className="h-3 w-3 text-emerald-400 animate-pulse" />
        </div>

      </CardHeader>
      
      <CardContent>
        <div className="text-4xl font-extrabold text-white tracking-tight mt-1 transition-all duration-300">
          ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        
        <p className={`text-sm mt-2 flex items-center gap-1 font-medium ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
          {isUp ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
          <span dir="ltr">
             {isUp ? "+" : ""}{change.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}$
          </span>
          <span className="mr-1 opacity-80">היום</span>
        </p>
      </CardContent>
    </Card>
  );
}