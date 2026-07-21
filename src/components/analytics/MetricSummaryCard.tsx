import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Activity, TrendingUp } from "lucide-react";

interface MetricSummaryCardProps {
  stats: {
    totalRevenue: number;
    revenueChange: number;
    momGrowth: number;
    momGrowthChange: number;
    activeUsers: number;
    activeUsersChange: number;
    churnRate: number;
    churnRateChange: number;
  };
}

export function MetricSummaryCard({ stats }: MetricSummaryCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const formatPercentage = (value: number) => {
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${value.toFixed(1)}%`;
  };

  const formatNumber = (value: number) => {
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${new Intl.NumberFormat('en-US').format(value)}`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">{formatPercentage(stats.revenueChange)} from last month</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">MoM Growth</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercentage(stats.momGrowth)}</div>
          <p className="text-xs text-muted-foreground">{formatPercentage(stats.momGrowthChange)} from last month</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.activeUsers)}</div>
          <p className="text-xs text-muted-foreground">{formatPercentage(stats.activeUsersChange)} from last month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.churnRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">{formatPercentage(stats.churnRateChange)} from last month</p>
        </CardContent>
      </Card>
    </div>
  );
}
