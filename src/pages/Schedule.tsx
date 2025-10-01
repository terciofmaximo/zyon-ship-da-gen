import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useOrg } from "@/context/OrgProvider";
import { useFDASchedule, FDAScheduleItem } from "@/hooks/useFDASchedule";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, addMonths, subMonths, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function Schedule() {
  const navigate = useNavigate();
  const { activeOrg } = useOrg();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const { data: items = [], isLoading } = useFDASchedule({
    monthStart,
    monthEnd,
    tenantId: activeOrg?.id || null,
  });

  // Get calendar grid (includes leading/trailing days)
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group items by date
  const itemsByDate = items.reduce((acc, item) => {
    if (!item.due_date) return acc;
    const dateKey = format(new Date(item.due_date), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {} as Record<string, FDAScheduleItem[]>);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDayClick = (day: Date) => {
    const dateKey = format(day, "yyyy-MM-dd");
    if (itemsByDate[dateKey]) {
      setSelectedDate(day);
    }
  };

  const selectedItems = selectedDate ? itemsByDate[format(selectedDate, "yyyy-MM-dd")] || [] : [];

  const getDayTotal = (dayItems: FDAScheduleItem[]) => {
    const total = dayItems.reduce((sum, item) => sum + (item.amount_usd || 0), 0);
    return total;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Schedule</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[200px] text-center font-semibold">
                {format(currentMonth, "MMMM yyyy")}
              </div>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
          ) : (
            <>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Day headers */}
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {calendarDays.map((day) => {
                  const dateKey = format(day, "yyyy-MM-dd");
                  const dayItems = itemsByDate[dateKey] || [];
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  const hasItems = dayItems.length > 0;
                  const total = getDayTotal(dayItems);

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => handleDayClick(day)}
                      className={`
                        min-h-[100px] border rounded-lg p-2
                        ${!isCurrentMonth ? "bg-muted/30 text-muted-foreground" : "bg-card"}
                        ${hasItems ? "cursor-pointer hover:border-primary hover:bg-accent/50" : ""}
                        transition-colors
                      `}
                    >
                      <div className="font-medium text-sm mb-1">{format(day, "d")}</div>
                      {hasItems && (
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            {dayItems.length} item{dayItems.length > 1 ? "s" : ""}
                          </div>
                          <div className="text-xs font-semibold text-primary">
                            ${total.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {items.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum compromisso financeiro neste mês.
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Day Details Drawer */}
      <Drawer open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              Due on {selectedDate ? format(selectedDate, "dd MMM yyyy") : ""}
            </DrawerTitle>
          </DrawerHeader>
          <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
            {selectedItems.map((item) => (
              <Card key={item.id} className="hover:border-primary transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{item.category || "Uncategorized"}</span>
                        {item.side && (
                          <Badge variant={item.side === "AP" ? "destructive" : "default"} className="text-xs">
                            {item.side === "AP" ? "Payable" : "Receivable"}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {item.status}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      )}
                      <div className="flex gap-4 text-sm">
                        {item.amount_usd && (
                          <span className="font-medium">
                            USD ${item.amount_usd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        )}
                        {item.amount_local && (
                          <span className="text-muted-foreground">
                            BRL R${item.amount_local.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/fda/${item.fda_id}/line/${item.id}`)}
                    >
                      Open Line Detail
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
