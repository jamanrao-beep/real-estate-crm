"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { RefreshCw, TrendingUp, Phone, Users, DollarSign, FileDown, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PerformanceResult {
  salesPerson: {
    id: string;
    name: string;
  };
  totalLeadsReceived: number;
  totalLeadsConverted: number;
  siteVisitsDone: number;
  officeVisitsDone?: number;
  numberOfCalls: number;
  callHours: number;
  categoryBreakdown: { category: string; count: number }[];
  funnelBreakdown: { stage: string; count: number }[];
  totalSalesValueClosed: number;
  totalPaymentsCollected: number;
}

export default function PerformanceDashboard() {
  const [results, setResults] = useState<PerformanceResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<"month" | "date">("month");
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());

  // Format today's date in local YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr);

  const shiftDate = (days: number) => {
    if (!selectedDate) return;
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);
    const newY = dateObj.getFullYear();
    const newM = String(dateObj.getMonth() + 1).padStart(2, "0");
    const newD = String(dateObj.getDate()).padStart(2, "0");
    setSelectedDate(`${newY}-${newM}-${newD}`);
  };

  const setToday = () => {
    setSelectedDate(getTodayStr());
  };

  const setYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setSelectedDate(`${y}-${m}-${day}`);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    const todayStr = getTodayStr();

    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const yestY = yest.getFullYear();
    const yestM = String(yest.getMonth() + 1).padStart(2, "0");
    const yestD = String(yest.getDate()).padStart(2, "0");
    const yestStr = `${yestY}-${yestM}-${yestD}`;

    const formatted = dateObj.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    if (dateStr === todayStr) return `Today (${formatted})`;
    if (dateStr === yestStr) return `Yesterday (${formatted})`;
    return formatted;
  };

  const fetchPerformance = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = "";
      if (filterMode === "date" && selectedDate) {
        const [y, m, d] = selectedDate.split("-").map(Number);
        const startOfDay = new Date(y, m - 1, d, 0, 0, 0, 0);
        const endOfDay = new Date(y, m - 1, d + 1, 0, 0, 0, 0);
        query = `date=${selectedDate}&startDate=${startOfDay.toISOString()}&endDate=${endOfDay.toISOString()}&timezoneOffset=${new Date().getTimezoneOffset()}`;
      } else {
        query = `month=${month}&year=${year}`;
      }
      const res = await api.get(`/reports/performance?${query}`);
      setResults(res.data.results);
    } catch (err) {
      console.error("Failed to fetch performance", err);
    } finally {
      setIsLoading(false);
    }
  }, [filterMode, month, year, selectedDate]);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  const handleDownloadCSV = async () => {
    try {
      let query = "";
      let filename = "";
      if (filterMode === "date" && selectedDate) {
        const [y, m, d] = selectedDate.split("-").map(Number);
        const startOfDay = new Date(y, m - 1, d, 0, 0, 0, 0);
        const endOfDay = new Date(y, m - 1, d + 1, 0, 0, 0, 0);
        query = `date=${selectedDate}&startDate=${startOfDay.toISOString()}&endDate=${endOfDay.toISOString()}&timezoneOffset=${new Date().getTimezoneOffset()}`;
        filename = `performance_report_${selectedDate}.csv`;
      } else {
        query = `month=${month}&year=${year}`;
        filename = `performance_report_${year}_${month}.csv`;
      }

      const res = await api.get(`/reports/performance/export?${query}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to download CSV", err);
      alert("Failed to download CSV");
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(val);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif text-ink font-bold">Performance Dashboard</h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-0.5">
            {filterMode === "date" ? (
              <span>
                Daily performance metrics for <strong className="text-ink">{formatDisplayDate(selectedDate)}</strong>
              </span>
            ) : (
              <span>
                Monthly metrics for <strong className="text-ink">{new Date(parseInt(year), parseInt(month) - 1).toLocaleString("default", { month: "long" })} {year}</strong>
              </span>
            )}
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2 bg-surface p-1.5 sm:p-2 border border-border rounded-xl shadow-xs">
          {/* Mode Switcher Toggle */}
          <div className="flex items-center bg-bg p-0.5 rounded-lg border border-border text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilterMode("month")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filterMode === "month"
                  ? "bg-surface text-ink font-bold shadow-xs"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              📅 Month
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("date")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filterMode === "date"
                  ? "bg-surface text-ink font-bold shadow-xs"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              📆 Select Date
            </button>
          </div>

          {/* Month & Year Selectors */}
          {filterMode === "month" && (
            <div className="flex items-center gap-1.5">
              <Select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-28 sm:w-32 bg-bg h-9 text-xs sm:text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(0, m - 1).toLocaleString("default", { month: "short" })}
                  </option>
                ))}
              </Select>
              <Select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-24 bg-bg h-9 text-xs sm:text-sm"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {/* Date Selector & Navigation */}
          {filterMode === "date" && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => shiftDate(-1)}
                  title="Previous Day"
                  className="h-9 px-2 bg-bg hover:bg-surface border border-border rounded-l-lg text-ink-soft hover:text-ink text-xs font-bold transition-colors flex items-center justify-center"
                >
                  <ChevronLeft size={15} />
                </button>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-9 px-2 bg-bg text-ink text-xs sm:text-sm border-y border-border font-medium focus:outline-none focus:ring-1 focus:ring-accent"
                />

                <button
                  type="button"
                  onClick={() => shiftDate(1)}
                  title="Next Day"
                  className="h-9 px-2 bg-bg hover:bg-surface border border-border rounded-r-lg text-ink-soft hover:text-ink text-xs font-bold transition-colors flex items-center justify-center"
                >
                  <ChevronRight size={15} />
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={setToday}
                  className={`h-9 px-2.5 text-xs font-medium rounded-lg border transition-colors ${
                    selectedDate === getTodayStr()
                      ? "bg-accent/15 border-accent text-accent font-bold"
                      : "bg-bg hover:bg-surface border-border text-ink-soft"
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={setYesterday}
                  className="h-9 px-2 text-xs font-medium rounded-lg bg-bg hover:bg-surface border border-border text-ink-soft transition-colors"
                >
                  Yesterday
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchPerformance}
              disabled={isLoading}
              className="h-9 px-2.5"
              title="Refresh"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin text-accent" : "text-ink-soft"} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCSV}
              disabled={isLoading}
              className="h-9 text-xs sm:text-sm flex items-center gap-1.5 font-medium px-3"
            >
              <FileDown size={14} />
              <span className="hidden sm:inline">Export</span> CSV
            </Button>
          </div>
        </div>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-bg/50">
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                  Sales Person
                </th>
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider text-right">
                  Leads & Conversions
                </th>
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider text-right">
                  Activity
                </th>
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider text-right">
                  Financials
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-ink-soft">
                    Computing metrics...
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-ink-soft">
                    No sales people found.
                  </td>
                </tr>
              ) : (
                results.map((r) => (
                  <tr key={r.salesPerson.id} className="hover:bg-surface/50 transition-colors">
                    <td className="p-4 align-top">
                      <div className="font-medium text-ink text-lg">{r.salesPerson.name}</div>
                      <div className="mt-4 flex flex-col gap-2">
                        <div className="flex gap-2 flex-wrap">
                          {r.categoryBreakdown.map((cb) => (
                            <Badge
                              key={cb.category}
                              variant={
                                cb.category === "HOT"
                                  ? "danger"
                                  : cb.category === "WARM"
                                  ? "warning"
                                  : "default"
                              }
                            >
                              {cb.count} {cb.category}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2 flex-wrap mt-1">
                          {r.funnelBreakdown.map((fb) => (
                            <Badge key={fb.stage} variant="outline" className="text-[10px] font-mono">
                              {fb.count} {fb.stage.replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-top text-right">
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2 text-ink">
                          <span className="text-sm text-ink-soft">Received</span>
                          <span className="font-mono font-medium">{r.totalLeadsReceived}</span>
                          <Users size={14} className="text-ink-soft" />
                        </div>
                        <div className="flex items-center gap-2 text-success">
                          <span className="text-sm text-ink-soft">Converted</span>
                          <span className="font-mono font-medium">{r.totalLeadsConverted}</span>
                          <TrendingUp size={14} />
                        </div>
                        <div className="text-xs text-ink-soft mt-1">
                          Conversion Rate:{" "}
                          {r.totalLeadsReceived
                            ? Math.round((r.totalLeadsConverted / r.totalLeadsReceived) * 100)
                            : 0}
                          %
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-top text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-1.5 text-ink font-medium">
                          <span className="text-sm text-ink-soft">Calls</span>
                          <span className="font-mono font-medium">{r.numberOfCalls}</span>
                          <span className="text-xs text-ink-soft font-normal">({r.callHours}h)</span>
                          <Phone size={13} className="text-ink-soft shrink-0" />
                        </div>

                        <div className="flex items-center gap-2 text-ink mt-0.5">
                          <span className="text-sm text-ink-soft">Site Visits</span>
                          <span className="font-mono font-medium">{r.siteVisitsDone || 0}</span>
                        </div>
                        <div className="text-xs text-ink-soft">
                          Site Visit Rate:{" "}
                          {r.totalLeadsReceived
                            ? Math.round(((r.siteVisitsDone || 0) / r.totalLeadsReceived) * 100)
                            : 0}
                          %
                        </div>

                        <div className="flex items-center gap-2 text-ink mt-0.5">
                          <span className="text-sm text-ink-soft">Office Visits</span>
                          <span className="font-mono font-medium">{r.officeVisitsDone || 0}</span>
                        </div>
                        <div className="text-xs text-ink-soft">
                          Office Visit Rate:{" "}
                          {r.totalLeadsReceived
                            ? Math.round(((r.officeVisitsDone || 0) / r.totalLeadsReceived) * 100)
                            : 0}
                          %
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-top text-right bg-bg/20">
                      <div className="flex flex-col items-end gap-3">
                        <div>
                          <div className="text-xs text-ink-soft uppercase tracking-wider mb-1">
                            Sales Value
                          </div>
                          <div className="font-serif text-lg text-ink">
                            {formatCurrency(r.totalSalesValueClosed)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-ink-soft uppercase tracking-wider mb-1">
                            Collected
                          </div>
                          <div className="font-mono font-medium text-success">
                            {formatCurrency(r.totalPaymentsCollected)}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE SCORECARD VIEW */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="bg-surface border border-border rounded-xl p-6 text-center text-ink-soft">
            Computing metrics...
          </div>
        ) : results.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-8 text-center text-ink-soft">
            No sales team data for this period.
          </div>
        ) : (
          results.map((r) => {
            const conversionRate = r.totalLeadsReceived
              ? Math.round((r.totalLeadsConverted / r.totalLeadsReceived) * 100)
              : 0;
            return (
              <div key={r.salesPerson.id} className="bg-surface border border-border rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <h3 className="font-bold text-ink text-base">{r.salesPerson.name}</h3>
                  <Badge variant="outline" className="text-xs font-mono font-bold text-accent">
                    {conversionRate}% Conv.
                  </Badge>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-bg p-2.5 rounded-lg border border-border/60">
                    <span className="text-[10px] text-ink-soft uppercase tracking-wider block">Leads</span>
                    <span className="font-bold text-ink text-sm">{r.totalLeadsReceived} Rec / {r.totalLeadsConverted} Won</span>
                  </div>
                  <div className="bg-bg p-2.5 rounded-lg border border-border/60">
                    <span className="text-[10px] text-ink-soft uppercase tracking-wider block">Calls</span>
                    <span className="font-bold text-ink text-sm">{r.numberOfCalls} calls ({r.callHours}h)</span>
                  </div>
                  <div className="bg-bg p-2.5 rounded-lg border border-border/60">
                    <span className="text-[10px] text-ink-soft uppercase tracking-wider block">Visits</span>
                    <span className="font-bold text-ink text-sm">
                      {r.siteVisitsDone || 0} Site / {r.officeVisitsDone || 0} Office
                    </span>
                  </div>
                  <div className="bg-bg p-2.5 rounded-lg border border-border/60">
                    <span className="text-[10px] text-ink-soft uppercase tracking-wider block">Sales Value</span>
                    <span className="font-bold text-ink text-sm">{formatCurrency(r.totalSalesValueClosed)}</span>
                  </div>
                  <div className="bg-success/10 p-2.5 rounded-lg border border-success/30 col-span-2">
                    <span className="text-[10px] text-success uppercase tracking-wider block font-semibold">Collected</span>
                    <span className="font-bold text-success text-sm">{formatCurrency(r.totalPaymentsCollected)}</span>
                  </div>
                </div>

                {/* Category & Funnel Chips */}
                <div className="pt-1 flex flex-wrap gap-1">
                  {r.categoryBreakdown.map((cb) => (
                    <Badge
                      key={cb.category}
                      variant={
                        cb.category === "HOT"
                          ? "danger"
                          : cb.category === "WARM"
                          ? "warning"
                          : "default"
                      }
                      className="text-[9px]"
                    >
                      {cb.count} {cb.category}
                    </Badge>
                  ))}
                  {r.funnelBreakdown.map((fb) => (
                    <Badge key={fb.stage} variant="outline" className="text-[9px] font-mono">
                      {fb.count} {fb.stage.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
