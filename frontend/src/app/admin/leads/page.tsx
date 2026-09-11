"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Filter, Search, Clock, FileSpreadsheet, Check, Upload, MessageCircle, UserPlus } from "lucide-react";
import ExcelImportModal from "@/components/ExcelImportModal";
import AddLeadModal from "@/components/AddLeadModal";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  source?: string;
  category: string | null;
  funnelStage: string | null;
  status: string;
  dateReceived: string;
  followUpAt?: string | null;
  followUpNotes?: string | null;
  aiChatHistory?: any;
  assignedTo: {
    id: string;
    name: string;
  } | null;
}

function formatFollowUpDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `Today at ${timeStr}`;
  if (isTomorrow) return `Tomorrow at ${timeStr}`;

  return `${date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} at ${timeStr}`;
}

interface SalesPerson {
  id: string;
  name: string;
}

export default function AllLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [salesTeam, setSalesTeam] = useState<SalesPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [selectedWhatsAppLead, setSelectedWhatsAppLead] = useState<Lead | null>(null);

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

  const handleSyncSheet = async () => {
    setIsSyncingSheet(true);
    try {
      const res = await api.post("/leads/sync-sheet");
      if (res.data.synced > 0) {
        setSyncMessage(`Synced ${res.data.synced} new lead${res.data.synced > 1 ? 's' : ''}!`);
      } else {
        setSyncMessage(`Google Sheet up to date (${res.data.total || 0} total rows).`);
      }
      fetchLeads();
      setTimeout(() => setSyncMessage(""), 4000);
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
      const rep = salesTeam.find((r) => r.id === salesPersonId);
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? { ...l, assignedTo: rep ? { id: rep.id, name: rep.name } : null }
            : l
        )
      );
      setSyncMessage(`Lead assigned to ${rep?.name || "Sales Rep"}!`);
      setTimeout(() => setSyncMessage(""), 3500);
    } catch (err) {
      console.error("Failed to assign lead", err);
      alert("Failed to assign lead.");
    }
  };

  useEffect(() => {
    fetchSalesTeam();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif text-ink font-bold">All Leads Ledger</h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-0.5">
            Master view of all leads across the organization.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {syncMessage && (
            <span className="text-success text-xs sm:text-sm flex items-center gap-1 font-medium bg-success/10 px-3 py-1.5 rounded-full">
              <Check size={14} /> {syncMessage}
            </span>
          )}
          <Button
            size="sm"
            onClick={() => setIsAddLeadModalOpen(true)}
            className="flex items-center justify-center gap-1.5 h-9 sm:h-10 text-xs sm:text-sm bg-accent hover:bg-accent/90 text-surface font-semibold shadow-sm"
          >
            <UserPlus size={15} />
            + Add Lead
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExcelModalOpen(true)}
            className="flex items-center justify-center gap-1.5 h-9 sm:h-10 text-xs sm:text-sm font-medium"
          >
            <Upload size={14} />
            Import Excel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSyncSheet}
            disabled={isSyncingSheet}
            className="flex items-center justify-center gap-1.5 h-9 sm:h-10 text-xs sm:text-sm border border-emerald-600/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
          >
            <FileSpreadsheet size={14} className={isSyncingSheet ? "animate-spin" : ""} />
            {isSyncingSheet ? "Syncing..." : "Sync Sheet"}
          </Button>
        </div>
      </div>

      <ExcelImportModal 
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onSuccess={(msg) => {
          setSyncMessage(msg);
          fetchLeads();
          setTimeout(() => setSyncMessage(""), 5000);
        }}
      />

      <AddLeadModal
        isOpen={isAddLeadModalOpen}
        onClose={() => setIsAddLeadModalOpen(false)}
        onOpenExcel={() => setIsExcelModalOpen(true)}
        onSuccess={(msg) => {
          setSyncMessage(msg);
          fetchLeads();
          setTimeout(() => setSyncMessage(""), 5000);
        }}
      />

      {/* Filters - Responsive Grid */}
      <div className="bg-surface border border-border p-3.5 sm:p-4 rounded-xl shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-[10px] font-semibold text-ink-soft uppercase tracking-wider mb-1">
            Assigned To
          </label>
          <Select
            className="w-full bg-bg h-10 text-sm"
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
        <div>
          <label className="block text-[10px] font-semibold text-ink-soft uppercase tracking-wider mb-1">
            Category
          </label>
          <Select className="w-full bg-bg h-10 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Any Category</option>
            <option value="HOT">Hot 🔥</option>
            <option value="WARM">Warm 🌤️</option>
            <option value="COLD">Cold ❄️</option>
          </Select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-ink-soft uppercase tracking-wider mb-1">
            Funnel Stage
          </label>
          <Select
            className="w-full bg-bg h-10 text-sm"
            value={funnelStage}
            onChange={(e) => setFunnelStage(e.target.value)}
          >
            <option value="">Any Stage</option>
            <option value="INTERESTED">Interested</option>
            <option value="OFFICE_VISIT_DONE">Office Visit Done</option>
            <option value="SITE_VISIT_DONE">Site Visit Done</option>
            <option value="DEAL_CLOSED">Deal Closed</option>
            <option value="NOT_INTERESTED">Not Interested</option>
            <option value="LOST">Lost</option>
          </Select>
        </div>
        <div>
          <Button
            variant="outline"
            className="w-full h-10 text-xs sm:text-sm justify-center"
            onClick={() => {
              setSalesPersonId("");
              setCategory("");
              setFunnelStage("");
            }}
          >
            <Filter size={14} className="mr-1.5" />
            Clear Filters
          </Button>
        </div>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
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

                      {/* Follow-Up Reminder Pill */}
                      {lead.followUpAt && (
                        <div className={`mt-2 p-2 rounded-lg border text-xs flex flex-col gap-0.5 ${
                          new Date(lead.followUpAt) < new Date()
                            ? "bg-danger/10 border-danger/30 text-danger"
                            : "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200"
                        }`}>
                          <div className="flex items-center gap-1.5 font-semibold">
                            <Clock size={12} className="text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>Follow-up: {formatFollowUpDate(lead.followUpAt)}</span>
                            {new Date(lead.followUpAt) < new Date() && (
                              <Badge variant="danger" className="text-[9px] py-0 px-1 ml-1">Overdue</Badge>
                            )}
                          </div>
                          {lead.followUpNotes && (
                            <div className="text-[11px] text-ink/80 flex items-start gap-1">
                              <span className="font-medium text-ink shrink-0">To ask:</span>
                              <span className="italic break-words">&ldquo;{lead.followUpNotes}&rdquo;</span>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4 align-top">
                      {lead.assignedTo ? (
                        <span className="text-ink font-medium">{lead.assignedTo.name}</span>
                      ) : (
                        <Select
                          className="w-36 bg-bg text-xs h-8 border-amber-500/30 text-amber-700 dark:text-amber-400 font-medium"
                          defaultValue=""
                          onChange={(e) => handleManualAssign(lead.id, e.target.value)}
                        >
                          <option value="" disabled>
                            Assign Rep...
                          </option>
                          {salesTeam.map((rep) => (
                            <option key={rep.id} value={rep.id}>
                              👤 {rep.name}
                            </option>
                          ))}
                        </Select>
                      )}
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex flex-col gap-2 items-start">
                        {lead.category ? (
                          <Badge
                            variant={
                              lead.category === "HOT"
                                ? "danger"
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

      {/* MOBILE CARDS VIEW */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="bg-surface border border-border rounded-xl p-6 text-center text-ink-soft">
            Loading records...
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-8 text-center flex flex-col items-center justify-center">
            <Search size={32} className="text-border mb-2" />
            <p className="font-bold text-ink">No leads found</p>
            <p className="text-xs text-ink-soft">Try changing your filters.</p>
          </div>
        ) : (
          leads.map((lead) => (
            <div key={lead.id} className="bg-surface border border-border rounded-xl p-4 shadow-sm space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-ink text-base">{lead.name}</h3>
                  <div className="font-mono text-xs text-ink-soft mt-0.5">{lead.phone}</div>
                  <div className="text-xs text-ink-soft">{lead.email}</div>
                </div>
                <div className="text-right">
                  <Badge variant={lead.status === "ACTIVE" ? "success" : "default"} className="text-[10px]">
                    {lead.status}
                  </Badge>
                  <span className="text-[10px] font-mono text-ink-soft block mt-1">
                    {new Date(lead.dateReceived).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Assignment & Badges */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs text-ink-soft">Rep:</span>
                {lead.assignedTo ? (
                  <span className="text-xs font-semibold text-ink bg-bg px-2 py-0.5 rounded border border-border">
                    {lead.assignedTo.name}
                  </span>
                ) : (
                  <Select
                    className="bg-bg text-xs h-7 border-amber-500/30 text-amber-700 dark:text-amber-400 font-medium"
                    defaultValue=""
                    onChange={(e) => handleManualAssign(lead.id, e.target.value)}
                  >
                    <option value="" disabled>
                      Assign Rep...
                    </option>
                    {salesTeam.map((rep) => (
                      <option key={rep.id} value={rep.id}>
                        👤 {rep.name}
                      </option>
                    ))}
                  </Select>
                )}
                {lead.category && (
                  <Badge
                    variant={
                      lead.category === "HOT"
                        ? "danger"
                        : lead.category === "WARM"
                        ? "warning"
                        : "default"
                    }
                    className="text-[10px]"
                  >
                    {lead.category}
                  </Badge>
                )}
                {lead.funnelStage && (
                  <Badge variant="outline" className="text-[10px]">
                    {lead.funnelStage.replace(/_/g, " ")}
                  </Badge>
                )}
              </div>

              {/* Follow up box */}
              {lead.followUpAt && (
                <div className={`p-2 rounded-lg border text-xs flex flex-col gap-0.5 ${
                  new Date(lead.followUpAt) < new Date()
                    ? "bg-danger/10 border-danger/30 text-danger"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200"
                }`}>
                  <div className="flex items-center gap-1 font-semibold">
                    <Clock size={12} className="text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Follow-up: {formatFollowUpDate(lead.followUpAt)}</span>
                    {new Date(lead.followUpAt) < new Date() && (
                      <Badge variant="danger" className="text-[8px] py-0 px-1 ml-1">Overdue</Badge>
                    )}
                  </div>
                  {lead.followUpNotes && (
                    <div className="text-[10px] text-ink/80 italic mt-0.5">
                      &ldquo;{lead.followUpNotes}&rdquo;
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
