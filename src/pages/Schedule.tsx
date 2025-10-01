import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Calendar, ChevronLeft, ChevronRight, Anchor, Ship } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useOrg } from "@/context/OrgProvider";
import { useFDASchedule, FDAScheduleItem, FDAMilestone } from "@/hooks/useFDASchedule";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, addMonths, subMonths, isSameDay, startOfWeek, endOfWeek, parseISO, isWithinInterval } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function Schedule() {
  const navigate = useNavigate();
  const { activeOrg } = useOrg();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const { data, isLoading } = useFDASchedule({
    monthStart,
    monthEnd,
    tenantId: activeOrg?.id || null,
  });

  const items = data?.items || [];
  const fdas = data?.fdas || [];

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

  // Group ETA events by date
  const etaByDate = fdas.reduce((acc, fda) => {
    if (!fda.eta) return acc;
    const dateKey = format(parseISO(fda.eta), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(fda);
    return acc;
  }, {} as Record<string, FDAMilestone[]>);

  // Calculate port stay ranges (ETB to ETS)
  const portStays = fdas
    .filter(fda => fda.etb && fda.ets)
    .map(fda => ({
      fda,
      start: parseISO(fda.etb!),
      end: parseISO(fda.ets!),
    }));

  // Group port stays by date
  const portStaysByDate = portStays.reduce((acc, stay) => {
    const days = eachDayOfInterval({ start: stay.start, end: stay.end });
    days.forEach(day => {
      const dateKey = format(day, "yyyy-MM-dd");
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(stay);
    });
    return acc;
  }, {} as Record<string, typeof portStays>);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDayClick = (day: Date) => {
    const dateKey = format(day, "yyyy-MM-dd");
    if (itemsByDate[dateKey] || etaByDate[dateKey] || portStaysByDate[dateKey]) {
      setSelectedDate(day);
    }
  };

  const selectedItems = selectedDate ? itemsByDate[format(selectedDate, "yyyy-MM-dd")] || [] : [];
  const selectedEtas = selectedDate ? etaByDate[format(selectedDate, "yyyy-MM-dd")] || [] : [];
  const selectedPortStays = selectedDate ? portStaysByDate[format(selectedDate, "yyyy-MM-dd")] || [] : [];

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
                  const dayEtas = etaByDate[dateKey] || [];
                  const dayPortStays = portStaysByDate[dateKey] || [];
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  const hasItems = dayItems.length > 0;
                  const hasEvents = hasItems || dayEtas.length > 0 || dayPortStays.length > 0;
                  const total = getDayTotal(dayItems);

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => handleDayClick(day)}
                      className={`
                        min-h-[120px] border rounded-lg p-2 relative overflow-hidden
                        ${!isCurrentMonth ? "bg-muted/30 text-muted-foreground" : "bg-card"}
                        ${hasEvents ? "cursor-pointer hover:border-primary hover:bg-accent/50" : ""}
                        transition-colors
                      `}
                    >
                      <div className="font-medium text-sm mb-1">{format(day, "d")}</div>
                      
                      {/* ETA events */}
                      {dayEtas.length > 0 && (
                        <div className="space-y-1 mb-2">
                          {dayEtas.slice(0, 2).map((fda) => (
                            <div
                              key={`eta-${fda.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/fda/${fda.id}`);
                              }}
                              className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs hover:bg-primary/20 transition-colors"
                              title={`ETA: ${fda.vessel_name} at ${format(parseISO(fda.eta!), "HH:mm")}`}
                            >
                              <Ship className="h-3 w-3" />
                              <span className="truncate font-medium">{format(parseISO(fda.eta!), "HH:mm")}</span>
                            </div>
                          ))}
                          {dayEtas.length > 2 && (
                            <div className="text-xs text-muted-foreground px-2">+{dayEtas.length - 2} more</div>
                          )}
                        </div>
                      )}

                      {/* Port stays */}
                      {dayPortStays.length > 0 && (
                        <div className="space-y-1 mb-2">
                          {dayPortStays.slice(0, 2).map((stay, idx) => {
                            const isFirst = isSameDay(stay.start, day);
                            const isLast = isSameDay(stay.end, day);
                            return (
                              <div
                                key={`stay-${stay.fda.id}-${idx}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/fda/${stay.fda.id}`);
                                }}
                                className={`px-2 py-1 bg-primary text-primary-foreground text-xs hover:bg-primary/90 transition-colors ${
                                  isFirst && isLast ? "rounded-full" : isFirst ? "rounded-l-full" : isLast ? "rounded-r-full" : ""
                                }`}
                                title={`${stay.fda.vessel_name} at ${stay.fda.port}`}
                              >
                                {isFirst && (
                                  <div className="flex items-center gap-1">
                                    <Anchor className="h-3 w-3" />
                                    <span className="truncate font-medium">{stay.fda.vessel_name}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {dayPortStays.length > 2 && (
                            <div className="text-xs text-muted-foreground px-2">+{dayPortStays.length - 2} more</div>
                          )}
                        </div>
                      )}

                      {/* Financial dues */}
                      {hasItems && (
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            {dayItems.length} due
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
              {selectedDate ? format(selectedDate, "dd MMM yyyy") : ""}
            </DrawerTitle>
          </DrawerHeader>
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Port Calls Section */}
            {(selectedEtas.length > 0 || selectedPortStays.length > 0) && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Ship className="h-4 w-4" />
                  Port Calls
                </h3>
                {selectedEtas.map((fda) => (
                  <Card key={`eta-${fda.id}`} className="hover:border-primary transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Ship className="h-4 w-4 text-primary" />
                            <span className="font-semibold">ETA · {fda.vessel_name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(fda.eta!), "HH:mm")} · {fda.port}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => navigate(`/fda/${fda.id}`)}
                        >
                          Open FDA
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {selectedPortStays.map((stay, idx) => (
                  <Card key={`stay-${stay.fda.id}-${idx}`} className="hover:border-primary transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Anchor className="h-4 w-4 text-primary" />
                            <span className="font-semibold">ETB–ETS · {stay.fda.vessel_name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(stay.start, "dd/MM")} → {format(stay.end, "dd/MM")} · {stay.fda.port}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => navigate(`/fda/${stay.fda.id}`)}
                        >
                          Open FDA
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Financial Dues Section */}
            {selectedItems.length > 0 && (
              <div className="space-y-3">
                {(selectedEtas.length > 0 || selectedPortStays.length > 0) && <Separator />}
                <h3 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Financial Dues
                </h3>
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
            )}

            {selectedItems.length === 0 && selectedEtas.length === 0 && selectedPortStays.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No events on this day.
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
