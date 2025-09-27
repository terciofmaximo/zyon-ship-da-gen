'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Ship, DollarSign, FileText } from "lucide-react";

export function DashboardStats() {
  const stats = [
    {
      title: "PDAs Ativos",
      value: "12",
      change: "+2 este mês",
      icon: FileText,
      trend: "up"
    },
    {
      title: "Navios em Porto", 
      value: "8",
      change: "+1 hoje",
      icon: Ship,
      trend: "up"
    },
    {
      title: "Receita Mensal",
      value: "R$ 847.2K", 
      change: "+12.5% vs mês anterior",
      icon: DollarSign,
      trend: "up"
    },
    {
      title: "Eficiência Operacional",
      value: "94.2%",
      change: "+2.1% vs mês anterior", 
      icon: TrendingUp,
      trend: "up"
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}