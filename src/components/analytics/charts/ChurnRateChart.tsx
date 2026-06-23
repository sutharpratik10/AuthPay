'use client';

import React from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ChurnRateChartProps {
  data: any[];
  title?: string;
  threshold?: number;
}

export function ChurnRateChart({ data, title = "Churn Rate", threshold = 2.0 }: ChurnRateChartProps) {
  // Color function based on threshold
  const getColor = (rate: number) => {
    if (rate < threshold) return '#22c55e'; // Green
    if (rate <= threshold * 1.5) return '#eab308'; // Amber
    return '#ef4444'; // Red
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Monthly churn rate tracking</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 pb-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis 
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip 
              formatter={(value: any) => [`${value}%`, 'Churn Rate']}
              cursor={{fill: 'transparent'}}
            />
            <ReferenceLine y={threshold} label="Threshold" stroke="red" strokeDasharray="3 3" />
            <Bar dataKey="rate" name="Churn Rate">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.rate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
