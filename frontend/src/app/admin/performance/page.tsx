"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { RefreshCw, TrendingUp, Phone, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PerformanceResult {
  salesPerson: {
    id: string;
    name: string;
  };
  totalLeadsReceived: number;
  totalLeadsConverted: number;
  siteVisitsDone: number;
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
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const fetchPerformance = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/reports/performance?month=${month}&year=${year}`);
      setResults(res.data.results);
    } catch (err) {
      console.error("Failed to fetch performance", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-ink">Performance Dashboard</h1>
          <p className="text-sm text-ink-soft mt-1">
            Monthly metrics across the sales team.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-surface p-2 border border-border rounded-lg">
          <Select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-32 bg-bg"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(0, m - 1).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </Select>
          <Select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-28 bg-bg"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
          <Button
            variant="ghost"
            onClick={fetchPerformance}
            disabled={isLoading}
            className="px-2"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
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
                      <div className="mt-4 flex gap-2 flex-wrap">
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
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2 text-ink">
                          <span className="text-sm text-ink-soft">Site Visits</span>
                          <span className="font-mono font-medium">{r.siteVisitsDone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-ink">
                          <span className="text-sm text-ink-soft">Calls ({r.callHours}h)</span>
                          <span className="font-mono font-medium">{r.numberOfCalls}</span>
                          <Phone size={14} className="text-ink-soft" />
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
    </div>
  );
}
