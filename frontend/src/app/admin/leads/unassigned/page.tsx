"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { RefreshCw, Users, Check, Inbox, FileSpreadsheet } from "lucide-react";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  sourceForm: string;
  dateReceived: string;
}

interface SalesPerson {
  id: string;
  name: string;
}

export default function UnassignedLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [salesTeam, setSalesTeam] = useState<SalesPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDistributing, setIsDistributing] = useState(false);
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [leadsRes, teamRes] = await Promise.all([
        api.get("/leads/unassigned"),
        api.get("/reports/sales-team"),
      ]);
      setLeads(leadsRes.data);
      setSalesTeam(teamRes.data);
    } catch (err) {
      console.error("Failed to fetch inbox data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSyncSheet = async () => {
    setIsSyncingSheet(true);
    try {
      const res = await api.post("/leads/sync-sheet");
      if (res.data.synced > 0) {
        setSuccessMessage(`Synced ${res.data.synced} new lead${res.data.synced > 1 ? 's' : ''} from Google Sheet!`);
      } else {
        setSuccessMessage(`Google Sheet up to date (${res.data.total || 0} total rows).`);
      }
      fetchData();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      console.error("Failed to sync Google Sheet", err);
      alert("Failed to sync Google Sheet: " + (err.response?.data?.error || err.message));
    } finally {
      setIsSyncingSheet(false);
    }
  };

  const handleManualAssign = async (leadId: string, salesPersonId: string) => {
    if (!salesPersonId) return;
    try {
      await api.patch(`/leads/${leadId}/assign`, { salesPersonId });
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      setSuccessMessage("Lead assigned successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Failed to assign lead", err);
    }
  };

  const handleAutoDistribute = async () => {
    setIsDistributing(true);
    try {
      const res = await api.post("/leads/auto-assign");
      setSuccessMessage(res.data.message || "Leads distributed evenly!");
      fetchData();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      console.error("Auto-assign failed", err);
      alert(err.response?.data?.error || "Failed to auto-distribute leads");
    } finally {
      setIsDistributing(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif text-ink font-bold">Lead Inbox</h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-0.5">
            Incoming unassigned leads from Facebook & Google Sheets.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {successMessage && (
            <span className="text-success text-xs sm:text-sm flex items-center gap-1 font-medium bg-success/10 px-3 py-1.5 rounded-full w-full sm:w-auto justify-center">
              <Check size={14} /> {successMessage}
            </span>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSyncSheet}
            disabled={isSyncingSheet}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 h-9 sm:h-10 text-xs sm:text-sm border border-emerald-600/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
          >
            <FileSpreadsheet size={15} className={isSyncingSheet ? "animate-spin" : ""} />
            {isSyncingSheet ? "Syncing..." : "Sync Google Sheet"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 h-9 sm:h-10 text-xs sm:text-sm"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleAutoDistribute}
            disabled={isDistributing || leads.length === 0}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 h-9 sm:h-10 text-xs sm:text-sm font-semibold"
          >
            <Users size={14} />
            Auto-Distribute All
          </Button>
        </div>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-ink-soft">Loading inbox...</div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Inbox size={48} className="text-border mb-4" />
            <h3 className="text-lg font-medium text-ink">Inbox Zero</h3>
            <p className="text-ink-soft mt-1">All leads have been assigned.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-bg/50">
                  <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                    Date Received
                  </th>
                  <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                    Contact Details
                  </th>
                  <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                    Source
                  </th>
                  <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leads.map((lead) => (
                  <tr key={lead.id} className="ledger-row hover:bg-surface/50 transition-colors">
                    <td className="p-4 align-top">
                      <div className="font-mono text-sm text-ink whitespace-nowrap">
                        {new Date(lead.dateReceived).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-medium text-ink">{lead.name}</div>
                      <div className="font-mono text-sm text-ink-soft mt-1">
                        {lead.phone}
                      </div>
                      <div className="text-sm text-ink-soft">{lead.email}</div>
                    </td>
                    <td className="p-4 align-top">
                      <Badge variant="outline">{lead.sourceForm || "Website / Form"}</Badge>
                    </td>
                    <td className="p-4 align-top text-right">
                      <div className="flex justify-end">
                        <Select
                          className="w-48 bg-bg text-sm"
                          defaultValue=""
                          onChange={(e) =>
                            handleManualAssign(lead.id, e.target.value)
                          }
                        >
                          <option value="" disabled>
                            Assign to...
                          </option>
                          {salesTeam.map((rep) => (
                            <option key={rep.id} value={rep.id}>
                              {rep.name}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MOBILE CARDS VIEW */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="bg-surface border border-border rounded-xl p-6 text-center text-ink-soft">
            Loading inbox...
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-8 text-center flex flex-col items-center justify-center">
            <Inbox size={40} className="text-border mb-3" />
            <h3 className="text-base font-bold text-ink">Inbox Zero</h3>
            <p className="text-xs text-ink-soft mt-1">All leads have been assigned.</p>
          </div>
        ) : (
          leads.map((lead) => (
            <div key={lead.id} className="bg-surface border border-border rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-ink text-base">{lead.name}</h3>
                  <div className="font-mono text-xs text-ink-soft mt-0.5">{lead.phone}</div>
                  <div className="text-xs text-ink-soft">{lead.email}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-ink-soft block">
                    {new Date(lead.dateReceived).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  <Badge variant="outline" className="text-[10px] mt-1">
                    {lead.sourceForm || "Form"}
                  </Badge>
                </div>
              </div>

              <div className="pt-2 border-t border-border/60">
                <label className="block text-[10px] font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
                  Assign Lead To:
                </label>
                <Select
                  className="w-full bg-bg h-10 text-sm"
                  defaultValue=""
                  onChange={(e) => handleManualAssign(lead.id, e.target.value)}
                >
                  <option value="" disabled>
                    Select Sales Rep...
                  </option>
                  {salesTeam.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
