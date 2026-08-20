"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Search } from "lucide-react";

interface Lead {
  id: string;
  name: string;
  phone: string;
  funnelStage: string;
  dateReceived: string;
  updatedAt: string;
}

export default function BrokerDealsPage() {
  const [closedLeads, setClosedLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const leadsRes = await api.get("/broker/leads");
      setClosedLeads(leadsRes.data.filter((l: Lead) => l.funnelStage === "DEAL_CLOSED"));
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-ink">Closed Deals (Commissions)</h1>
          <p className="text-sm text-ink-soft mt-1">
            Track your referred leads that have successfully closed.
          </p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-bg/50">
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                  Client Name
                </th>
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider text-right">
                  Phone
                </th>
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider text-right">
                  Date Submitted
                </th>
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider text-right">
                  Date Closed
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-ink-soft">
                    Loading deals...
                  </td>
                </tr>
              ) : closedLeads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-ink-soft flex items-center justify-center gap-2">
                    <Search size={16} /> No closed deals yet.
                  </td>
                </tr>
              ) : (
                closedLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-surface/50 transition-colors">
                    <td className="p-4 align-top">
                      <div className="font-medium text-ink">{lead.name}</div>
                    </td>
                    <td className="p-4 align-top text-right">
                      <div className="font-mono text-ink-soft">
                        {lead.phone}
                      </div>
                    </td>
                    <td className="p-4 align-top text-right text-sm text-ink-soft">
                      {new Date(lead.dateReceived).toLocaleDateString()}
                    </td>
                    <td className="p-4 align-top text-right text-sm text-success font-medium">
                      <div>{new Date(lead.updatedAt).toLocaleDateString()}</div>
                      <div className="text-xs text-success/70 mt-0.5">{new Date(lead.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
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
