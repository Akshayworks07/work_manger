"use client";

import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface StatusPieChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
}

export function StatusPieChart({ data }: StatusPieChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (!isMounted) {
    return (
      <div className="flex h-[260px] w-full items-center justify-center rounded-xl bg-slate-900/30">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="flex h-[260px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 text-center">
        <p className="text-sm font-medium text-slate-400">No deliverables tracked yet</p>
        <p className="text-xs text-slate-500 mt-1">Create projects and videos to see analytics</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const percent = Math.round((item.value / total) * 100);
      return (
        <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: item.payload.color }}
            />
            <span className="font-semibold text-white">{item.name}</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {item.value} video{item.value !== 1 ? "s" : ""} ({percent}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
            stroke="rgba(15, 23, 42, 0.8)"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry: any) => (
              <span className="text-xs text-slate-300 font-medium ml-1">
                {value} ({entry.payload.value})
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
