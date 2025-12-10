"use client";

import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";

interface ChartProps {
  data: { date: string; price: number }[];
  color?: string;
}

export function StockChart({ data, color = "#10b981" }: ChartProps) {
  // אם אין מספיק נתונים, לא מחזירים כלום כדי לא לשבור את העיצוב
  if (!data || data.length < 2) return null;

  return (
    <div className="h-[50px] w-full mt-4 opacity-70 hover:opacity-100 transition-opacity duration-300">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`colorGradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          
          <YAxis domain={['auto', 'auto']} hide />
          
          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={2}
            fill={`url(#colorGradient-${color})`}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}