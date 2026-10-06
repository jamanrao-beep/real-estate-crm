"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { 
  CalendarClock, 
  Search, 
  RotateCcw, 
  Phone, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  User, 
  Users,
  MessageSquare, 
  ArrowRight, 
  ChevronRight,
  Filter,
  Check,
  X
} from "lucide-react";
import { SourceBadge } from "@/components/SourceBadge";
import { WhatsAppButton } from "@/components/LeadContactButtons";
import { LeadNotesBox } from "@/components/LeadNotesBox";
import { cn } from "@/lib/utils";

interface SalesPerson {
  id: string;
  name: string;
  email: string;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  source?: string | null;
  category?: string | null;
  funnelStage?: string | null;
  status: string;
  followUpAt?: string | null;
  followUpNotes?: string | null;
  assignedToId?: string | null;
  assignedTo?: {
    id: string;
    name: string;
    email?: string;
  } | null;
  callLogs?: {
    id: string;
    notes?: string | null;
    createdAt?: string;
    salesPersonId?: string;
  }[];
  statusHistory?: {
    id: string;
    stage: string;
    changedAt: string;
    changedById?: string;
  }[];
  formAnswers?: {
    occupation?: string;
    location?: string;
    budget?: string;
    notes?: string;
    callNotes?: string;
    [key: string]: any;
  } | any;
  isToday?: boolean;
  isPastDay?: boolean;
  followUpStatus?: "UPCOMING" | "OVERDUE" | "COMPLETED";
}

interface Summary {
  totalToday: number;
  completedToday: number;
  overdueToday: number;
  upcomingToday: number;
  allOverdue: number;
  todayIST: string;
}

// Convert date to IST string YYYY-MM-DD
function toISTDateString(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dateObj = typeof d === "string" ? new Date(d) : d;
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dateObj);
}

// Format 12-hour time in IST
function formatISTTime(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dateObj = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return "";
  return dateObj.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// Format date and time in IST
function formatISTDateTime(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dateObj = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return "";
  return dateObj.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function AdminFollowUpsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [salesPeople, setSalesPeople] = useState<SalesPerson[]>([]);
  const [selectedRepId, setSelectedRepId] = useState<string>("ALL");
  const [summary, setSummary] = useState<Summary>({
    totalToday: 0,
    completedToday: 0,
    overdueToday: 0,
    upcomingToday: 0,
    allOverdue: 0,
    todayIST: toISTDateString(new Date()),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"TODAY" | "UPCOMING" | "OVERDUE" | "COMPLETED" | "ALL_PENDING">("TODAY");

  // Call Logging Modal State
  const [activeCallLead, setActiveCallLead] = useState<Lead | null>(null);
  const [callNotes, setCallNotes] = useState("");
  const [nextFollowUpAt, setNextFollowUpAt] = useState("");
  const [nextFollowUpNotes, setNextFollowUpNotes] = useState("");
  const [isSubmittingCall, setIsSubmittingCall] = useState(false);

  // Reschedule Modal State
  const [activeRescheduleLead, setActiveRescheduleLead] = useState<Lead | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleNotes, setRescheduleNotes] = useState("");
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);

  const fetchFollowUps = useCallback(async () => {
    setIsLoading(true);
    try {
      const [followUpsRes, usersRes] = await Promise.all([
        api.get("/leads/follow-ups", {
          params: {
            date: "all",
            ...(selectedRepId && selectedRepId !== "ALL" ? { salesPersonId: selectedRepId } : {}),
          },
        }),
        api.get("/users"),
      ]);

      if (followUpsRes.data) {
        setLeads(followUpsRes.data.leads || []);
        if (followUpsRes.data.summary) {
          setSummary(followUpsRes.data.summary);
        }
      }

      if (Array.isArray(usersRes.data)) {
        setSalesPeople(usersRes.data.filter((u: any) => u.role === "SALES_PERSON" || u.role === "ADMIN"));
      }
    } catch (err) {
      console.error("Failed to fetch admin follow-ups:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRepId]);

  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  // Current Date Header Formatter
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Rep filter
      if (selectedRepId !== "ALL" && lead.assignedToId !== selectedRepId) {
        return false;
      }

      // Tab filter
      if (activeTab === "TODAY") {
        if (!lead.isToday) return false;
      } else if (activeTab === "UPCOMING") {
        if (!lead.isToday || lead.followUpStatus !== "UPCOMING") return false;
      } else if (activeTab === "OVERDUE") {
        if (!lead.isToday || lead.followUpStatus !== "OVERDUE") return false;
      } else if (activeTab === "COMPLETED") {
        if (!lead.isToday || lead.followUpStatus !== "COMPLETED") return false;
      } else if (activeTab === "ALL_PENDING") {
        if (lead.followUpStatus === "COMPLETED") return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = lead.name.toLowerCase().includes(q);
        const phoneMatch = lead.phone.includes(q);
        const repMatch = lead.assignedTo?.name.toLowerCase().includes(q);
        const notesMatch = typeof lead.followUpNotes === "string" && lead.followUpNotes.toLowerCase().includes(q);
        const prevNoteMatch = lead.callLogs?.some((c) => c.notes?.toLowerCase().includes(q));
        if (!nameMatch && !phoneMatch && !repMatch && !notesMatch && !prevNoteMatch) return false;
      }

      return true;
    });
  }, [leads, activeTab, searchQuery, selectedRepId]);

  // Quick Action: Dismiss / Mark Follow-up Done
  const handleDismissFollowUp = async (leadId: string) => {
    if (!window.confirm("Are you sure you want to dismiss/clear this follow-up?")) return;
    try {
      await api.patch(`/leads/${leadId}/follow-up`, {
        followUpAt: null,
        followUpNotes: null,
      });
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      fetchFollowUps();
    } catch (err) {
      console.error("Failed to dismiss follow-up:", err);
      alert("Failed to dismiss follow-up");
    }
  };

  // Open Call Modal
  const openCallModal = (lead: Lead) => {
    setActiveCallLead(lead);
    setCallNotes("");
    setNextFollowUpAt("");
    setNextFollowUpNotes(lead.followUpNotes || "");
  };

  // Submit Call Record
  const handleSaveCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCallLead) return;

    try {
      setIsSubmittingCall(true);
      await api.post("/calls", {
        leadId: activeCallLead.id,
        notes: callNotes.trim(),
        followUpAt: nextFollowUpAt ? new Date(nextFollowUpAt).toISOString() : null,
        followUpNotes: nextFollowUpNotes.trim() || null,
      });

      alert("Interaction saved successfully! Follow-up updated.");
      setActiveCallLead(null);
      fetchFollowUps();
    } catch (err: any) {
      console.error("Failed to log call:", err);
      alert(err.response?.data?.error || "Failed to log interaction");
    } finally {
      setIsSubmittingCall(false);
    }
  };

  // Open Reschedule Modal
  const openRescheduleModal = (lead: Lead) => {
    setActiveRescheduleLead(lead);
    setRescheduleNotes(lead.followUpNotes || "");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const localIso = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setRescheduleDate(localIso);
  };

  // Submit Reschedule
  const handleSaveReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRescheduleLead || !rescheduleDate) return;

    try {
      setIsSubmittingReschedule(true);
      await api.patch(`/leads/${activeRescheduleLead.id}/follow-up`, {
        followUpAt: new Date(rescheduleDate).toISOString(),
        followUpNotes: rescheduleNotes.trim() || null,
      });

      alert("Follow-up rescheduled successfully!");
      setActiveRescheduleLead(null);
      fetchFollowUps();
    } catch (err: any) {
      console.error("Failed to reschedule:", err);
      alert(err.response?.data?.error || "Failed to reschedule follow-up");
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-5 sm:p-6 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent">
              <CalendarClock size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-ink">
                  Team Follow-ups (Today)
                </h1>
                <span className="text-[10px] font-semibold bg-accent/10 border border-accent/25 text-accent px-2 py-0.5 rounded-md">
                  Admin Control
                </span>
              </div>
              <p className="text-xs sm:text-sm text-ink-soft">
                {todayFormatted} • Team-wide scheduled follow-ups
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          {/* Executive Filter */}
          <div className="flex items-center gap-2">
            <Users size={14} className="text-ink-soft shrink-0" />
            <Select
              className="text-xs h-9 bg-bg w-44"
              value={selectedRepId}
              onChange={(e) => setSelectedRepId(e.target.value)}
            >
              <option value="ALL">All Executives</option>
              {salesPeople.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}
                </option>
              ))}
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchFollowUps}
            disabled={isLoading}
            className="text-xs h-9 px-3 gap-1.5"
          >
            <RotateCcw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("TODAY")}
          className={cn(
            "p-4 rounded-xl border text-left transition-all cursor-pointer shadow-xs",
            activeTab === "TODAY"
              ? "bg-ink text-surface border-ink ring-2 ring-accent"
              : "bg-surface hover:bg-surface-muted/60 border-border"
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn("text-[11px] font-semibold uppercase tracking-wider", activeTab === "TODAY" ? "text-surface/80" : "text-ink-soft")}>
              Total Today
            </span>
            <Calendar size={16} className={activeTab === "TODAY" ? "text-accent" : "text-ink-soft"} />
          </div>
          <div className="text-2xl font-serif font-bold mt-2">
            {summary.totalToday}
          </div>
          <div className={cn("text-[10px] mt-0.5", activeTab === "TODAY" ? "text-surface/70" : "text-ink-soft")}>
            Across all executives
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("UPCOMING")}
          className={cn(
            "p-4 rounded-xl border text-left transition-all cursor-pointer shadow-xs",
            activeTab === "UPCOMING"
              ? "bg-amber-600 text-white border-amber-600 ring-2 ring-amber-400"
              : "bg-surface hover:bg-surface-muted/60 border-border"
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn("text-[11px] font-semibold uppercase tracking-wider", activeTab === "UPCOMING" ? "text-white/80" : "text-amber-700 dark:text-amber-400")}>
              Upcoming
            </span>
            <Clock size={16} className={activeTab === "UPCOMING" ? "text-white" : "text-amber-600"} />
          </div>
          <div className="text-2xl font-serif font-bold mt-2 text-amber-600 dark:text-amber-400" style={{ color: activeTab === "UPCOMING" ? "white" : undefined }}>
            {summary.upcomingToday}
          </div>
          <div className={cn("text-[10px] mt-0.5", activeTab === "UPCOMING" ? "text-white/80" : "text-ink-soft")}>
            Later today
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("OVERDUE")}
          className={cn(
            "p-4 rounded-xl border text-left transition-all cursor-pointer shadow-xs",
            activeTab === "OVERDUE"
              ? "bg-rose-600 text-white border-rose-600 ring-2 ring-rose-400"
              : "bg-surface hover:bg-surface-muted/60 border-border"
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn("text-[11px] font-semibold uppercase tracking-wider", activeTab === "OVERDUE" ? "text-white/80" : "text-rose-700 dark:text-rose-400")}>
              Overdue Today
            </span>
            <AlertCircle size={16} className={activeTab === "OVERDUE" ? "text-white" : "text-rose-600"} />
          </div>
          <div className="text-2xl font-serif font-bold mt-2 text-rose-600 dark:text-rose-400" style={{ color: activeTab === "OVERDUE" ? "white" : undefined }}>
            {summary.overdueToday}
          </div>
          <div className={cn("text-[10px] mt-0.5", activeTab === "OVERDUE" ? "text-white/80" : "text-ink-soft")}>
            Requires rep action
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("COMPLETED")}
          className={cn(
            "p-4 rounded-xl border text-left transition-all cursor-pointer shadow-xs",
            activeTab === "COMPLETED"
              ? "bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-400"
              : "bg-surface hover:bg-surface-muted/60 border-border"
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn("text-[11px] font-semibold uppercase tracking-wider", activeTab === "COMPLETED" ? "text-white/80" : "text-emerald-700 dark:text-emerald-400")}>
              Completed
            </span>
            <CheckCircle2 size={16} className={activeTab === "COMPLETED" ? "text-white" : "text-emerald-600"} />
          </div>
          <div className="text-2xl font-serif font-bold mt-2 text-emerald-600 dark:text-emerald-400" style={{ color: activeTab === "COMPLETED" ? "white" : undefined }}>
            {summary.completedToday}
          </div>
          <div className={cn("text-[10px] mt-0.5", activeTab === "COMPLETED" ? "text-white/80" : "text-ink-soft")}>
            Called today
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ALL_PENDING")}
          className={cn(
            "col-span-2 sm:col-span-1 p-4 rounded-xl border text-left transition-all cursor-pointer shadow-xs",
            activeTab === "ALL_PENDING"
              ? "bg-purple-700 text-white border-purple-700 ring-2 ring-purple-400"
              : "bg-surface hover:bg-surface-muted/60 border-border"
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn("text-[11px] font-semibold uppercase tracking-wider", activeTab === "ALL_PENDING" ? "text-white/80" : "text-purple-700 dark:text-purple-400")}>
              Total Pending
            </span>
            <AlertCircle size={16} className={activeTab === "ALL_PENDING" ? "text-white" : "text-purple-600"} />
          </div>
          <div className="text-2xl font-serif font-bold mt-2 text-purple-700 dark:text-purple-400" style={{ color: activeTab === "ALL_PENDING" ? "white" : undefined }}>
            {summary.allOverdue}
          </div>
          <div className={cn("text-[10px] mt-0.5", activeTab === "ALL_PENDING" ? "text-white/80" : "text-ink-soft")}>
            Includes older dates
          </div>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("TODAY")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer",
              activeTab === "TODAY"
                ? "bg-ink text-surface shadow-2xs"
                : "bg-surface text-ink-soft hover:text-ink border border-border"
            )}
          >
            All Today ({summary.totalToday})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("UPCOMING")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer",
              activeTab === "UPCOMING"
                ? "bg-amber-600 text-white shadow-2xs"
                : "bg-surface text-ink-soft hover:text-ink border border-border"
            )}
          >
            ⏳ Upcoming ({summary.upcomingToday})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("OVERDUE")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer",
              activeTab === "OVERDUE"
                ? "bg-rose-600 text-white shadow-2xs"
                : "bg-surface text-ink-soft hover:text-ink border border-border"
            )}
          >
            🔴 Overdue Today ({summary.overdueToday})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("COMPLETED")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer",
              activeTab === "COMPLETED"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-surface text-ink-soft hover:text-ink border border-border"
            )}
          >
            🟢 Completed ({summary.completedToday})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ALL_PENDING")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer",
              activeTab === "ALL_PENDING"
                ? "bg-purple-700 text-white shadow-2xs"
                : "bg-surface text-ink-soft hover:text-ink border border-border"
            )}
          >
            ⚠️ Total Pending ({summary.allOverdue})
          </button>
        </div>

        <div className="relative min-w-[240px] sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer, executive, notes..."
            className="pl-9 h-9 text-xs bg-surface"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Leads Feed */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-surface rounded-2xl border border-border text-center">
          <RotateCcw size={28} className="animate-spin text-accent mb-3" />
          <p className="text-sm font-semibold text-ink">Loading team follow-ups...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-surface rounded-2xl border border-border text-center">
          <CheckCircle2 size={36} className="text-emerald-500 mb-3" />
          <h3 className="text-base font-serif font-bold text-ink">No follow-ups found in this view</h3>
          <p className="text-xs text-ink-soft max-w-sm mt-1">
            {activeTab === "TODAY"
              ? "All scheduled follow-ups for today are addressed or none scheduled."
              : "No records match the current filter criteria."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map((lead) => {
            const timeStr = formatISTTime(lead.followUpAt);
            const dateTimeStr = formatISTDateTime(lead.followUpAt);
            const isCompleted = lead.followUpStatus === "COMPLETED";
            const isOverdue = lead.followUpStatus === "OVERDUE";

            const lastCallLog = lead.callLogs && lead.callLogs.length > 0 ? lead.callLogs[0] : null;
            const lastCallText = lastCallLog?.notes && !lastCallLog.notes.startsWith("[AUDIT:")
              ? lastCallLog.notes
              : (lead.formAnswers?.callNotes || lead.formAnswers?.notes || null);

            return (
              <div
                key={lead.id}
                className={cn(
                  "bg-surface rounded-2xl border transition-all p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4",
                  isCompleted
                    ? "border-emerald-500/30 bg-emerald-500/[0.02]"
                    : isOverdue
                    ? "border-rose-500/40 bg-rose-500/[0.02]"
                    : "border-border hover:border-accent/40"
                )}
              >
                {/* Left Section */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div
                    className={cn(
                      "shrink-0 flex flex-col items-center justify-center rounded-xl p-2.5 min-w-[76px] border text-center",
                      isCompleted
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                        : isOverdue
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
                    )}
                  >
                    <Clock size={16} className="mb-0.5" />
                    <span className="text-xs font-bold leading-tight">{timeStr || "Today"}</span>
                    <span className="text-[9px] font-semibold uppercase tracking-wider mt-0.5">
                      {isCompleted ? "Done" : isOverdue ? "Overdue" : "Pending"}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif font-bold text-base text-ink">
                        {lead.name}
                      </span>
                      <SourceBadge source={lead.source} />

                      {/* Assigned Executive Badge */}
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-400/30 flex items-center gap-1">
                        <User size={10} />
                        <span>{lead.assignedTo?.name || "Unassigned"}</span>
                      </span>

                      {lead.category && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-bg text-ink-soft border border-border">
                          {lead.category}
                        </span>
                      )}
                      {lead.funnelStage && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-bg text-ink-soft border border-border font-medium">
                          {lead.funnelStage}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 text-xs text-ink-soft flex-wrap">
                      <a
                        href={`tel:${lead.phone}`}
                        className="inline-flex items-center gap-1 font-semibold text-ink hover:text-accent transition-colors"
                      >
                        <Phone size={12} className="text-accent" />
                        <span>{lead.phone}</span>
                      </a>

                      <WhatsAppButton
                        phone={lead.phone}
                        size="xs"
                        className="text-[11px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1"
                      />

                      {lead.isPastDay && (
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-400/30">
                          Scheduled for {dateTimeStr}
                        </span>
                      )}
                    </div>

                    {/* Follow-up Note */}
                    {lead.followUpNotes && (
                      <div className="bg-amber-500/10 border border-amber-500/25 text-amber-950 dark:text-amber-200 text-xs px-3 py-1.5 rounded-lg flex items-start gap-1.5 mt-1">
                        <span className="font-bold text-amber-700 dark:text-amber-400 shrink-0">Purpose:</span>
                        <span className="italic break-words">&ldquo;{lead.followUpNotes}&rdquo;</span>
                      </div>
                    )}

                    {lastCallText && lastCallText !== lead.followUpNotes && (
                      <div className="text-[11px] text-ink-soft flex items-start gap-1 line-clamp-2 mt-0.5">
                        <span className="font-semibold text-ink-soft/80 shrink-0">Prev Remark:</span>
                        <span className="italic">&ldquo;{lastCallText}&rdquo;</span>
                      </div>
                    )}

                    <LeadNotesBox
                      lead={lead}
                      onLeadUpdated={(updatedLead) => {
                        setLeads((prev) =>
                          prev.map((l) => (l.id === updatedLead.id ? { ...l, ...updatedLead } : l))
                        );
                      }}
                    />
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center md:flex-col justify-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/50">
                  <Button
                    size="sm"
                    onClick={() => openCallModal(lead)}
                    className="flex-1 md:w-36 h-9 text-xs font-semibold gap-1.5 bg-accent hover:bg-accent/90 text-white shadow-2xs"
                  >
                    <Phone size={13} />
                    <span>Log Call</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openRescheduleModal(lead)}
                    className="flex-1 md:w-36 h-8 text-xs font-medium gap-1.5 border-border hover:bg-surface-muted"
                  >
                    <Calendar size={13} />
                    <span>Reschedule</span>
                  </Button>

                  <button
                    type="button"
                    onClick={() => handleDismissFollowUp(lead.id)}
                    className="text-[11px] text-ink-soft hover:text-emerald-600 transition-colors py-1 px-2 rounded hover:bg-emerald-500/10 flex items-center gap-1"
                  >
                    <Check size={12} />
                    <span>Mark Done</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Log Call Modal */}
      {activeCallLead && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-lg p-5 sm:p-6 my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-lg font-serif font-bold text-ink">Record Call Interaction</h3>
                <p className="text-xs text-ink-soft">
                  Customer: <strong className="text-ink">{activeCallLead.name}</strong> ({activeCallLead.phone})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveCallLead(null)}
                className="p-1 rounded-lg text-ink-soft hover:text-ink hover:bg-surface-muted transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCall} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Call Discussion & Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="e.g. Discussed with client, confirmed interest..."
                  className="w-full text-xs rounded-xl border border-border bg-bg p-3 text-ink focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Next Follow-up Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={nextFollowUpAt}
                    onChange={(e) => setNextFollowUpAt(e.target.value)}
                    className="h-9 text-xs bg-bg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Next Follow-up Purpose / Note</label>
                  <Input
                    value={nextFollowUpNotes}
                    onChange={(e) => setNextFollowUpNotes(e.target.value)}
                    placeholder="e.g. Call to confirm..."
                    className="h-9 text-xs bg-bg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveCallLead(null)}
                  className="text-xs h-9 px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!callNotes.trim() || isSubmittingCall}
                  className="text-xs h-9 px-4 font-semibold bg-accent text-white"
                >
                  {isSubmittingCall ? "Saving..." : "Save Call & Complete Follow-up"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {activeRescheduleLead && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6 my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-lg font-serif font-bold text-ink">Reschedule Follow-up</h3>
                <p className="text-xs text-ink-soft">
                  Customer: <strong className="text-ink">{activeRescheduleLead.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveRescheduleLead(null)}
                className="p-1 rounded-lg text-ink-soft hover:text-ink hover:bg-surface-muted transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveReschedule} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  New Follow-up Date & Time <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  type="datetime-local"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="h-10 text-xs bg-bg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Follow-up Purpose / Note
                </label>
                <textarea
                  rows={2}
                  value={rescheduleNotes}
                  onChange={(e) => setRescheduleNotes(e.target.value)}
                  placeholder="e.g. Call regarding loan approval..."
                  className="w-full text-xs rounded-xl border border-border bg-bg p-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveRescheduleLead(null)}
                  className="text-xs h-9 px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!rescheduleDate || isSubmittingReschedule}
                  className="text-xs h-9 px-4 font-semibold bg-accent text-white"
                >
                  {isSubmittingReschedule ? "Saving..." : "Update Schedule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
