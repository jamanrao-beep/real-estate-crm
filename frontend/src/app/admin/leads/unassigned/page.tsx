"use client";

import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { 
  RefreshCw, 
  Users, 
  Check, 
  Inbox, 
  FileSpreadsheet, 
  Upload, 
  Bot, 
  UserPlus, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Sparkles,
  ExternalLink,
  UserCheck,
  UserX,
  SlidersHorizontal
} from "lucide-react";
import ExcelImportModal from "@/components/ExcelImportModal";
import WhatsAppChatModal from "@/components/WhatsAppChatModal";
import AddLeadModal from "@/components/AddLeadModal";
import TeamDistributionModal, { SalesMember } from "@/components/TeamDistributionModal";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: string;
  sourceForm?: string;
  formAnswers?: any;
  category?: string | null;
  funnelStage?: string | null;
  dateReceived: string;
  aiChatHistory?: any;
}

export default function UnassignedLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [salesTeam, setSalesTeam] = useState<SalesMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDistributing, setIsDistributing] = useState(false);
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isDistributionModalOpen, setIsDistributionModalOpen] = useState(false);
  const [togglingRepId, setTogglingRepId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedWhatsAppLead, setSelectedWhatsAppLead] = useState<Lead | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch unassigned leads
      try {
        const leadsRes = await api.get("/leads/unassigned");
        setLeads(Array.isArray(leadsRes.data) ? leadsRes.data : []);
      } catch (leadErr) {
        console.error("Failed to fetch unassigned leads", leadErr);
      }

      // 2. Fetch sales representatives for lead assignment & distribution
      try {
        const teamRes = await api.get("/auth/users");
        const allUsers = Array.isArray(teamRes.data) ? teamRes.data : [];
        const salesOnly = allUsers.filter((u: any) => u.role === "SALES_PERSON" || u.role === "SALES");
        setSalesTeam(salesOnly.length > 0 ? salesOnly : allUsers);
      } catch (teamErr) {
        try {
          const fallbackRes = await api.get("/reports/sales-team");
          setSalesTeam(Array.isArray(fallbackRes.data) ? fallbackRes.data : []);
        } catch (fbErr) {
          console.error("Failed to fetch sales team", teamErr);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleDutyStatus = async (rep: SalesMember) => {
    const newStatus = !rep.isActive;
    setTogglingRepId(rep.id);
    try {
      await api.patch(`/auth/users/${rep.id}/availability`, { isActive: newStatus });
      setSalesTeam((prev) =>
        prev.map((m) => (m.id === rep.id ? { ...m, isActive: newStatus } : m))
      );
      setSuccessMessage(
        `${rep.name} is now ${newStatus ? "On Duty (Receiving leads)" : "On Leave (Excluded from leads)"}`
      );
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      console.error("Failed to toggle duty status", err);
      alert("Failed to update status. Please try again.");
    } finally {
      setTogglingRepId(null);
    }
  };

  const handleSyncSheet = async () => {
    setIsSyncingSheet(true);
    try {
      const res = await api.post("/leads/sync-sheet");
      if (res.data.synced > 0) {
        setSuccessMessage(`Synced ${res.data.synced} new lead${res.data.synced > 1 ? "s" : ""} from Google Sheet!`);
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
    setAssigningId(leadId);
    try {
      const res = await api.patch(`/leads/${leadId}/assign`, { salesPersonId });
      const assignedRep = salesTeam.find((r) => r.id === salesPersonId);
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      setSuccessMessage(`Lead assigned to ${assignedRep?.name || "Sales Rep"}!`);
      setTimeout(() => setSuccessMessage(""), 3500);
    } catch (err) {
      console.error("Failed to assign lead", err);
      alert("Failed to assign lead. Please try again.");
    } finally {
      setAssigningId(null);
    }
  };

  // Open selective distribution modal
  const handleOpenDistributionModal = () => {
    if (leads.length === 0) {
      alert("There are no unassigned leads in the inbox to distribute.");
      return;
    }
    setIsDistributionModalOpen(true);
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        lead.name.toLowerCase().includes(q) ||
        (lead.phone && lead.phone.toLowerCase().includes(q)) ||
        (lead.email && lead.email.toLowerCase().includes(q)) ||
        (lead.source && lead.source.toLowerCase().includes(q));

      const leadSource = (lead.source || lead.sourceForm || "").toLowerCase();
      let matchesSource = true;
      if (sourceFilter === "FB") {
        matchesSource = leadSource.includes("facebook") || leadSource.includes("meta");
      } else if (sourceFilter === "SHEET") {
        matchesSource = leadSource.includes("sheet") || leadSource.includes("google");
      } else if (sourceFilter === "EXCEL") {
        matchesSource = leadSource.includes("excel") || leadSource.includes("csv");
      } else if (sourceFilter === "WHATSAPP") {
        matchesSource = leadSource.includes("whatsapp") || leadSource.includes("chatmitra");
      } else if (sourceFilter === "MANUAL") {
        matchesSource = leadSource.includes("manual") || leadSource.includes("entry") || leadSource.includes("test");
      }

      return matchesSearch && matchesSource;
    });
  }, [leads, searchQuery, sourceFilter]);

  const getSourceBadge = (sourceStr: string) => {
    const s = (sourceStr || "").toLowerCase();
    if (s.includes("facebook") || s.includes("meta")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          {sourceStr || "Facebook Lead"}
        </span>
      );
    }
    if (s.includes("sheet") || s.includes("google")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          {sourceStr || "Google Sheet"}
        </span>
      );
    }
    if (s.includes("excel") || s.includes("csv")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
          {sourceStr || "Excel Import"}
        </span>
      );
    }
    if (s.includes("whatsapp")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          {sourceStr || "WhatsApp Bot"}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-bg text-ink-soft border border-border">
        {sourceStr || "Direct Lead"}
      </span>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-serif text-ink font-bold">Lead Inbox</h1>
            <Badge variant="warning" className="text-xs px-2.5 py-0.5">
              {leads.length} Unassigned
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-ink-soft mt-0.5">
            Incoming unassigned leads from Facebook, Google Sheets, Excel imports, & WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {successMessage && (
            <span className="text-success text-xs sm:text-sm flex items-center gap-1.5 font-medium bg-success/10 px-3 py-1.5 rounded-full w-full sm:w-auto justify-center border border-success/20 animate-in fade-in">
              <Check size={14} /> {successMessage}
            </span>
          )}

          <Button
            size="sm"
            onClick={() => setIsAddLeadModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 h-9 sm:h-10 text-xs sm:text-sm bg-accent hover:bg-accent/90 text-surface font-semibold shadow-sm"
          >
            <UserPlus size={15} />
            + Add Lead
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExcelModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 h-9 sm:h-10 text-xs sm:text-sm font-medium"
          >
            <Upload size={14} />
            Import Excel
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleSyncSheet}
            disabled={isSyncingSheet}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 h-9 sm:h-10 text-xs sm:text-sm border border-emerald-600/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 font-medium"
          >
            <FileSpreadsheet size={14} className={isSyncingSheet ? "animate-spin" : ""} />
            {isSyncingSheet ? "Syncing..." : "Sync Sheet"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 h-9 sm:h-10 text-xs sm:text-sm"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleOpenDistributionModal}
            disabled={leads.length === 0}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 h-9 sm:h-10 text-xs sm:text-sm font-semibold bg-accent hover:bg-accent/90 text-surface shadow-xs"
          >
            <Users size={14} />
            Auto-Distribute ({leads.length})
          </Button>
        </div>
      </div>

      {/* SALES TEAM DUTY ROSTER & SELECTIVE DISTRIBUTION WIDGET */}
      <div className="bg-surface border border-border rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <Users size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-ink">Sales Team Duty Roster & Selective Lead Distribution</h2>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                    salesTeam.filter((m) => m.isActive).length > 0
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-danger/10 text-danger border-danger/20"
                  }`}
                >
                  {salesTeam.filter((m) => m.isActive).length} of {salesTeam.length} On Duty
                </span>
              </div>
              <p className="text-xs text-ink-soft mt-0.5">
                Toggle sales executives on leave to exclude them from automatic lead distribution.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleOpenDistributionModal}
            disabled={leads.length === 0}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-ink text-surface hover:bg-ink/90 h-9 shrink-0"
          >
            <Sparkles size={14} className="text-accent" />
            <span>Selective Distribution Settings</span>
          </Button>
        </div>

        {/* Reps Duty Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {salesTeam.length === 0 ? (
            <div className="col-span-full p-4 text-center text-xs text-ink-soft">
              No sales executives registered in the system.
            </div>
          ) : (
            salesTeam.map((rep) => {
              const isToggling = togglingRepId === rep.id;
              const initials = rep.name
                ? rep.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                : "SP";

              return (
                <div
                  key={rep.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${
                    rep.isActive
                      ? "bg-bg/60 border-emerald-500/30 shadow-2xs"
                      : "bg-bg/25 border-border opacity-70"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        rep.isActive
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-ink-soft/15 text-ink-soft"
                      }`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-ink truncate">{rep.name}</div>
                      <div className="flex items-center gap-1 text-[11px] mt-0.5">
                        {rep.isActive ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            On Duty
                          </span>
                        ) : (
                          <span className="text-ink-soft font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-ink-soft/40"></span>
                            On Leave
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isToggling}
                    onClick={() => handleToggleDutyStatus(rep)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition-all shrink-0 ${
                      rep.isActive
                        ? "border-border text-ink-soft hover:bg-danger/10 hover:text-danger hover:border-danger/30 bg-surface"
                        : "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                    }`}
                    title={rep.isActive ? "Mark On Leave (exclude from receiving leads)" : "Mark On Duty (eligible for leads)"}
                  >
                    {isToggling ? "Saving..." : rep.isActive ? "Set Leave" : "Set Duty"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-surface border border-border p-3 sm:p-4 rounded-xl shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <Input
            type="text"
            placeholder="Search unassigned leads by name, phone, email, source..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 sm:h-10 text-xs sm:text-sm bg-bg w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-ink-soft shrink-0" />
          <Select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="h-9 sm:h-10 text-xs sm:text-sm bg-bg min-w-[150px]"
          >
            <option value="ALL">All Sources ({leads.length})</option>
            <option value="FB">Facebook Lead Ads</option>
            <option value="SHEET">Google Sheets</option>
            <option value="EXCEL">Excel Bulk Imports</option>
            <option value="WHATSAPP">WhatsApp Bot</option>
            <option value="MANUAL">Manual / Test Leads</option>
          </Select>
        </div>
      </div>

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onSuccess={(msg) => {
          setSuccessMessage(msg);
          fetchData();
          setTimeout(() => setSuccessMessage(""), 5000);
        }}
      />

      {/* Add Lead / Test Lead Modal */}
      <AddLeadModal
        isOpen={isAddLeadModalOpen}
        onClose={() => setIsAddLeadModalOpen(false)}
        onOpenExcel={() => setIsExcelModalOpen(true)}
        onSuccess={(msg) => {
          setSuccessMessage(msg);
          fetchData();
          setTimeout(() => setSuccessMessage(""), 5000);
        }}
      />

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-ink-soft flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-accent" />
            <span>Loading unassigned leads...</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-14 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-bg flex items-center justify-center mb-3 text-ink-soft">
              <Inbox size={32} />
            </div>
            <h3 className="text-base font-bold text-ink">Inbox Zero 🎉</h3>
            <p className="text-xs text-ink-soft mt-1 max-w-sm">
              All incoming leads have been assigned. New leads from Facebook, Google Sheets, or Excel will appear here automatically.
            </p>
            <Button
              size="sm"
              onClick={() => setIsAddLeadModalOpen(true)}
              className="mt-4 text-xs bg-accent hover:bg-accent/90 text-surface"
            >
              + Create Test Lead
            </Button>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-10 text-center text-ink-soft">
            <p className="font-semibold text-ink">No leads matched your search</p>
            <p className="text-xs mt-1">Try clearing the search query or changing the source filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-bg/50">
                  <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider w-40">
                    Date Received
                  </th>
                  <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                    Contact Details
                  </th>
                  <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                    Source & Notes
                  </th>
                  <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider text-right">
                    Assign To Sales Rep
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-surface/50 transition-colors">
                    <td className="p-4 align-top">
                      <div className="font-mono text-xs text-ink font-medium whitespace-nowrap">
                        {new Date(lead.dateReceived).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className="font-mono text-[11px] text-ink-soft mt-0.5">
                        {new Date(lead.dateReceived).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>

                    <td className="p-4 align-top">
                      <div className="font-bold text-ink text-sm flex items-center gap-1.5">
                        <span>{lead.name}</span>
                        {lead.category && (
                          <Badge
                            variant={
                              lead.category === "HOT"
                                ? "danger"
                                : lead.category === "WARM"
                                ? "warning"
                                : "default"
                            }
                            className="text-[9px] py-0 px-1"
                          >
                            {lead.category}
                          </Badge>
                        )}
                      </div>
                      <div className="font-mono text-xs text-ink-soft mt-1 flex items-center gap-1.5">
                        <Phone size={11} className="text-ink-soft" />
                        <span>{lead.phone}</span>
                      </div>
                      {lead.email && (
                        <div className="text-xs text-ink-soft mt-0.5 flex items-center gap-1.5">
                          <Mail size={11} className="text-ink-soft" />
                          <span>{lead.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-4 align-top">
                      <div>{getSourceBadge(lead.source || lead.sourceForm || "Direct")}</div>
                      {lead.formAnswers?.notes && (
                        <div className="text-[11px] text-ink/80 italic mt-1 max-w-xs line-clamp-2">
                          &ldquo;{lead.formAnswers.notes}&rdquo;
                        </div>
                      )}
                    </td>

                    <td className="p-4 align-top text-right">
                      <div className="flex justify-end items-center gap-2.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedWhatsAppLead(lead)}
                          className="h-9 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 font-medium"
                        >
                          <Bot size={13} className="text-emerald-600 dark:text-emerald-400" />
                          <span>WhatsApp</span>
                          {Array.isArray(lead.aiChatHistory) && lead.aiChatHistory.length > 0 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          )}
                        </Button>

                        <div className="w-52">
                          <Select
                            className="w-full bg-bg text-xs h-9"
                            defaultValue=""
                            disabled={assigningId === lead.id}
                            onChange={(e) => handleManualAssign(lead.id, e.target.value)}
                          >
                            <option value="" disabled>
                              {assigningId === lead.id ? "Assigning..." : "Assign to Rep..."}
                            </option>
                            {salesTeam.map((rep) => (
                              <option key={rep.id} value={rep.id}>
                                👤 {rep.name} {!rep.isActive ? "(On Leave)" : ""}
                              </option>
                            ))}
                          </Select>
                        </div>
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
          <div className="bg-surface border border-border rounded-xl p-8 text-center text-ink-soft">
            <RefreshCw size={18} className="animate-spin text-accent mx-auto mb-2" />
            <span>Loading unassigned leads...</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-8 text-center flex flex-col items-center justify-center">
            <Inbox size={36} className="text-border mb-2" />
            <h3 className="text-base font-bold text-ink">Inbox Zero</h3>
            <p className="text-xs text-ink-soft mt-1">All leads have been assigned.</p>
            <Button
              size="sm"
              onClick={() => setIsAddLeadModalOpen(true)}
              className="mt-3 text-xs bg-accent hover:bg-accent/90 text-surface"
            >
              + Create Test Lead
            </Button>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-6 text-center text-ink-soft">
            <p className="font-semibold text-ink text-sm">No matching leads</p>
            <p className="text-xs mt-0.5">Try clearing filters.</p>
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <div key={lead.id} className="bg-surface border border-border rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-ink text-base">{lead.name}</h3>
                    {lead.category && (
                      <Badge
                        variant={
                          lead.category === "HOT"
                            ? "danger"
                            : lead.category === "WARM"
                            ? "warning"
                            : "default"
                        }
                        className="text-[8px] py-0 px-1"
                      >
                        {lead.category}
                      </Badge>
                    )}
                  </div>
                  <div className="font-mono text-xs text-ink-soft mt-0.5 flex items-center gap-1">
                    <Phone size={11} /> {lead.phone}
                  </div>
                  {lead.email && (
                    <div className="text-xs text-ink-soft flex items-center gap-1">
                      <Mail size={11} /> {lead.email}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-ink-soft block">
                    {new Date(lead.dateReceived).toLocaleDateString()}
                  </span>
                  <div className="mt-1">{getSourceBadge(lead.source || lead.sourceForm || "Form")}</div>
                </div>
              </div>

              {lead.formAnswers?.notes && (
                <div className="text-[11px] text-ink/80 bg-bg p-2 rounded-lg border border-border italic">
                  &ldquo;{lead.formAnswers.notes}&rdquo;
                </div>
              )}

              <div className="pt-2 border-t border-border/60 space-y-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedWhatsAppLead(lead)}
                  className="w-full h-9 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-1.5 font-semibold"
                >
                  <Bot size={14} />
                  <span>WhatsApp Bot & Chat</span>
                </Button>

                <div>
                  <label className="block text-[10px] font-semibold text-ink-soft uppercase tracking-wider mb-1">
                    Assign Lead To:
                  </label>
                  <Select
                    className="w-full bg-bg h-10 text-sm"
                    defaultValue=""
                    disabled={assigningId === lead.id}
                    onChange={(e) => handleManualAssign(lead.id, e.target.value)}
                  >
                    <option value="" disabled>
                      {assigningId === lead.id ? "Assigning..." : "Select Sales Rep..."}
                    </option>
                    {salesTeam.map((rep) => (
                      <option key={rep.id} value={rep.id}>
                        👤 {rep.name} {!rep.isActive ? "(On Leave)" : ""}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* WhatsApp Bot / Chat Modal */}
      <WhatsAppChatModal
        isOpen={!!selectedWhatsAppLead}
        onClose={() => setSelectedWhatsAppLead(null)}
        lead={selectedWhatsAppLead}
        onLeadUpdated={(updatedLead) => {
          setLeads((prev) =>
            prev.map((l) => (l.id === updatedLead.id ? { ...l, ...updatedLead } : l))
          );
          setSelectedWhatsAppLead((prev) => (prev?.id === updatedLead.id ? { ...prev, ...updatedLead } : prev));
        }}
      />

      {/* Selective Lead Distribution Modal */}
      <TeamDistributionModal
        isOpen={isDistributionModalOpen}
        onClose={() => setIsDistributionModalOpen(false)}
        unassignedCount={leads.length}
        salesTeam={salesTeam}
        onTeamUpdated={fetchData}
        onSuccess={(msg) => {
          setSuccessMessage(msg);
          fetchData();
          setTimeout(() => setSuccessMessage(""), 5000);
        }}
      />
    </div>
  );
}

