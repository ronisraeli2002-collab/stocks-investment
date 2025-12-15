"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";

// צבעים מודרניים לגרף
const COLORS = [
  "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", 
  "#ec4899", "#06b6d4", "#ef4444", "#84cc16"
];

interface Stock {
  symbol: string;
  quantity: number;
  price: number;
}

interface Props {
  stocks: Stock[];
}

// פונקציה לציור החלק המודגש בעת ריחוף (Hover)
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6} // מגדיל מעט את החלק הנבחר
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

export function PortfolioDistribution({ stocks }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false); // <-- הוספנו: משתנה לבדיקת טעינה

  // <-- הוספנו: אפקט שרץ רק בצד לקוח כדי למנוע את השגיאה של Recharts
  useEffect(() => {
    setMounted(true);
  }, []);

  // חישוב ומיון הנתונים
  const data = stocks.map((stock) => ({
    name: stock.symbol,
    value: stock.quantity * stock.price,
  })).sort((a, b) => b.value - a.value);

  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  // לוגיקה לתצוגה המרכזית (מניה ספציפית או סה"כ)
  const activeItem = activeIndex !== null ? data[activeIndex] : null;
  
  const displayValue = activeItem ? activeItem.value : totalValue;
  const displayLabel = activeItem ? "שווי אחזקה" : "שווי תיק";
  const displayColor = activeItem && activeIndex !== null ? COLORS[activeIndex % COLORS.length] : "white";

  // <-- תיקון: אם הרכיב לא נטען עדיין (mounted) או שאין מניות, לא מציירים גרף
  if (!mounted || stocks.length === 0) {
    return (
        <Card className="bg-slate-900 border-slate-800 text-slate-100 h-full flex items-center justify-center shadow-lg min-h-[250px]">
            <span className="text-slate-500">
                {!mounted ? "" : "אין נתונים להצגה"}
            </span>
        </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800 text-slate-100 h-full flex flex-col shadow-lg min-h-[250px]">
      <CardHeader className="pb-0 pt-4 px-4">
        <CardTitle className="text-base font-medium text-slate-400 text-center">
          פיזור תיק
        </CardTitle>
      </CardHeader>
      
      {/* הוספתי p-0 כדי למנוע רווחים מיותרים שדוחפים את הגרף */}
      <CardContent className="flex-1 min-h-0 relative p-0">
        <div className="absolute inset-0 flex items-center justify-center">
            
          {/* הוספתי minHeight ליתר ביטחון */}
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={70} 
                outerRadius={90} 
                paddingAngle={2}
                dataKey="value"
                stroke="none"
                activeIndex={activeIndex !== null ? activeIndex : undefined}
                activeShape={renderActiveShape}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    className="outline-none cursor-pointer transition-all duration-300"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* טקסט מרכזי דינמי */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-200">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                {displayLabel}
            </span>
            
            {/* שם המניה (מופיע רק בריחוף) */}
            <span 
                className="text-xl font-bold tracking-tight mb-1 h-7"
                style={{ color: displayColor === "white" ? "white" : displayColor }}
            >
                {activeItem ? activeItem.name : ""}
            </span>

            {/* הסכום */}
            <span className="text-lg font-mono text-slate-200">
                ${displayValue.toLocaleString(undefined, { 
                    minimumFractionDigits: 0, 
                    maximumFractionDigits: 0 
                })}
            </span>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}