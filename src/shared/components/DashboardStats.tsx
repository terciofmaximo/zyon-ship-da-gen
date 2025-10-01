import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Ship, DollarSign, Clock } from "lucide-react";

const stats = [
  {
    title: "PDAs Generated",
    value: "127",
    icon: FileText,
    description: "This month",
    trend: "+12%",
  },
  {
    title: "Active Vessels",
    value: "23",
    icon: Ship,
    description: "Currently docked",
    trend: "+3",
  },
  {
    title: "Total Revenue",
    value: "$486,420",
    icon: DollarSign,
    description: "This quarter",
    trend: "+18%",
  },
  {
    title: "Avg. Processing Time",
    value: "8.2 min",
    icon: Clock,
    description: "50% faster than manual",
    trend: "-3.1 min",
  },
];

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card key={stat.title} className="shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              <span className="text-xs font-medium text-success">{stat.trend}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}