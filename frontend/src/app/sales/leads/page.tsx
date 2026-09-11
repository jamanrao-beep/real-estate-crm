"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Phone, Search, XCircle, Clock, Calendar, Download, Filter, RotateCcw } from "lucide-react";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  category: string | null;
  funnelStage: string | null;
  status: string;
  dateReceived: string;
  followUpAt?: string | null;
  followUpNotes?: string | null;
  aiChatHistory?: any;
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

export default function MyLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Call Log Modal State
  const [activeCallLead, setActiveCallLead] = useState<Lead | null>(null);
  const [callNotes, setCallNotes] = useState("");
  const [callStart, setCallStart] = useState("");
  const [callEnd, setCallEnd] = useState("");
  const [followUpAt, setFollowUpAt] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");

  // Filters State
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const resetFilters = () => {
    setCategoryFilter("");
    setStageFilter("");
    setSearchQuery("");
  };

  const hasActiveFilters = Boolean(categoryFilter || stageFilter || searchQuery.trim());

  // Dynamic filter logic
  const filteredLeads = leads.filter((lead) => {
    if (categoryFilter && lead.category !== categoryFilter) {
      return false;
    }
    if (stageFilter && lead.funnelStage !== stageFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = lead.name?.toLowerCase().includes(q);
      const phoneMatch = lead.phone?.toLowerCase().includes(q);
      const emailMatch = lead.email?.toLowerCase().includes(q);
      if (!nameMatch && !phoneMatch && !emailMatch) {
        return false;
      }
    }
    return true;
  });

  // Dynamic counts for all 8 filters
  const categoryCounts = {
    HOT: leads.filter((l) => l.category === "HOT").length,
    WARM: leads.filter((l) => l.category === "WARM").length,
    COLD: leads.filter((l) => l.category === "COLD").length,
  };

  const stageCounts = {
    INTERESTED: leads.filter((l) => l.funnelStage === "INTERESTED").length,
    OFFICE_VISIT_DONE: leads.filter((l) => l.funnelStage === "OFFICE_VISIT_DONE").length,
    SITE_VISIT_DONE: leads.filter((l) => l.funnelStage === "SITE_VISIT_DONE").length,
    DEAL_CLOSED: leads.filter((l) => l.funnelStage === "DEAL_CLOSED").length,
    NOT_INTERESTED: leads.filter((l) => l.funnelStage === "NOT_INTERESTED").length,
  };

  // CSV Export
  const exportToCSV = () => {
    const leadsToExport = filteredLeads;
    if (leadsToExport.length === 0) {
      alert("No leads found matching current criteria to export.");
      return;
    }

    const headers = [
      "Name",
      "Phone",
      "Email",
      "Category",
      "Funnel Stage",
      "Status",
      "Follow-Up Reminder",
      "Follow-Up Notes",
      "Date Received",
    ];

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const formatStageLabel = (stage: string | null) => {
      if (!stage) return "";
      switch (stage) {
        case "INTERESTED": return "Interested";
        case "OFFICE_VISIT_DONE": return "Office Visit Done";
        case "SITE_VISIT_DONE": return "Site Visit Done";
        case "DEAL_CLOSED": return "Deal Closed";
        case "NOT_INTERESTED": return "Not Interested";
        case "LOST": return "Lost";
        default: return stage;
      }
    };

    const formatCategoryLabel = (cat: string | null) => {
      if (!cat) return "";
      switch (cat) {
        case "HOT": return "Hot";
        case "WARM": return "Warm";
        case "COLD": return "Cold";
        default: return cat;
      }
    };

    const rows = leadsToExport.map((lead) => [
      escapeCSV(lead.name),
      escapeCSV(lead.phone),
      escapeCSV(lead.email || ""),
      escapeCSV(formatCategoryLabel(lead.category)),
      escapeCSV(formatStageLabel(lead.funnelStage)),
      escapeCSV(lead.status),
      escapeCSV(lead.followUpAt ? new Date(lead.followUpAt).toLocaleString("en-IN") : ""),
      escapeCSV(lead.followUpNotes || ""),
      escapeCSV(lead.dateReceived ? new Date(lead.dateReceived).toLocaleString("en-IN") : ""),
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const filterSuffix = hasActiveFilters ? "_filtered" : "_all";
    const dateStr = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.setAttribute("download", `my_leads${filterSuffix}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/leads/mine");
      setLeads(res.data);
    } catch (err) {
      console.error("Failed to fetch my leads", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const updateCategory = async (id: string, category: string) => {
    try {
      await api.patch(`/leads/${id}/category`, { category });
      setLeads(leads.map(l => l.id === id ? { ...l, category } : l));
    } catch (err) {
      console.error("Failed to update category", err);
      alert("Failed to update category");
    }
  };

  const updateStage = async (id: string, stage: string) => {
    try {
      await api.patch(`/leads/${id}/stage`, { stage });
      setLeads(leads.map(l => l.id === id ? { ...l, funnelStage: stage } : l));
    } catch (err) {
      console.error("Failed to update stage", err);
      alert("Failed to update funnel stage");
    }
  };

  const markLost = async (id: string) => {
    if (!confirm("Are you sure you want to mark this lead as LOST?")) return;
    try {
      await api.patch(`/leads/${id}/lost`, {});
      setLeads(leads.map(l => l.id === id ? { ...l, status: "LOST", funnelStage: "LOST" } : l));
    } catch (err: any) {
      console.error("Failed to mark lost", err);
      alert(err.response?.data?.error || "Failed to mark lead as lost");
    }
  };

  const handleLogCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCallLead || !callStart || !callEnd) return;

    try {
      await api.post("/calls", {
        leadId: activeCallLead.id,
        startTime: new Date(callStart).toISOString(),
        endTime: new Date(callEnd).toISOString(),
        notes: callNotes,
        followUpAt: followUpAt ? new Date(followUpAt).toISOString() : null,
        followUpNotes: followUpNotes || null,
      });

      // Update lead in local state so the table reflects the new reminder immediately
      setLeads(prev => prev.map(l => l.id === activeCallLead.id ? {
        ...l,
        followUpAt: followUpAt ? new Date(followUpAt).toISOString() : l.followUpAt,
        followUpNotes: followUpAt ? (followUpNotes || null) : l.followUpNotes,
      } : l));

      alert("Call logged successfully!");
      setActiveCallLead(null);
      setCallStart("");
      setCallEnd("");
      setCallNotes("");
      setFollowUpAt("");
      setFollowUpNotes("");
    } catch (err: any) {
      console.error("Failed to log call", err);
      alert(err.response?.data?.error || "Failed to log call");
    }
  };

  const handleDismissFollowUp = async (leadId: string) => {
    try {
      await api.patch(`/leads/${leadId}/follow-up`, { followUpAt: null, followUpNotes: null });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, followUpAt: null, followUpNotes: null } : l));
    } catch (err) {
      console.error("Failed to clear follow-up", err);
      alert("Failed to clear follow-up");
    }
  };

  const openCallModal = (lead: Lead) => {
    const now = new Date();
    // Default to 15 mins ago to now to save clicks
    const end = now.toISOString().slice(0, 16);
    const start = new Date(now.getTime() - 15 * 60000).toISOString().slice(0, 16);
    
    setCallStart(start);
    setCallEnd(end);
    setCallNotes("");
    setFollowUpAt(lead.followUpAt ? new Date(lead.followUpAt).toISOString().slice(0, 16) : "");
    setFollowUpNotes(lead.followUpNotes || "");
    setActiveCallLead(lead);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Title and Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif text-ink font-bold">My Leads Workspace</h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-0.5">
            Manage your assigned leads, update progress, and log interactions.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="flex items-center gap-2 h-9 sm:h-10 text-xs sm:text-sm border-emerald-600/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 font-medium"
            title={hasActiveFilters ? "Export filtered leads as CSV" : "Export all assigned leads as CSV"}
          >
            <Download size={15} />
            <span>Export CSV {hasActiveFilters ? `(${filteredLeads.length})` : `(${leads.length})`}</span>
          </Button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-surface border border-border p-3.5 sm:p-4 rounded-xl shadow-sm space-y-3">
        {/* Dropdown & Search Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          {/* Search Input */}
          <div>
            <label className="block text-[10px] font-semibold text-ink-soft uppercase tracking-wider mb-1">
              Search Leads
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
              <Input
                placeholder="Search name, phone, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-xs sm:text-sm bg-bg"
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-[10px] font-semibold text-ink-soft uppercase tracking-wider mb-1">
              Category
            </label>
            <Select
              className="w-full bg-bg h-10 text-sm"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Any Category ({leads.length})</option>
              <option value="HOT">Hot 🔥 ({categoryCounts.HOT})</option>
              <option value="WARM">Warm 🌤️ ({categoryCounts.WARM})</option>
              <option value="COLD">Cold ❄️ ({categoryCounts.COLD})</option>
            </Select>
          </div>

          {/* Funnel Stage Dropdown */}
          <div>
            <label className="block text-[10px] font-semibold text-ink-soft uppercase tracking-wider mb-1">
              Funnel Stage
            </label>
            <Select
              className="w-full bg-bg h-10 text-sm"
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
            >
              <option value="">Any Funnel Stage ({leads.length})</option>
              <option value="INTERESTED">Interested ({stageCounts.INTERESTED})</option>
              <option value="OFFICE_VISIT_DONE">Office Visit Done ({stageCounts.OFFICE_VISIT_DONE})</option>
              <option value="SITE_VISIT_DONE">Site Visit Done ({stageCounts.SITE_VISIT_DONE})</option>
              <option value="DEAL_CLOSED">Deal Closed ({stageCounts.DEAL_CLOSED})</option>
              <option value="NOT_INTERESTED">Not Interested ({stageCounts.NOT_INTERESTED})</option>
            </Select>
          </div>

          {/* Reset Filters */}
          <div>
            <Button
              variant="outline"
              className="w-full h-10 text-xs sm:text-sm justify-center gap-1.5"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
            >
              <RotateCcw size={14} />
              Reset Filters
            </Button>
          </div>
        </div>

        {/* Quick Filter Chips (The 8 requested filters: Hot, Warm, Cold + 5 Funnel Stages) */}
        <div className="pt-2 border-t border-border/60 flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter size={12} /> Quick Filters:
          </span>

          {/* All chip */}
          <button
            type="button"
            onClick={resetFilters}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              !hasActiveFilters
                ? "bg-ink text-surface shadow-xs"
                : "bg-bg text-ink-soft hover:text-ink hover:bg-border/60"
            }`}
          >
            All ({leads.length})
          </button>

          {/* Category Chips */}
          <span className="text-border mx-1">|</span>
          <button
            type="button"
            onClick={() => setCategoryFilter(categoryFilter === "HOT" ? "" : "HOT")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
              categoryFilter === "HOT"
                ? "bg-danger text-white shadow-xs"
                : "bg-danger/10 text-danger hover:bg-danger/20"
            }`}
          >
            Hot 🔥 ({categoryCounts.HOT})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter(categoryFilter === "WARM" ? "" : "WARM")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
              categoryFilter === "WARM"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
            }`}
          >
            Warm 🌤️ ({categoryCounts.WARM})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter(categoryFilter === "COLD" ? "" : "COLD")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
              categoryFilter === "COLD"
                ? "bg-sky-600 text-white shadow-xs"
                : "bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20"
            }`}
          >
            Cold ❄️ ({categoryCounts.COLD})
          </button>

          {/* Funnel Stage Chips */}
          <span className="text-border mx-1">|</span>
          <button
            type="button"
            onClick={() => setStageFilter(stageFilter === "INTERESTED" ? "" : "INTERESTED")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              stageFilter === "INTERESTED"
                ? "bg-accent text-white shadow-xs"
                : "bg-accent/10 text-accent hover:bg-accent/20"
            }`}
          >
            Interested ({stageCounts.INTERESTED})
          </button>
          <button
            type="button"
            onClick={() => setStageFilter(stageFilter === "OFFICE_VISIT_DONE" ? "" : "OFFICE_VISIT_DONE")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              stageFilter === "OFFICE_VISIT_DONE"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20"
            }`}
          >
            Office Visit Done ({stageCounts.OFFICE_VISIT_DONE})
          </button>
          <button
            type="button"
            onClick={() => setStageFilter(stageFilter === "SITE_VISIT_DONE" ? "" : "SITE_VISIT_DONE")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              stageFilter === "SITE_VISIT_DONE"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
            }`}
          >
            Site Visit Done ({stageCounts.SITE_VISIT_DONE})
          </button>
          <button
            type="button"
            onClick={() => setStageFilter(stageFilter === "DEAL_CLOSED" ? "" : "DEAL_CLOSED")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              stageFilter === "DEAL_CLOSED"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-emerald-600/10 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-600/20"
            }`}
          >
            Deal Closed ({stageCounts.DEAL_CLOSED})
          </button>
          <button
            type="button"
            onClick={() => setStageFilter(stageFilter === "NOT_INTERESTED" ? "" : "NOT_INTERESTED")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              stageFilter === "NOT_INTERESTED"
                ? "bg-zinc-600 text-white shadow-xs"
                : "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-500/20"
            }`}
          >
            Not Interested ({stageCounts.NOT_INTERESTED})
          </button>
        </div>

        {/* Live Filter Summary Bar */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between text-xs text-ink-soft pt-1">
            <span>
              Showing <strong className="text-ink">{filteredLeads.length}</strong> of <strong className="text-ink">{leads.length}</strong> leads
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-accent hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* DESKTOP TABLE VIEW (hidden on mobile, visible md and up) */}
      <div className="hidden md:block bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-bg/50">
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                  Contact
                </th>
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                  Category
                </th>
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                  Funnel Stage
                </th>
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-ink-soft">
                    Loading your leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-ink-soft flex items-center justify-center gap-2">
                    <Search size={16} /> No leads assigned to you right now.
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-ink-soft">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search size={20} className="text-ink-soft/60" />
                      <p className="font-medium text-ink">No leads match your selected filters</p>
                      <p className="text-xs text-ink-soft">Try selecting a different filter or clearing search.</p>
                      <Button variant="outline" size="sm" onClick={resetFilters} className="mt-2 text-xs">
                        <RotateCcw size={13} className="mr-1.5" /> Clear Filters
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className={`transition-colors ${lead.status === 'LOST' ? 'bg-bg/50 opacity-70' : 'hover:bg-surface/50'}`}>
                    <td className="p-4 align-top w-1/3">
                      <div className="font-medium text-ink flex items-center gap-2">
                        {lead.name}
                        {lead.status === "LOST" && <Badge variant="danger" className="text-[10px]">LOST</Badge>}
                      </div>
                      <div className="font-mono text-sm text-ink-soft mt-1">
                        {lead.phone}
                      </div>
                      <div className="text-sm text-ink-soft">{lead.email}</div>

                      {/* Follow-Up Reminder Pill */}
                      {lead.followUpAt && (
                        <div className={`mt-2.5 p-2.5 rounded-lg border text-xs flex flex-col gap-1 transition-all ${
                          new Date(lead.followUpAt) < new Date()
                            ? "bg-danger/10 border-danger/30 text-danger"
                            : "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200"
                        }`}>
                          <div className="flex items-center justify-between gap-1">
                            <span className="flex items-center gap-1.5 font-semibold">
                              <Clock size={13} className="shrink-0 text-amber-600 dark:text-amber-400" />
                              <span>{formatFollowUpDate(lead.followUpAt)}</span>
                              {new Date(lead.followUpAt) < new Date() && (
                                <Badge variant="danger" className="text-[9px] py-0 px-1 ml-1">Overdue</Badge>
                              )}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDismissFollowUp(lead.id)}
                              className="text-[10px] text-ink-soft hover:text-ink underline ml-2"
                              title="Mark follow-up done"
                            >
                              Clear
                            </button>
                          </div>
                          {lead.followUpNotes && (
                            <div className="text-[11px] text-ink/80 flex items-start gap-1 mt-0.5">
                              <span className="font-medium text-ink shrink-0">To ask:</span>
                              <span className="italic break-words">&ldquo;{lead.followUpNotes}&rdquo;</span>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4 align-top w-1/5">
                      <Select
                        className="w-full"
                        value={lead.category || ""}
                        onChange={(e) => updateCategory(lead.id, e.target.value)}
                        disabled={lead.status === "LOST"}
                      >
                        <option value="" disabled>Set Category</option>
                        <option value="HOT">Hot</option>
                        <option value="WARM">Warm</option>
                        <option value="COLD">Cold</option>
                      </Select>
                    </td>
                    <td className="p-4 align-top w-1/4">
                      <Select
                        className="w-full"
                        value={lead.funnelStage || ""}
                        onChange={(e) => updateStage(lead.id, e.target.value)}
                        disabled={lead.status === "LOST"}
                      >
                        <option value="" disabled>Set Stage</option>
                        <option value="INTERESTED">Interested</option>
                        <option value="OFFICE_VISIT_DONE">Office Visit Done</option>
                        <option value="SITE_VISIT_DONE">Site Visit Done</option>
                        <option value="DEAL_CLOSED">Deal Closed</option>
                        <option value="NOT_INTERESTED">Not Interested</option>
                      </Select>
                    </td>
                    <td className="p-4 align-top text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openCallModal(lead)}
                          disabled={lead.status === "LOST"}
                        >
                          <Phone size={14} className="mr-1.5" />
                          Log Call
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-danger hover:bg-danger/10 hover:text-danger"
                          onClick={() => markLost(lead.id)}
                          disabled={lead.status === "LOST"}
                        >
                          <XCircle size={14} className="mr-1.5" />
                          Lost
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARDS VIEW (visible on mobile, hidden md and up) */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="bg-surface border border-border rounded-xl p-6 text-center text-ink-soft">
            Loading your leads...
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-8 text-center text-ink-soft flex flex-col items-center justify-center gap-2">
            <Search size={24} className="text-border" />
            <p className="font-medium text-ink">No leads assigned</p>
            <p className="text-xs">No active leads assigned to you right now.</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-6 text-center text-ink-soft flex flex-col items-center justify-center gap-2">
            <Search size={20} className="text-border" />
            <p className="font-medium text-ink">No leads match filters</p>
            <p className="text-xs">Try selecting a different filter or clearing search.</p>
            <Button variant="outline" size="sm" onClick={resetFilters} className="mt-1 text-xs">
              <RotateCcw size={13} className="mr-1.5" /> Reset Filters
            </Button>
          </div>
        ) : (
          filteredLeads.map((lead) => {
            return (
              <div
                key={lead.id}
                className={`bg-surface border border-border rounded-xl p-4 shadow-sm space-y-3 transition-all ${
                  lead.status === "LOST" ? "opacity-70 bg-bg/60" : ""
                }`}
              >
                {/* Header: Name + Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-ink text-base flex items-center gap-2">
                      {lead.name}
                      {lead.status === "LOST" && <Badge variant="danger" className="text-[10px]">LOST</Badge>}
                    </div>
                    <div className="font-mono text-xs text-ink-soft mt-0.5">{lead.email}</div>
                  </div>

                  {/* Direct Phone Tap Target */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        className="p-2 rounded-lg bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors flex items-center justify-center"
                        title="Call directly"
                      >
                        <Phone size={16} />
                      </a>
                    )}
                  </div>
                </div>

                {/* Follow-up reminder box */}
                {lead.followUpAt && (
                  <div
                    className={`p-2.5 rounded-lg border text-xs flex flex-col gap-1 ${
                      new Date(lead.followUpAt) < new Date()
                        ? "bg-danger/10 border-danger/30 text-danger"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Clock size={13} className="shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>{formatFollowUpDate(lead.followUpAt)}</span>
                        {new Date(lead.followUpAt) < new Date() && (
                          <Badge variant="danger" className="text-[9px] py-0 px-1 ml-1">Overdue</Badge>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDismissFollowUp(lead.id)}
                        className="text-[10px] text-ink-soft hover:text-ink underline ml-2"
                      >
                        Clear
                      </button>
                    </div>
                    {lead.followUpNotes && (
                      <div className="text-[11px] text-ink/80 flex items-start gap-1 mt-0.5">
                        <span className="font-medium text-ink shrink-0">To ask:</span>
                        <span className="italic break-words">&ldquo;{lead.followUpNotes}&rdquo;</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Dropdowns for Mobile */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-semibold text-ink-soft uppercase tracking-wider mb-1">Category</label>
                    <Select
                      className="w-full text-xs h-9 bg-bg"
                      value={lead.category || ""}
                      onChange={(e) => updateCategory(lead.id, e.target.value)}
                      disabled={lead.status === "LOST"}
                    >
                      <option value="" disabled>Category</option>
                      <option value="HOT">Hot 🔥</option>
                      <option value="WARM">Warm 🌤️</option>
                      <option value="COLD">Cold ❄️</option>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-ink-soft uppercase tracking-wider mb-1">Stage</label>
                    <Select
                      className="w-full text-xs h-9 bg-bg"
                      value={lead.funnelStage || ""}
                      onChange={(e) => updateStage(lead.id, e.target.value)}
                      disabled={lead.status === "LOST"}
                    >
                      <option value="" disabled>Stage</option>
                      <option value="INTERESTED">Interested</option>
                      <option value="OFFICE_VISIT_DONE">Office Visit Done</option>
                      <option value="SITE_VISIT_DONE">Site Visit Done</option>
                      <option value="DEAL_CLOSED">Deal Closed</option>
                      <option value="NOT_INTERESTED">Not Interested</option>
                    </Select>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex gap-2 pt-1 border-t border-border/60">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 justify-center py-2 h-9 text-xs font-semibold"
                    onClick={() => openCallModal(lead)}
                    disabled={lead.status === "LOST"}
                  >
                    <Phone size={14} className="mr-1.5 text-accent" />
                    Log Call
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-3 text-xs text-danger hover:bg-danger/10 hover:text-danger"
                    onClick={() => markLost(lead.id)}
                    disabled={lead.status === "LOST"}
                  >
                    <XCircle size={14} className="mr-1" />
                    Lost
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Call Logging Modal - Fully Responsive */}
      {activeCallLead && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md p-4 sm:p-6 my-auto animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-serif text-ink font-bold">Log Call</h3>
            <p className="text-xs sm:text-sm text-ink-soft mb-4">Record interaction with <strong className="text-ink">{activeCallLead.name}</strong></p>
            
            <form onSubmit={handleLogCall} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1 uppercase tracking-wider">Start Time</label>
                  <Input 
                    type="datetime-local" 
                    required 
                    value={callStart}
                    onChange={(e) => setCallStart(e.target.value)}
                    className="h-10 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1 uppercase tracking-wider">End Time</label>
                  <Input 
                    type="datetime-local" 
                    required 
                    value={callEnd}
                    onChange={(e) => setCallEnd(e.target.value)}
                    className="h-10 text-xs sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-soft mb-1 uppercase tracking-wider">Notes (Optional)</label>
                <textarea
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  rows={2}
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="Discussed pricing, client wants to visit..."
                />
              </div>

              {/* Follow-up Section */}
              <div className="border-t border-border pt-3 mt-2 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink">
                  <Calendar size={14} className="text-accent" />
                  <span>Next Follow-Up Reminder (Optional)</span>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1">
                    Follow-Up Date & Time
                  </label>
                  <Input 
                    type="datetime-local" 
                    min={new Date().toISOString().slice(0, 16)}
                    value={followUpAt}
                    onChange={(e) => setFollowUpAt(e.target.value)}
                    className="h-10 text-xs sm:text-sm"
                  />
                  <p className="text-[10px] text-ink-soft mt-0.5">Pick a reminder date & time from today onward</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1">
                    What to Ask / Follow-Up Details
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    rows={2}
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    placeholder="e.g. Ask if loan was approved, confirm site visit timing..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 sm:gap-3 pt-3 border-t border-border">
                <Button type="button" variant="ghost" size="sm" onClick={() => setActiveCallLead(null)} className="h-10 px-4">Cancel</Button>
                <Button type="submit" size="sm" className="h-10 px-4 font-semibold">Save Call Record</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
