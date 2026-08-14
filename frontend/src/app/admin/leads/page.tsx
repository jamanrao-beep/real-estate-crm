"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Filter, Search } from "lucide-react";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  category: string | null;
  funnelStage: string | null;
  status: string;
  dateReceived: string;
  assignedTo: {
    id: string;
    name: string;
  } | null;
}

interface SalesPerson {
  id: string;
  name: string;
}

export default function AllLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [salesTeam, setSalesTeam] = useState<SalesPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [salesPersonId, setSalesPersonId] = useState("");
  const [category, setCategory] = useState("");
  const [funnelStage, setFunnelStage] = useState("");

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (salesPersonId) params.append("salesPersonId", salesPersonId);
      if (category) params.append("category", category);
      if (funnelStage) params.append("funnelStage", funnelStage);

      const res = await api.get(`/leads?${params.toString()}`);
      setLeads(res.data);
    } catch (err) {
      console.error("Failed to fetch leads", err);
    } finally {
      setIsLoading(false);
    }
  }, [salesPersonId, category, funnelStage]);

  const fetchSalesTeam = async () => {
    try {
      const res = await api.get("/auth/users");
      setSalesTeam(res.data);
    } catch (err) {
      console.error("Failed to fetch sales team", err);
    }
  };

  useEffect(() => {
    fetchSalesTeam();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif text-ink">All Leads Ledger</h1>
        <p className="text-sm text-ink-soft mt-1">
          Master view of all leads across the organization.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-surface border border-border p-4 rounded-lg flex flex-wrap gap-4 items-end">
        <div className="w-48">
          <label className="block text-xs font-medium text-ink-soft mb-1 uppercase tracking-wider">
            Assigned To
          </label>
          <Select
            value={salesPersonId}
            onChange={(e) => setSalesPersonId(e.target.value)}
          >
            <option value="">Any Rep</option>
            {salesTeam.map((rep) => (
              <option key={rep.id} value={rep.id}>
                {rep.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <label className="block text-xs font-medium text-ink-soft mb-1 uppercase tracking-wider">
            Category
          </label>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Any Category</option>
            <option value="HOT">Hot</option>
            <option value="WARM">Warm</option>
            <option value="COLD">Cold</option>
          </Select>
        </div>
        <div className="w-48">
          <label className="block text-xs font-medium text-ink-soft mb-1 uppercase tracking-wider">
            Funnel Stage
          </label>
          <Select
            value={funnelStage}
            onChange={(e) => setFunnelStage(e.target.value)}
          >
            <option value="">Any Stage</option>
            <option value="INTERESTED">Interested</option>
            <option value="SITE_VISIT_DONE">Site Visit Done</option>
            <option value="DEAL_CLOSED">Deal Closed</option>
            <option value="LOST">Lost</option>
          </Select>
        </div>
        <div>
          <Button variant="outline" onClick={() => {
            setSalesPersonId("");
            setCategory("");
            setFunnelStage("");
          }}>
            <Filter size={16} className="mr-2" />
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-bg/50">
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                  Contact
                </th>
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                  Category & Stage
                </th>
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                  Status
                </th>
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider text-right">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-ink-soft">
                    Loading records...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-ink-soft flex items-center justify-center gap-2">
                    <Search size={16} /> No leads found matching criteria.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-surface/50 transition-colors">
                    <td className="p-4 align-top">
                      <div className="font-medium text-ink">{lead.name}</div>
                      <div className="font-mono text-sm text-ink-soft mt-1">
                        {lead.phone}
                      </div>
                      <div className="text-sm text-ink-soft">{lead.email}</div>
                    </td>
                    <td className="p-4 align-top">
                      {lead.assignedTo ? (
                        <span className="text-ink font-medium">{lead.assignedTo.name}</span>
                      ) : (
                        <span className="text-ink-soft italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex flex-col gap-2 items-start">
                        {lead.category ? (
                          <Badge
                            variant={
                              lead.category === "HOT"
                                ? "danger" // We mapped danger to a warm brick color
                                : lead.category === "WARM"
                                ? "warning"
                                : "default"
                            }
                          >
                            {lead.category}
                          </Badge>
                        ) : (
                          <span className="text-xs text-ink-soft">—</span>
                        )}
                        {lead.funnelStage ? (
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {lead.funnelStage.replace(/_/g, " ")}
                          </Badge>
                        ) : null}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <Badge
                        variant={lead.status === "ACTIVE" ? "success" : "default"}
                      >
                        {lead.status}
                      </Badge>
                    </td>
                    <td className="p-4 align-top text-right">
                      <div className="font-mono text-sm text-ink">
                        {new Date(lead.dateReceived).toLocaleDateString()}
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
