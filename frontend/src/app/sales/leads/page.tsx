"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { Phone, Search, XCircle, Clock, Calendar, Download, Filter, RotateCcw, MessageSquare, Building2, MapPin, ArrowRight, CalendarClock } from "lucide-react";
import { SourceBadge } from "@/components/SourceBadge";
import { LeadContactButtons } from "@/components/LeadContactButtons";
import { LeadNotesBox } from "@/components/LeadNotesBox";
import {
  CATEGORY_OPTIONS,
  STAGES_CALL_PICKED,
  STAGES_CALL_NOT_PICKED,
  getStagesForCategory,
  formatStageLabel,
  formatCategoryLabel,
} from "@/lib/leadFunnel";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  source?: string;
  sourceForm?: string;
  formAnswers?: {
    notes?: string;
    callNotes?: string;
    [key: string]: any;
  } | any;
  category: string | null;
  funnelStage: string | null;
  status: string;
  dateReceived: string;
  assignedToId?: string | null;
  assignedTo?: {
    id: string;
    name: string;
  } | null;
  followUpAt?: string | null;
  followUpNotes?: string | null;
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
  assignmentHistory?: {
    assignedAt: string;
    assignedToId?: string;
    assignedById?: string;
  }[];
  aiChatHistory?: any;
}

// Deterministic Indian Standard Time (Asia/Kolkata) date string: YYYY-MM-DD
function toISTDateString(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dateObj = typeof d === "string" ? new Date(d) : d;
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return "";
  return dateObj.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

// Backward compatible alias
function toLocalDateString(d: Date | string | null | undefined): string {
  return toISTDateString(d);
}

function isLeadAssignedOnDate(lead: Lead, targetDateStr: string): boolean {
  if (!targetDateStr) return false;
  if (Array.isArray(lead.assignmentHistory) && lead.assignmentHistory.length > 0) {
    if (lead.assignmentHistory.some(a => a.assignedAt && toISTDateString(a.assignedAt) === targetDateStr)) {
      return true;
    }
  }
  if (lead.dateReceived && toISTDateString(lead.dateReceived) === targetDateStr) {
    return true;
  }
  return false;
}

// Official Site Visit / Office Visit marked done on a specific date (in IST)
function isLeadVisitDoneOnDate(lead: Lead, targetDateStr: string): boolean {
  if (!targetDateStr) return false;
  // 1. Status history stage change to SITE_VISIT_DONE or OFFICE_VISIT_DONE on target date
  if (Array.isArray(lead.statusHistory)) {
    const hasStatusChange = lead.statusHistory.some((sh) =>
      sh.changedAt &&
      toISTDateString(sh.changedAt) === targetDateStr &&
      (sh.stage === "SITE_VISIT_DONE" || sh.stage === "OFFICE_VISIT_DONE")
    );
    if (hasStatusChange) return true;
  }
  // 2. Official visit interaction logged on target date
  if (Array.isArray(lead.callLogs)) {
    const hasVisitLog = lead.callLogs.some((cl) => {
      if (!cl.createdAt || toISTDateString(cl.createdAt) !== targetDateStr) return false;
      const notes = (cl.notes || "").toLowerCase();
      if (notes.startsWith("[audit:")) return false;
      return notes.includes("[site visit") || notes.includes("[office visit");
    });
    if (hasVisitLog) return true;
  }
  return false;
}

// Number of calls logged on a specific date (in IST)
function getLeadCallsOnDate(lead: Lead, targetDateStr: string): number {
  if (!targetDateStr || !Array.isArray(lead.callLogs)) return 0;
  return lead.callLogs.filter((cl) => cl.createdAt && toISTDateString(cl.createdAt) === targetDateStr && !cl.notes?.startsWith("[AUDIT:")).length;
}

// Lead active on a specific date (calls, visits, assigned, or status updated in IST)
function isLeadActiveOnDate(lead: Lead, targetDateStr: string): boolean {
  if (!targetDateStr) return false;
  if (getLeadCallsOnDate(lead, targetDateStr) > 0) return true;
  if (isLeadVisitDoneOnDate(lead, targetDateStr)) return true;
  if (isLeadAssignedOnDate(lead, targetDateStr)) return true;
  if (Array.isArray(lead.statusHistory)) {
    if (lead.statusHistory.some((sh) => sh.changedAt && toISTDateString(sh.changedAt) === targetDateStr)) {
      return true;
    }
  }
  return false;
}

function getLeadCallNotes(lead: Lead): { note: string; date?: string }[] {
  const list: { note: string; date?: string }[] = [];
  if (Array.isArray(lead.callLogs)) {
    for (const cl of lead.callLogs) {
      if (cl.notes && cl.notes.trim() && !cl.notes.startsWith("[AUDIT:")) {
        list.push({
          note: cl.notes.trim(),
          date: cl.createdAt
            ? new Date(cl.createdAt).toLocaleDateString("en-IN", {
                timeZone: "Asia/Kolkata",
                day: "numeric",
                month: "short",
              })
            : undefined,
        });
      }
    }
  }
  if (lead.formAnswers?.callNotes && typeof lead.formAnswers.callNotes === "string" && lead.formAnswers.callNotes.trim() && !lead.formAnswers.callNotes.startsWith("[AUDIT:")) {
    const cn = lead.formAnswers.callNotes.trim();
    if (!list.some(item => item.note === cn)) {
      list.unshift({ note: cn });
    }
  }
  return list;
}

// Retrieves all relevant latest remarks for display in Source & Notes
function getLeadLatestRemarks(lead: Lead): {
  followUpNote?: string | null;
  latestCallNote?: string | null;
  originalNote?: string | null;
} {
  const followUpNote = lead.followUpNotes?.trim() || null;

  let latestCallNote: string | null = null;
  if (Array.isArray(lead.callLogs) && lead.callLogs.length > 0) {
    const sorted = [...lead.callLogs]
      .filter((cl) => cl.notes && cl.notes.trim() && !cl.notes.startsWith("[AUDIT:"))
      .sort((a, b) => {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tB - tA;
      });
    if (sorted.length > 0 && sorted[0].notes) {
      latestCallNote = sorted[0].notes.trim();
    }
  }

  if (!latestCallNote && lead.formAnswers?.callNotes && typeof lead.formAnswers.callNotes === "string" && lead.formAnswers.callNotes.trim() && !lead.formAnswers.callNotes.startsWith("[AUDIT:")) {
    latestCallNote = lead.formAnswers.callNotes.trim();
  }

  const originalNote = typeof lead.formAnswers?.notes === "string" && lead.formAnswers.notes.trim()
    ? lead.formAnswers.notes.trim()
    : null;

  return { followUpNote, latestCallNote, originalNote };
}

function getLeadLastCallDate(lead: Lead): {
  dateStr: string;
  timeStr?: string;
  isToday?: boolean;
  isYesterday?: boolean;
  totalCalls: number;
} | null {
  if (Array.isArray(lead.callLogs) && lead.callLogs.length > 0) {
    const validLogs = lead.callLogs
      .filter((cl) => cl.createdAt)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());

    const latest = validLogs[0];
    if (latest && latest.createdAt) {
      const date = new Date(latest.createdAt);
      if (!isNaN(date.getTime())) {
        const callDateIST = toISTDateString(date);
        const nowIST = toISTDateString(new Date());
        const yesterdayObj = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const yesterdayIST = toISTDateString(yesterdayObj);

        const isToday = callDateIST === nowIST;
        const isYesterday = callDateIST === yesterdayIST;

        const timeStr = date.toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

        const dateStr = isToday
          ? "Today"
          : isYesterday
          ? "Yesterday"
          : date.toLocaleDateString("en-IN", {
              timeZone: "Asia/Kolkata",
              day: "numeric",
              month: "short",
              year: "numeric",
            });

        return {
          dateStr,
          timeStr,
          isToday,
          isYesterday,
          totalCalls: lead.callLogs.length,
        };
      }
    }
  }
  return null;
}

function formatFollowUpDate(dateStr: string) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";

  const dateIST = toISTDateString(date);
  const nowIST = toISTDateString(new Date());
  const tomorrowObj = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const tomorrowIST = toISTDateString(tomorrowObj);

  const isToday = dateIST === nowIST;
  const isTomorrow = dateIST === tomorrowIST;

  const timeStr = date.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) return `Today at ${timeStr}`;
  if (isTomorrow) return `Tomorrow at ${timeStr}`;

  return `${date.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
  })} at ${timeStr}`;
}

export default function MyLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id || parsed?.userId) {
          setCurrentUserId(parsed.id || parsed.userId);
        }
      }
    } catch {}
  }, []);
  
  // Call Log Modal State
  const [activeCallLead, setActiveCallLead] = useState<Lead | null>(null);
  const [callNotes, setCallNotes] = useState("");
  const [occupation, setOccupation] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [followUpAt, setFollowUpAt] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");

  // Office Visit Modal State
  const [activeOfficeVisitLead, setActiveOfficeVisitLead] = useState<Lead | null>(null);
  const [officeVisitNotes, setOfficeVisitNotes] = useState("");
  const [officeVisitFollowUpAt, setOfficeVisitFollowUpAt] = useState("");
  const [officeVisitFollowUpNotes, setOfficeVisitFollowUpNotes] = useState("");
  const [isSavingVisit, setIsSavingVisit] = useState(false);

  // Site Visit Modal State
  const [activeSiteVisitLead, setActiveSiteVisitLead] = useState<Lead | null>(null);
  const [siteVisitProject, setSiteVisitProject] = useState("");
  const [siteVisitNotes, setSiteVisitNotes] = useState("");
  const [siteVisitFollowUpAt, setSiteVisitFollowUpAt] = useState("");
  const [siteVisitFollowUpNotes, setSiteVisitFollowUpNotes] = useState("");
  const [isSavingSiteVisit, setIsSavingSiteVisit] = useState(false);

  // Filters State
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [followUpFilter, setFollowUpFilter] = useState<"ALL" | "TODAY">("ALL");

  // Date Filter State for Daily Reports
  const [datePreset, setDatePreset] = useState<"ALL" | "TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "CUSTOM">("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateTarget, setDateTarget] = useState<"ANY" | "CALL" | "VISIT" | "RECEIVED">("ANY");

  const todayStr = toISTDateString(new Date());
  const yesterdayObj = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const yesterdayStr = toISTDateString(yesterdayObj);
  const weekAgoObj = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekAgoStr = toISTDateString(weekAgoObj);

  const isDateFilterActive = datePreset !== "ALL" || Boolean(startDate) || Boolean(endDate);

  const applyDatePreset = (preset: "ALL" | "TODAY" | "YESTERDAY" | "LAST_7_DAYS") => {
    setDatePreset(preset);
    setStartDate("");
    setEndDate("");
  };

  const resetFilters = () => {
    setCategoryFilter("");
    setStageFilter("");
    setSourceFilter("ALL");
    setSearchQuery("");
    setFollowUpFilter("ALL");
    setDatePreset("ALL");
    setStartDate("");
    setEndDate("");
    setDateTarget("ANY");
  };

  const hasActiveFilters = Boolean(
    categoryFilter ||
    stageFilter ||
    (sourceFilter && sourceFilter !== "ALL") ||
    searchQuery.trim() ||
    isDateFilterActive ||
    followUpFilter !== "ALL"
  );

  const isCallPicked = (cat?: string | null) => cat === "CALL_PICKED" || cat === "HOT" || cat === "WARM" || !cat;
  const isCallNotPicked = (cat?: string | null) => cat === "CALL_NOT_PICKED" || cat === "COLD";

  // Effective category normalized against lead funnel stage
  const getLeadEffectiveCategory = (lead: Lead): "CALL_PICKED" | "CALL_NOT_PICKED" => {
    if (lead.funnelStage === "CALLBACK" || lead.funnelStage === "CALL_NOT_PICKED") {
      return "CALL_NOT_PICKED";
    }
    if (lead.funnelStage && lead.funnelStage !== "LOST") {
      return "CALL_PICKED";
    }
    return isCallNotPicked(lead.category) ? "CALL_NOT_PICKED" : "CALL_PICKED";
  };

  const matchesDateCondition = (dStr: string) => {
    if (!dStr) return false;
    if (datePreset === "TODAY") return dStr === todayStr;
    if (datePreset === "YESTERDAY") return dStr === yesterdayStr;
    if (datePreset === "LAST_7_DAYS") return dStr >= weekAgoStr && dStr <= todayStr;
    if (datePreset === "CUSTOM") {
      if (startDate && endDate) return dStr >= startDate && dStr <= endDate;
      if (startDate) return dStr === startDate;
      if (endDate) return dStr <= endDate;
    }
    return true;
  };

  const leadMatchesDateFilter = (lead: Lead) => {
    if (!isDateFilterActive) return true;

    if (dateTarget === "CALL") {
      if (Array.isArray(lead.callLogs)) {
        return lead.callLogs.some((cl) => cl.createdAt && matchesDateCondition(toISTDateString(cl.createdAt)));
      }
      return false;
    }

    if (dateTarget === "VISIT") {
      if (Array.isArray(lead.statusHistory)) {
        const hasStatus = lead.statusHistory.some((sh) =>
          sh.changedAt &&
          matchesDateCondition(toISTDateString(sh.changedAt)) &&
          (sh.stage === "SITE_VISIT_DONE" || sh.stage === "OFFICE_VISIT_DONE")
        );
        if (hasStatus) return true;
      }
      if (Array.isArray(lead.callLogs)) {
        const hasLog = lead.callLogs.some((cl) => {
          if (!cl.createdAt || !matchesDateCondition(toISTDateString(cl.createdAt))) return false;
          const notes = (cl.notes || "").toLowerCase();
          return notes.includes("[site visit") || notes.includes("[office visit");
        });
        if (hasLog) return true;
      }
      return false;
    }

    if (dateTarget === "RECEIVED") {
      if (lead.dateReceived && matchesDateCondition(toISTDateString(lead.dateReceived))) return true;
      if (Array.isArray(lead.assignmentHistory)) {
        return lead.assignmentHistory.some((ah) => ah.assignedAt && matchesDateCondition(toISTDateString(ah.assignedAt)));
      }
      return false;
    }

    // dateTarget === "ANY"
    if (Array.isArray(lead.callLogs) && lead.callLogs.some((cl) => cl.createdAt && matchesDateCondition(toISTDateString(cl.createdAt)))) {
      return true;
    }
    if (Array.isArray(lead.statusHistory) && lead.statusHistory.some((sh) => sh.changedAt && matchesDateCondition(toISTDateString(sh.changedAt)))) {
      return true;
    }
    if (lead.dateReceived && matchesDateCondition(toISTDateString(lead.dateReceived))) return true;
    if (Array.isArray(lead.assignmentHistory) && lead.assignmentHistory.some((ah) => ah.assignedAt && matchesDateCondition(toISTDateString(ah.assignedAt)))) {
      return true;
    }
    return false;
  };

  // Dynamic filter logic
  const filteredLeads = leads.filter((lead) => {
    if (followUpFilter === "TODAY") {
      if (!lead.followUpAt || toISTDateString(lead.followUpAt) !== todayStr) {
        return false;
      }
    }

    if (categoryFilter === "CALL_PICKED" && getLeadEffectiveCategory(lead) !== "CALL_PICKED") {
      return false;
    }
    if (categoryFilter === "CALL_NOT_PICKED" && getLeadEffectiveCategory(lead) !== "CALL_NOT_PICKED") {
      return false;
    }
    if (stageFilter) {
      if (stageFilter === "CALLBACK") {
        if (lead.funnelStage !== "CALLBACK" && lead.funnelStage !== "CALL_NOT_PICKED") return false;
      } else if (lead.funnelStage !== stageFilter) {
        return false;
      }
    }
    if (sourceFilter && sourceFilter !== "ALL") {
      const leadSource = (lead.source || lead.sourceForm || "").toLowerCase();
      if (sourceFilter === "FB") {
        if (!leadSource.includes("facebook") && !leadSource.includes("meta")) return false;
      } else if (sourceFilter === "SHEET") {
        if (!leadSource.includes("sheet") && !leadSource.includes("google")) return false;
      } else if (sourceFilter === "EXCEL") {
        if (!leadSource.includes("excel") && !leadSource.includes("csv")) return false;
      } else if (sourceFilter === "WHATSAPP") {
        if (!leadSource.includes("whatsapp")) return false;
      } else if (sourceFilter === "MANUAL") {
        if (!leadSource.includes("manual") && !leadSource.includes("entry") && !leadSource.includes("test") && !leadSource.includes("direct")) return false;
      } else if (sourceFilter === "FUN_VALLEY") {
        if (!leadSource.includes("fun valley") && !leadSource.includes("funvalley")) return false;
      } else if (sourceFilter === "SAHASTRADHARA") {
        if (!leadSource.includes("sahastradhara") && !leadSource.includes("sahastra dhara") && !leadSource.includes("sd")) return false;
      } else if (sourceFilter === "RANI_POKHARI") {
        if (!leadSource.includes("rani pokhari") && !leadSource.includes("ranipokhari") && !leadSource.includes("rani")) return false;
      } else if (sourceFilter === "THANO") {
        if (!leadSource.includes("thano")) return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = lead.name?.toLowerCase().includes(q);
      const phoneMatch = lead.phone?.toLowerCase().includes(q);
      const emailMatch = lead.email?.toLowerCase().includes(q);
      const sourceMatch = (lead.source || lead.sourceForm || "").toLowerCase().includes(q);
      const notesMatch = typeof lead.formAnswers?.notes === "string" && lead.formAnswers.notes.toLowerCase().includes(q);
      if (!nameMatch && !phoneMatch && !emailMatch && !sourceMatch && !notesMatch) {
        return false;
      }
    }

    // Date / Daily Report Filter
    if (isDateFilterActive && !leadMatchesDateFilter(lead)) {
      return false;
    }

    return true;
  });

  // Leads Given / Received Today & Yesterday matching Admin Dashboard
  const todayLeadsGivenCount = leads.filter((l) => isLeadAssignedOnDate(l, todayStr)).length;
  const yesterdayLeadsGivenCount = leads.filter((l) => isLeadAssignedOnDate(l, yesterdayStr)).length;

  const todayCallsLogsCount = leads.reduce((sum, l) => sum + getLeadCallsOnDate(l, todayStr), 0);
  const todayCalledLeadsCount = leads.filter((l) => getLeadCallsOnDate(l, todayStr) > 0).length;
  const todayCallsCount = todayCallsLogsCount; // Alias for UI

  const yesterdayCallsLogsCount = leads.reduce((sum, l) => sum + getLeadCallsOnDate(l, yesterdayStr), 0);
  const yesterdayCalledLeadsCount = leads.filter((l) => getLeadCallsOnDate(l, yesterdayStr) > 0).length;

  const todayVisitsCount = leads.filter((l) => isLeadVisitDoneOnDate(l, todayStr)).length;
  const yesterdayVisitsCount = leads.filter((l) => isLeadVisitDoneOnDate(l, yesterdayStr)).length;

  const todayActivityCount = leads.filter((l) => isLeadActiveOnDate(l, todayStr)).length;
  const yesterdayActivityCount = leads.filter((l) => isLeadActiveOnDate(l, yesterdayStr)).length;

  const todayFollowUpsCount = leads.filter((l) => l.followUpAt && toISTDateString(l.followUpAt) === todayStr).length;

  // Counts aligned to active filter targets
  const getTodayFilterBadgeCount = () => {
    if (dateTarget === "CALL") return todayCalledLeadsCount;
    if (dateTarget === "VISIT") return todayVisitsCount;
    if (dateTarget === "RECEIVED") return todayLeadsGivenCount;
    return todayActivityCount;
  };

  const getYesterdayFilterBadgeCount = () => {
    if (dateTarget === "CALL") return yesterdayCalledLeadsCount;
    if (dateTarget === "VISIT") return yesterdayVisitsCount;
    if (dateTarget === "RECEIVED") return yesterdayLeadsGivenCount;
    return yesterdayActivityCount;
  };

  // Dynamic counts for all categories & funnel stages
  const categoryCounts = {
    CALL_PICKED: leads.filter((l) => getLeadEffectiveCategory(l) === "CALL_PICKED").length,
    CALL_NOT_PICKED: leads.filter((l) => getLeadEffectiveCategory(l) === "CALL_NOT_PICKED").length,
  };

  const stageCounts = {
    CALLBACK: leads.filter((l) => l.funnelStage === "CALLBACK" || l.funnelStage === "CALL_NOT_PICKED").length,
    FOLLOW_UP: leads.filter((l) => l.funnelStage === "FOLLOW_UP").length,
    INTERESTED: leads.filter((l) => l.funnelStage === "INTERESTED").length,
    NOT_INTERESTED: leads.filter((l) => l.funnelStage === "NOT_INTERESTED").length,
    DETAILS_SHARED: leads.filter((l) => l.funnelStage === "DETAILS_SHARED").length,
    SITE_VISIT_DONE: leads.filter((l) => l.funnelStage === "SITE_VISIT_DONE").length,
    OFFICE_VISIT_DONE: leads.filter((l) => l.funnelStage === "OFFICE_VISIT_DONE").length,
    BOOKING_DONE: leads.filter((l) => l.funnelStage === "BOOKING_DONE").length,
    DEAL_CLOSED: leads.filter((l) => l.funnelStage === "DEAL_CLOSED").length,
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
      "Source",
      "Occupation",
      "Location",
      "Budget",
      "Call Notes",
      "Notes",
      "Category",
      "Funnel Stage",
      "Call Date",
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
        case "CALL_NOT_PICKED": return "Call Not Picked";
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

    const rows = leadsToExport.map((lead) => {
      const remarks = getLeadLatestRemarks(lead);
      const callNotesList = getLeadCallNotes(lead);
      const callNotesFormatted = callNotesList.map(c => c.date ? `[${c.date}] ${c.note}` : c.note).join(" | ");
      const combinedNotes = [
        remarks.followUpNote ? `[Follow-up] ${remarks.followUpNote}` : "",
        callNotesFormatted,
        remarks.originalNote && remarks.originalNote !== remarks.followUpNote && remarks.originalNote !== callNotesFormatted ? `[Source] ${remarks.originalNote}` : ""
      ].filter(Boolean).join(" | ");
      const lastCallInfo = getLeadLastCallDate(lead);
      const lastCallFormatted = lastCallInfo ? `${lastCallInfo.dateStr} ${lastCallInfo.timeStr || ""}`.trim() : "Not called yet";

      return [
        escapeCSV(lead.name),
        escapeCSV(lead.phone),
        escapeCSV(lead.email || ""),
        escapeCSV(lead.source || lead.sourceForm || "Direct"),
        escapeCSV(lead.formAnswers?.occupation || ""),
        escapeCSV(lead.formAnswers?.location || ""),
        escapeCSV(lead.formAnswers?.budget || ""),
        escapeCSV(remarks.latestCallNote || callNotesFormatted),
        escapeCSV(combinedNotes),
        escapeCSV(formatCategoryLabel(getLeadEffectiveCategory(lead))),
        escapeCSV(formatStageLabel(lead.funnelStage)),
        escapeCSV(lastCallFormatted),
        escapeCSV(lead.status),
        escapeCSV(lead.followUpAt ? new Date(lead.followUpAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : ""),
        escapeCSV(remarks.followUpNote || lead.followUpNotes || ""),
        escapeCSV(lead.dateReceived ? new Date(lead.dateReceived).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : ""),
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const filterSuffix = isDateFilterActive
      ? `_${datePreset === "CUSTOM" && startDate ? startDate : datePreset.toLowerCase()}`
      : hasActiveFilters ? "_filtered" : "_all";

    const exportFileName = isDateFilterActive
      ? `daily_report_${datePreset === "CUSTOM" && startDate ? startDate : datePreset === "TODAY" ? todayStr : datePreset.toLowerCase()}.csv`
      : `my_leads${filterSuffix}_${todayStr}.csv`;

    link.href = url;
    link.setAttribute("download", exportFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const fetchLeads = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await api.get("/leads/mine");
      setLeads(res.data);
    } catch (err) {
      console.error("Failed to fetch my leads", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();

    // Auto-refresh polling every 30 seconds so new leads appear in real-time
    const interval = setInterval(() => {
      fetchLeads(true);
    }, 30000);

    // Refresh when user returns to tab
    const handleFocus = () => {
      fetchLeads(true);
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [fetchLeads]);

  const updateCategory = async (id: string, category: string) => {
    try {
      const lead = leads.find((l) => l.id === id);
      let nextStage = lead?.funnelStage;
      if (category === "CALL_NOT_PICKED") {
        nextStage = "CALLBACK";
      } else if (category === "CALL_PICKED" && (!nextStage || nextStage === "CALLBACK" || nextStage === "CALL_NOT_PICKED")) {
        nextStage = "FOLLOW_UP";
      }

      await api.patch(`/leads/${id}/category`, { category });
      if (nextStage && nextStage !== lead?.funnelStage) {
        await api.patch(`/leads/${id}/stage`, { stage: nextStage });
      }

      setLeads(
        leads.map((l) =>
          l.id === id
            ? { ...l, category, ...(nextStage ? { funnelStage: nextStage } : {}) }
            : l
        )
      );
    } catch (err) {
      console.error("Failed to update category", err);
      alert("Failed to update category");
    }
  };

  const updateStage = async (id: string, stage: string) => {
    if (stage === "SITE_VISIT_DONE") {
      const lead = leads.find((l) => l.id === id);
      if (lead) {
        openSiteVisitModal(lead);
        return;
      }
    }

    if (stage === "OFFICE_VISIT_DONE") {
      const lead = leads.find((l) => l.id === id);
      if (lead) {
        openOfficeVisitModal(lead);
        return;
      }
    }

    try {
      const lead = leads.find((l) => l.id === id);
      let nextCategory = lead?.category;
      if (stage === "CALLBACK") {
        nextCategory = "CALL_NOT_PICKED";
      } else if (stage !== "LOST") {
        nextCategory = "CALL_PICKED";
      }

      await api.patch(`/leads/${id}/stage`, { stage });
      if (nextCategory && nextCategory !== lead?.category) {
        await api.patch(`/leads/${id}/category`, { category: nextCategory });
      }

      setLeads(
        leads.map((l) =>
          l.id === id
            ? { ...l, funnelStage: stage, ...(nextCategory ? { category: nextCategory } : {}) }
            : l
        )
      );
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
    if (!activeCallLead) return;

    try {
      await api.post("/calls", {
        leadId: activeCallLead.id,
        notes: callNotes,
        occupation: occupation.trim(),
        location: location.trim(),
        budget: budget.trim(),
        followUpAt: followUpAt ? new Date(followUpAt).toISOString() : null,
        followUpNotes: followUpNotes || null,
      });

      // Update lead in local state so table and cards reflect details immediately
      const cleanCallNotes = callNotes.trim();
      const newCallLogEntry = {
        id: "temp-" + Date.now(),
        notes: cleanCallNotes || null,
        createdAt: new Date().toISOString(),
        salesPersonId: currentUserId || activeCallLead.assignedToId || "",
      };
      setLeads(prev => prev.map(l => l.id === activeCallLead.id ? {
        ...l,
        formAnswers: {
          ...(typeof l.formAnswers === "object" ? l.formAnswers : {}),
          occupation: occupation.trim(),
          location: location.trim(),
          budget: budget.trim(),
          ...(cleanCallNotes ? { callNotes: cleanCallNotes } : {}),
        },
        callLogs: [newCallLogEntry, ...(l.callLogs || [])],
        followUpAt: followUpAt ? new Date(followUpAt).toISOString() : l.followUpAt,
        followUpNotes: followUpAt ? (followUpNotes || null) : l.followUpNotes,
      } : l));

      alert("Interaction & lead details saved successfully!");
      setActiveCallLead(null);
      setCallNotes("");
      setOccupation("");
      setLocation("");
      setBudget("");
      setFollowUpAt("");
      setFollowUpNotes("");
    } catch (err: any) {
      console.error("Failed to log call", err);
      alert(err.response?.data?.error || "Failed to log interaction");
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
    setCallNotes("");
    setOccupation(lead.formAnswers?.occupation || "");
    setLocation(lead.formAnswers?.location || "");
    setBudget(lead.formAnswers?.budget || "");
    setFollowUpAt(lead.followUpAt ? new Date(lead.followUpAt).toISOString().slice(0, 16) : "");
    setFollowUpNotes(lead.followUpNotes || "");
    setActiveCallLead(lead);
  };

  const openOfficeVisitModal = (lead: Lead) => {
    setActiveOfficeVisitLead(lead);
    setOfficeVisitNotes("");
    setOfficeVisitFollowUpAt(lead.followUpAt ? new Date(lead.followUpAt).toISOString().slice(0, 16) : "");
    setOfficeVisitFollowUpNotes(lead.followUpNotes || "");
  };

  const handleSaveOfficeVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOfficeVisitLead) return;

    try {
      setIsSavingVisit(true);
      await api.patch(`/leads/${activeOfficeVisitLead.id}/stage`, { stage: "OFFICE_VISIT_DONE" });
      await api.patch(`/leads/${activeOfficeVisitLead.id}/category`, { category: "CALL_PICKED" });

      const visitNote = officeVisitNotes.trim()
        ? `[Office Visit] ${officeVisitNotes.trim()}`
        : "[Office Visit] Client visited office.";

      await api.post("/calls", {
        leadId: activeOfficeVisitLead.id,
        notes: visitNote,
        followUpAt: officeVisitFollowUpAt ? new Date(officeVisitFollowUpAt).toISOString() : null,
        followUpNotes: officeVisitFollowUpNotes || null,
      });

      const newCallLogEntry = {
        id: "temp-" + Date.now(),
        notes: visitNote,
        createdAt: new Date().toISOString(),
        salesPersonId: currentUserId || activeOfficeVisitLead.assignedToId || "",
      };

      const newStatusHistoryEntry = {
        id: "temp-sh-" + Date.now(),
        stage: "OFFICE_VISIT_DONE",
        changedAt: new Date().toISOString(),
        changedById: currentUserId || activeOfficeVisitLead.assignedToId || "",
      };

      setLeads((prev) =>
        prev.map((l) =>
          l.id === activeOfficeVisitLead.id
            ? {
                ...l,
                category: "CALL_PICKED",
                funnelStage: "OFFICE_VISIT_DONE",
                callLogs: [newCallLogEntry, ...(l.callLogs || [])],
                statusHistory: [newStatusHistoryEntry, ...(l.statusHistory || [])],
                followUpAt: officeVisitFollowUpAt ? new Date(officeVisitFollowUpAt).toISOString() : l.followUpAt,
                followUpNotes: officeVisitFollowUpAt ? (officeVisitFollowUpNotes || null) : l.followUpNotes,
              }
            : l
        )
      );

      alert("Office Visit recorded successfully! Stage updated to Office Visit Done.");
      setActiveOfficeVisitLead(null);
      setOfficeVisitNotes("");
    } catch (err: any) {
      console.error("Failed to record office visit", err);
      alert(err?.response?.data?.error || "Failed to record office visit");
    } finally {
      setIsSavingVisit(false);
    }
  };

  const openSiteVisitModal = (lead: Lead) => {
    setActiveSiteVisitLead(lead);
    const sourceText = lead.source || lead.sourceForm || "";
    let detectedProject = "";
    if (/fun\s*valley/i.test(sourceText)) detectedProject = "Fun Valley";
    else if (/sahastradhara|sd/i.test(sourceText)) detectedProject = "Sahastradhara";
    else if (/rani\s*pokhari/i.test(sourceText)) detectedProject = "Rani Pokhari";
    else if (/thano/i.test(sourceText)) detectedProject = "Thano";

    setSiteVisitProject(detectedProject);
    setSiteVisitNotes("");
    setSiteVisitFollowUpAt(lead.followUpAt ? new Date(lead.followUpAt).toISOString().slice(0, 16) : "");
    setSiteVisitFollowUpNotes(lead.followUpNotes || "");
  };

  const handleSaveSiteVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSiteVisitLead) return;

    try {
      setIsSavingSiteVisit(true);
      await api.patch(`/leads/${activeSiteVisitLead.id}/stage`, { stage: "SITE_VISIT_DONE" });
      await api.patch(`/leads/${activeSiteVisitLead.id}/category`, { category: "CALL_PICKED" });

      const cleanNotes = siteVisitNotes.trim();
      const proj = siteVisitProject.trim();
      const visitNote = cleanNotes
        ? `[Site Visit${proj ? ` - ${proj}` : ""}] ${cleanNotes}`
        : `[Site Visit${proj ? ` - ${proj}` : ""}] Client completed site visit.`;

      await api.post("/calls", {
        leadId: activeSiteVisitLead.id,
        notes: visitNote,
        followUpAt: siteVisitFollowUpAt ? new Date(siteVisitFollowUpAt).toISOString() : null,
        followUpNotes: siteVisitFollowUpNotes || null,
      });

      const newCallLogEntry = {
        id: "temp-" + Date.now(),
        notes: visitNote,
        createdAt: new Date().toISOString(),
        salesPersonId: currentUserId || activeSiteVisitLead.assignedToId || "",
      };

      const newStatusHistoryEntry = {
        id: "temp-sh-" + Date.now(),
        stage: "SITE_VISIT_DONE",
        changedAt: new Date().toISOString(),
        changedById: currentUserId || activeSiteVisitLead.assignedToId || "",
      };

      setLeads((prev) =>
        prev.map((l) =>
          l.id === activeSiteVisitLead.id
            ? {
                ...l,
                category: "CALL_PICKED",
                funnelStage: "SITE_VISIT_DONE",
                callLogs: [newCallLogEntry, ...(l.callLogs || [])],
                statusHistory: [newStatusHistoryEntry, ...(l.statusHistory || [])],
                followUpAt: siteVisitFollowUpAt ? new Date(siteVisitFollowUpAt).toISOString() : l.followUpAt,
                followUpNotes: siteVisitFollowUpAt ? (siteVisitFollowUpNotes || null) : l.followUpNotes,
              }
            : l
        )
      );

      alert("Site Visit recorded successfully! Stage updated to Site Visit Done.");
      setActiveSiteVisitLead(null);
      setSiteVisitNotes("");
      setSiteVisitProject("");
    } catch (err: any) {
      console.error("Failed to record site visit", err);
      alert(err?.response?.data?.error || "Failed to record site visit");
    } finally {
      setIsSavingSiteVisit(false);
    }
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
            className="flex items-center gap-2 h-9 sm:h-10 text-xs sm:text-sm border-emerald-600/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 font-medium shadow-2xs"
            title={hasActiveFilters ? "Export filtered leads as CSV" : "Export all assigned leads as CSV"}
          >
            <Download size={15} />
            <span>
              {isDateFilterActive
                ? `Export Daily Report (${filteredLeads.length})`
                : hasActiveFilters
                ? `Export CSV (${filteredLeads.length})`
                : `Export CSV (${leads.length})`}
            </span>
          </Button>
        </div>
      </div>

      {/* Today's Follow-up Alert Banner */}
      {todayFollowUpsCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/15 border border-amber-500/30 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-ink">Today&apos;s Follow-ups Scheduled</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-2xs">
                  {todayFollowUpsCount} {todayFollowUpsCount === 1 ? "lead" : "leads"}
                </span>
              </div>
              <p className="text-xs text-ink-soft mt-0.5">
                You have {todayFollowUpsCount} scheduled follow-up calls for today ({todayStr}). Click below to review and call them!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (followUpFilter === "TODAY") {
                  setFollowUpFilter("ALL");
                } else {
                  resetFilters();
                  setFollowUpFilter("TODAY");
                }
              }}
              className="text-xs h-8 border-amber-500/40 text-amber-800 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 font-semibold"
            >
              {followUpFilter === "TODAY" ? "Show All Leads" : "Filter in Table"}
            </Button>
            <Link
              href="/sales/follow-ups"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors"
            >
              <span>Follow-ups Workspace</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}

      {/* Daily Performance KPI Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div
          onClick={() => {
            setDatePreset("TODAY");
            setDateTarget("RECEIVED");
            setCategoryFilter("");
            setStageFilter("");
            setFollowUpFilter("ALL");
          }}
          className="bg-surface border border-border hover:border-emerald-500/50 p-3 sm:p-3.5 rounded-xl shadow-xs cursor-pointer transition-all hover:shadow-sm group"
          title="Click to filter leads given to you today"
        >
          <div className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Leads Given Today
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-ink group-hover:text-emerald-600 transition-colors">
              {todayLeadsGivenCount}
            </span>
            <span className="text-xs text-ink-soft font-medium">assigned</span>
          </div>
        </div>

        <div
          onClick={() => {
            setDatePreset("TODAY");
            setDateTarget("CALL");
            setCategoryFilter("");
            setStageFilter("");
            setFollowUpFilter("ALL");
          }}
          className="bg-surface border border-border hover:border-accent/50 p-3 sm:p-3.5 rounded-xl shadow-xs cursor-pointer transition-all hover:shadow-sm group"
          title="Click to filter leads called today"
        >
          <div className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider flex items-center gap-1.5">
            <Phone size={12} className="text-accent" />
            Calls Made Today
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-accent">
              {todayCallsLogsCount}
            </span>
            <span className="text-xs text-ink-soft font-medium">
              {todayCallsLogsCount === todayCalledLeadsCount
                ? "calls"
                : `calls (${todayCalledLeadsCount} leads)`}
            </span>
          </div>
        </div>

        <div
          onClick={() => {
            setDatePreset("TODAY");
            setDateTarget("VISIT");
            setCategoryFilter("");
            setStageFilter("");
            setFollowUpFilter("ALL");
          }}
          className="bg-surface border border-border hover:border-indigo-500/50 p-3 sm:p-3.5 rounded-xl shadow-xs cursor-pointer transition-all hover:shadow-sm group"
          title="Click to filter visits today"
        >
          <div className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider flex items-center gap-1.5">
            <Building2 size={12} className="text-indigo-600 dark:text-indigo-400" />
            Visits Done Today
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {todayVisitsCount}
            </span>
            <span className="text-xs text-ink-soft font-medium">site / office</span>
          </div>
        </div>

        <div
          onClick={() => {
            if (followUpFilter === "TODAY") {
              setFollowUpFilter("ALL");
            } else {
              resetFilters();
              setFollowUpFilter("TODAY");
            }
          }}
          className={`bg-surface border p-3 sm:p-3.5 rounded-xl shadow-xs cursor-pointer transition-all hover:shadow-sm group ${
            followUpFilter === "TODAY"
              ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500"
              : "border-border hover:border-amber-500/50"
          }`}
          title="Click to filter today's scheduled follow-ups"
        >
          <div className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CalendarClock size={12} className="text-amber-500" />
              Follow-ups Today
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">
              {todayFollowUpsCount}
            </span>
            <span className="text-xs text-ink-soft font-medium">scheduled</span>
          </div>
        </div>

        <div
          onClick={resetFilters}
          className="bg-surface border border-border hover:border-ink/40 p-3 sm:p-3.5 rounded-xl shadow-xs cursor-pointer transition-all hover:shadow-sm group"
          title="Click to view all leads"
        >
          <div className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">
            Total Active Leads
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-ink">
              {leads.length}
            </span>
            <span className="text-xs text-ink-soft font-medium">in workspace</span>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-surface border border-border p-3.5 sm:p-4 rounded-xl shadow-sm space-y-3">
        {/* Dropdown & Search Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          {/* Search Input */}
          <div>
            <label className="block text-[10px] font-semibold text-ink-soft uppercase tracking-wider mb-1">
              Search Leads
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
              <Input
                placeholder="Search name, phone, email, source, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-xs sm:text-sm bg-bg"
              />
            </div>
          </div>

          {/* Source Dropdown */}
          <div>
            <label className="block text-[10px] font-semibold text-ink-soft uppercase tracking-wider mb-1">
              Source
            </label>
            <Select
              className="w-full bg-bg h-10 text-sm"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="ALL">All Sources ({leads.length})</option>
              <option value="FUN_VALLEY">Fun Valley</option>
              <option value="SAHASTRADHARA">Sahastradhara</option>
              <option value="RANI_POKHARI">Rani Pokhari</option>
              <option value="THANO">Thano</option>
              <option value="EXCEL">Excel Bulk Imports</option>
              <option value="FB">Meta / FB Leads</option>
              <option value="SHEET">Google Sheets</option>
              <option value="WHATSAPP">WhatsApp Bot</option>
              <option value="MANUAL">Direct / Manual</option>
            </Select>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-[10px] font-semibold text-ink-soft uppercase tracking-wider mb-1">
              Category
            </label>
            <Select
              className="w-full bg-bg h-10 text-sm"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setStageFilter("");
              }}
            >
              <option value="">Any Category ({leads.length})</option>
              <option value="CALL_PICKED">Call Picked 📞 ({categoryCounts.CALL_PICKED})</option>
              <option value="CALL_NOT_PICKED">Call Not Picked 📵 ({categoryCounts.CALL_NOT_PICKED})</option>
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
              {categoryFilter === "CALL_NOT_PICKED" ? (
                <option value="CALLBACK">Callback ({stageCounts.CALLBACK})</option>
              ) : categoryFilter === "CALL_PICKED" ? (
                <>
                  <option value="FOLLOW_UP">Follow-up ({stageCounts.FOLLOW_UP})</option>
                  <option value="INTERESTED">Interested ({stageCounts.INTERESTED})</option>
                  <option value="DETAILS_SHARED">Details Shared ({stageCounts.DETAILS_SHARED})</option>
                  <option value="SITE_VISIT_DONE">Site Visit Done ({stageCounts.SITE_VISIT_DONE})</option>
                  <option value="OFFICE_VISIT_DONE">Office Visit Done ({stageCounts.OFFICE_VISIT_DONE})</option>
                  <option value="BOOKING_DONE">Booking Done ({stageCounts.BOOKING_DONE})</option>
                  <option value="DEAL_CLOSED">Deal Closed ({stageCounts.DEAL_CLOSED})</option>
                  <option value="NOT_INTERESTED">Not Interested ({stageCounts.NOT_INTERESTED})</option>
                </>
              ) : (
                <>
                  <option value="CALLBACK">Callback ({stageCounts.CALLBACK})</option>
                  <option value="FOLLOW_UP">Follow-up ({stageCounts.FOLLOW_UP})</option>
                  <option value="INTERESTED">Interested ({stageCounts.INTERESTED})</option>
                  <option value="DETAILS_SHARED">Details Shared ({stageCounts.DETAILS_SHARED})</option>
                  <option value="SITE_VISIT_DONE">Site Visit Done ({stageCounts.SITE_VISIT_DONE})</option>
                  <option value="OFFICE_VISIT_DONE">Office Visit Done ({stageCounts.OFFICE_VISIT_DONE})</option>
                  <option value="BOOKING_DONE">Booking Done ({stageCounts.BOOKING_DONE})</option>
                  <option value="DEAL_CLOSED">Deal Closed ({stageCounts.DEAL_CLOSED})</option>
                  <option value="NOT_INTERESTED">Not Interested ({stageCounts.NOT_INTERESTED})</option>
                </>
              )}
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

        {/* Date Filter & Daily Report Toolbar */}
        <div className="pt-3 border-t border-border/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider flex items-center gap-1.5 mr-1">
              <Calendar size={13} className="text-accent" /> Date Filter:
            </span>

            {/* Presets */}
            <div className="inline-flex items-center gap-1 bg-bg p-1 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => applyDatePreset("ALL")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  datePreset === "ALL" && !startDate && !endDate
                    ? "bg-ink text-surface shadow-xs font-semibold"
                    : "text-ink-soft hover:text-ink hover:bg-surface"
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset("TODAY")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
                  datePreset === "TODAY"
                    ? "bg-accent text-white shadow-xs font-semibold"
                    : "text-ink-soft hover:text-ink hover:bg-surface"
                }`}
              >
                <span>📅 Today</span>
                {getTodayFilterBadgeCount() > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    datePreset === "TODAY" ? "bg-white/20 text-white" : "bg-accent/15 text-accent"
                  }`}>
                    {getTodayFilterBadgeCount()}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset("YESTERDAY")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
                  datePreset === "YESTERDAY"
                    ? "bg-accent text-white shadow-xs font-semibold"
                    : "text-ink-soft hover:text-ink hover:bg-surface"
                }`}
              >
                <span>Yesterday</span>
                {getYesterdayFilterBadgeCount() > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    datePreset === "YESTERDAY" ? "bg-white/20 text-white" : "bg-ink-soft/20 text-ink-soft"
                  }`}>
                    {getYesterdayFilterBadgeCount()}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset("LAST_7_DAYS")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  datePreset === "LAST_7_DAYS"
                    ? "bg-accent text-white shadow-xs font-semibold"
                    : "text-ink-soft hover:text-ink hover:bg-surface"
                }`}
              >
                Last 7 Days
              </button>
            </div>

            {/* Custom Date Input */}
            <div className="flex items-center gap-1.5 bg-bg px-2.5 py-1 rounded-lg border border-border text-xs">
              <span className="text-[11px] text-ink-soft font-medium">Pick Date:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset("CUSTOM");
                }}
                className="h-7 px-1.5 bg-surface text-ink text-xs rounded border border-border font-medium focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {startDate && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setDatePreset("ALL");
                  }}
                  className="text-ink-soft hover:text-danger text-sm px-1 leading-none font-bold"
                  title="Clear custom date"
                >
                  ×
                </button>
              )}
            </div>

            {/* Date Match Target */}
            <div className="flex items-center gap-1.5 bg-bg px-2.5 py-1 rounded-lg border border-border text-xs">
              <span className="text-[11px] text-ink-soft font-medium">Filter by:</span>
              <select
                value={dateTarget}
                onChange={(e) => setDateTarget(e.target.value as "ANY" | "CALL" | "VISIT" | "RECEIVED")}
                className="bg-transparent text-ink text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ANY">Any Activity (Calls, Visits, Received)</option>
                <option value="CALL">Call Date (Calls Made)</option>
                <option value="VISIT">Visit Date (Site / Office Visits)</option>
                <option value="RECEIVED">Date Received (New Leads)</option>
              </select>
            </div>
          </div>

          {/* Quick Export Button when date filter is active */}
          {isDateFilterActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="h-8 text-xs font-semibold border-emerald-600/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center gap-1.5 self-start md:self-auto shrink-0 shadow-2xs"
            >
              <Download size={13} />
              <span>
                Export {datePreset === "TODAY" ? "Today's" : datePreset === "YESTERDAY" ? "Yesterday's" : "Daily"} Report ({filteredLeads.length})
              </span>
            </Button>
          )}
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

          {/* Given Today quick filter matching Admin panel */}
          <button
            type="button"
            onClick={() => {
              if (datePreset === "TODAY" && dateTarget === "RECEIVED") {
                setDatePreset("ALL");
                setDateTarget("ANY");
              } else {
                setCategoryFilter("");
                setStageFilter("");
                setDatePreset("TODAY");
                setDateTarget("RECEIVED");
              }
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              datePreset === "TODAY" && dateTarget === "RECEIVED"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                : "border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Given Today ({todayLeadsGivenCount})
          </button>

          {/* Today's Follow-ups Quick Chip */}
          <button
            type="button"
            onClick={() => {
              if (followUpFilter === "TODAY") {
                setFollowUpFilter("ALL");
              } else {
                resetFilters();
                setFollowUpFilter("TODAY");
              }
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              followUpFilter === "TODAY"
                ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                : "border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
            }`}
          >
            <Clock size={12} className={followUpFilter === "TODAY" ? "text-white" : "text-amber-500"} />
            Today&apos;s Follow-ups ({todayFollowUpsCount})
          </button>

          {/* Project Chips */}
          <span className="text-border mx-1">|</span>
          {[
            { key: "FUN_VALLEY", name: "Fun Valley", color: "border-cyan-500/30 text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20" },
            { key: "SAHASTRADHARA", name: "Sahastradhara", color: "border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20" },
            { key: "RANI_POKHARI", name: "Rani Pokhari", color: "border-indigo-500/30 text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20" },
            { key: "THANO", name: "Thano", color: "border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20" },
          ].map((proj) => {
            const isSelected = sourceFilter === proj.key;
            return (
              <button
                key={proj.key}
                type="button"
                onClick={() => setSourceFilter(isSelected ? "ALL" : proj.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  isSelected
                    ? "bg-ink text-surface border-ink shadow-xs"
                    : `${proj.color}`
                }`}
              >
                {proj.name}
              </button>
            );
          })}

          {/* Category Chips */}
          <span className="text-border mx-1">|</span>
          <button
            type="button"
            onClick={() => {
              setCategoryFilter(categoryFilter === "CALL_PICKED" ? "" : "CALL_PICKED");
              setStageFilter("");
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
              categoryFilter === "CALL_PICKED"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
            }`}
          >
            Call Picked 📞 ({categoryCounts.CALL_PICKED})
          </button>
          <button
            type="button"
            onClick={() => {
              setCategoryFilter(categoryFilter === "CALL_NOT_PICKED" ? "" : "CALL_NOT_PICKED");
              setStageFilter("");
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
              categoryFilter === "CALL_NOT_PICKED"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
            }`}
          >
            Call Not Picked 📵 ({categoryCounts.CALL_NOT_PICKED})
          </button>

          {/* Funnel Stage Chips */}
          <span className="text-border mx-1">|</span>
          <button
            type="button"
            onClick={() => {
              if (stageFilter === "CALLBACK") {
                setStageFilter("");
              } else {
                setStageFilter("CALLBACK");
                setCategoryFilter("");
                setDatePreset("ALL");
                setStartDate("");
                setEndDate("");
              }
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              stageFilter === "CALLBACK"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
            }`}
          >
            Callback ({stageCounts.CALLBACK})
          </button>
          <button
            type="button"
            onClick={() => {
              if (stageFilter === "FOLLOW_UP") {
                setStageFilter("");
              } else {
                setStageFilter("FOLLOW_UP");
                setCategoryFilter("");
                setDatePreset("ALL");
                setStartDate("");
                setEndDate("");
              }
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              stageFilter === "FOLLOW_UP"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20"
            }`}
          >
            Follow-up ({stageCounts.FOLLOW_UP})
          </button>
          <button
            type="button"
            onClick={() => {
              if (stageFilter === "INTERESTED") {
                setStageFilter("");
              } else {
                setStageFilter("INTERESTED");
                setCategoryFilter("");
                setDatePreset("ALL");
                setStartDate("");
                setEndDate("");
              }
            }}
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
            onClick={() => {
              if (stageFilter === "DETAILS_SHARED") {
                setStageFilter("");
              } else {
                setStageFilter("DETAILS_SHARED");
                setCategoryFilter("");
                setDatePreset("ALL");
                setStartDate("");
                setEndDate("");
              }
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              stageFilter === "DETAILS_SHARED"
                ? "bg-teal-600 text-white shadow-xs"
                : "bg-teal-500/10 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20"
            }`}
          >
            Details Shared ({stageCounts.DETAILS_SHARED})
          </button>
          <button
            type="button"
            onClick={() => {
              if (stageFilter === "SITE_VISIT_DONE") {
                setStageFilter("");
              } else {
                setStageFilter("SITE_VISIT_DONE");
                setCategoryFilter("");
                setDatePreset("ALL");
                setStartDate("");
                setEndDate("");
              }
            }}
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
            onClick={() => {
              if (stageFilter === "OFFICE_VISIT_DONE") {
                setStageFilter("");
              } else {
                setStageFilter("OFFICE_VISIT_DONE");
                setCategoryFilter("");
                setDatePreset("ALL");
                setStartDate("");
                setEndDate("");
              }
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              stageFilter === "OFFICE_VISIT_DONE"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
            }`}
          >
            Office Visit Done ({stageCounts.OFFICE_VISIT_DONE})
          </button>
          <button
            type="button"
            onClick={() => {
              if (stageFilter === "BOOKING_DONE") {
                setStageFilter("");
              } else {
                setStageFilter("BOOKING_DONE");
                setCategoryFilter("");
                setDatePreset("ALL");
                setStartDate("");
                setEndDate("");
              }
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              stageFilter === "BOOKING_DONE"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20"
            }`}
          >
            Booking Done ({stageCounts.BOOKING_DONE})
          </button>
          <button
            type="button"
            onClick={() => {
              if (stageFilter === "DEAL_CLOSED") {
                setStageFilter("");
              } else {
                setStageFilter("DEAL_CLOSED");
                setCategoryFilter("");
                setDatePreset("ALL");
                setStartDate("");
                setEndDate("");
              }
            }}
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
            onClick={() => {
              if (stageFilter === "NOT_INTERESTED") {
                setStageFilter("");
              } else {
                setStageFilter("NOT_INTERESTED");
                setCategoryFilter("");
                setDatePreset("ALL");
                setStartDate("");
                setEndDate("");
              }
            }}
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
          <div className="flex items-center justify-between text-xs text-ink-soft pt-1 border-t border-border/40">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span>
                Showing <strong className="text-ink">{filteredLeads.length}</strong> of <strong className="text-ink">{leads.length}</strong> leads
              </span>
              {isDateFilterActive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/10 text-accent font-semibold text-[11px] border border-accent/20">
                  <Calendar size={11} />
                  <span>
                    {datePreset === "TODAY"
                      ? "Today"
                      : datePreset === "YESTERDAY"
                      ? "Yesterday"
                      : datePreset === "LAST_7_DAYS"
                      ? "Last 7 Days"
                      : startDate}
                    {` (${dateTarget === "CALL" ? "Calls Made" : dateTarget === "RECEIVED" ? "New Leads" : "Any Date"})`}
                  </span>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-accent hover:underline font-medium"
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
                  Source & Notes
                </th>
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                  Category
                </th>
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                  Funnel Stage
                </th>
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                  Call Date
                </th>
                <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-ink-soft">
                    Loading your leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-ink-soft flex items-center justify-center gap-2">
                    <Search size={16} /> No leads assigned to you right now.
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-ink-soft">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search size={20} className="text-ink-soft/60" />
                      <p className="font-medium text-ink">No leads match your selected filters</p>
                      <p className="text-xs text-ink-soft">
                        {isDateFilterActive && stageFilter
                          ? `No ${formatStageLabel(stageFilter)} leads found for the selected date.`
                          : "Try selecting a different filter or clearing search."}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {isDateFilterActive && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => applyDatePreset("ALL")}
                            className="text-xs bg-accent/15 text-accent hover:bg-accent/25"
                          >
                            View All Time Leads
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs">
                          <RotateCcw size={13} className="mr-1.5" /> Clear All Filters
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className={`transition-colors ${lead.status === 'LOST' ? 'bg-bg/50 opacity-70' : 'hover:bg-surface/50'}`}>
                    <td className="p-4 align-top w-1/4">
                      <div className="font-medium text-ink flex items-center gap-2">
                        {lead.name}
                        {lead.status === "LOST" && <Badge variant="danger" className="text-[10px]">LOST</Badge>}
                      </div>
                      <div className="font-mono text-sm text-ink-soft mt-1 flex items-center gap-2">
                        <span>{lead.phone}</span>
                        <LeadContactButtons
                          phone={lead.phone}
                          size="xs"
                          onLogCall={() => openCallModal(lead)}
                        />
                      </div>
                      <div className="text-sm text-ink-soft">{lead.email}</div>

                      {/* Lead Details: Occupation, Location, Budget */}
                      {(lead.formAnswers?.occupation || lead.formAnswers?.location || lead.formAnswers?.budget) && (
                        <div className="flex flex-wrap gap-1 mt-1.5 text-[11px]">
                          {lead.formAnswers?.occupation && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-bg text-ink font-medium border border-border" title="Occupation">
                              💼 {lead.formAnswers.occupation}
                            </span>
                          )}
                          {lead.formAnswers?.location && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-bg text-ink font-medium border border-border" title="Location">
                              📍 {lead.formAnswers.location}
                            </span>
                          )}
                          {lead.formAnswers?.budget && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/20" title="Budget">
                              💰 {lead.formAnswers.budget}
                            </span>
                          )}
                        </div>
                      )}

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

                      {/* Call Notes Box with Add & Edit */}
                      <LeadNotesBox
                        lead={lead}
                        onLeadUpdated={(updatedLead) => {
                          setLeads((prev) =>
                            prev.map((l) =>
                              l.id === updatedLead.id
                                ? {
                                    ...l,
                                    ...updatedLead,
                                    assignmentHistory: updatedLead.assignmentHistory || l.assignmentHistory,
                                    statusHistory: updatedLead.statusHistory || l.statusHistory,
                                    callLogs: updatedLead.callLogs || l.callLogs,
                                  }
                                : l
                            )
                          );
                        }}
                      />
                    </td>
                    <td className="p-4 align-top w-1/5">
                      <div>
                        <SourceBadge source={lead.source || lead.sourceForm} />
                      </div>
                      {(() => {
                        const remarks = getLeadLatestRemarks(lead);
                        const hasAny = remarks.followUpNote || remarks.latestCallNote || remarks.originalNote;
                        if (!hasAny) {
                          return (
                            <div className="text-[11px] text-ink-soft/40 italic mt-1.5">
                              No notes yet
                            </div>
                          );
                        }
                        return (
                          <div className="space-y-1 mt-1.5 max-w-xs">
                            {remarks.followUpNote && (
                              <div
                                className="text-[11px] text-amber-950 dark:text-amber-200 bg-amber-500/10 border border-amber-500/25 px-2 py-1 rounded-md flex items-start gap-1"
                                title={`Follow-up Note: ${remarks.followUpNote}`}
                              >
                                <span className="font-semibold shrink-0 text-amber-700 dark:text-amber-400">Follow-up:</span>
                                <span className="line-clamp-2 italic break-words">&ldquo;{remarks.followUpNote}&rdquo;</span>
                              </div>
                            )}
                            {remarks.latestCallNote && remarks.latestCallNote !== remarks.followUpNote && (
                              <div
                                className="text-[11px] text-ink/85 bg-bg/70 border border-border/60 px-2 py-1 rounded-md flex items-start gap-1"
                                title={`Latest Interaction Note: ${remarks.latestCallNote}`}
                              >
                                <span className="font-semibold shrink-0 text-accent">Note:</span>
                                <span className="line-clamp-2 italic break-words">&ldquo;{remarks.latestCallNote}&rdquo;</span>
                              </div>
                            )}
                            {remarks.originalNote && remarks.originalNote !== remarks.followUpNote && remarks.originalNote !== remarks.latestCallNote && (
                              <div
                                className="text-[10px] text-ink-soft/75 italic line-clamp-1 pl-1"
                                title={`Original Source Note: ${remarks.originalNote}`}
                              >
                                Src: &ldquo;{remarks.originalNote}&rdquo;
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="p-4 align-top w-1/6">
                      <Select
                        className="w-full text-xs"
                        value={getLeadEffectiveCategory(lead)}
                        onChange={(e) => updateCategory(lead.id, e.target.value)}
                        disabled={lead.status === "LOST"}
                      >
                        <option value="CALL_PICKED">Call Picked 📞</option>
                        <option value="CALL_NOT_PICKED">Call Not Picked 📵</option>
                      </Select>
                    </td>
                    <td className="p-4 align-top w-44">
                      <Select
                        className="w-full text-xs"
                        value={lead.funnelStage || "INTERESTED"}
                        onChange={(e) => updateStage(lead.id, e.target.value)}
                        disabled={lead.status === "LOST"}
                      >
                        {getStagesForCategory(getLeadEffectiveCategory(lead), lead.funnelStage).map((st) => (
                          <option key={st.value} value={st.value}>
                            {st.label}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="p-4 align-top w-36 whitespace-nowrap">
                      {(() => {
                        const callInfo = getLeadLastCallDate(lead);
                        if (!callInfo) {
                          return (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs text-ink-soft/60 italic font-normal">
                                Not called yet
                              </span>
                              <span className="text-[10px] text-ink-soft/40">
                                Rec&apos;d {new Date(lead.dateReceived).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                              </span>
                            </div>
                          );
                        }
                        return (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 font-medium text-xs text-ink">
                              <Calendar size={12} className="text-accent shrink-0" />
                              <span className={callInfo.isToday ? "text-emerald-700 dark:text-emerald-400 font-semibold" : ""}>
                                {callInfo.dateStr}
                              </span>
                            </div>
                            {callInfo.timeStr && (
                              <div className="text-[11px] text-ink-soft font-mono pl-4">
                                {callInfo.timeStr}
                              </div>
                            )}
                            {callInfo.totalCalls > 1 && (
                              <span className="text-[10px] text-ink-soft/70 pl-4">
                                {callInfo.totalCalls} calls logged
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="p-4 align-top text-right">
                      <div className="flex justify-end gap-1.5 items-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openCallModal(lead)}
                          disabled={lead.status === "LOST"}
                          className="h-8 text-xs font-medium"
                          title="Log Call interaction"
                        >
                          <Phone size={13} className="mr-1 text-accent" />
                          Log Call
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-danger hover:bg-danger/10 hover:text-danger"
                          onClick={() => markLost(lead.id)}
                          disabled={lead.status === "LOST"}
                          title="Mark Lost"
                        >
                          <XCircle size={13} className="mr-1" />
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
            <p className="text-xs">
              {isDateFilterActive && stageFilter
                ? `No ${formatStageLabel(stageFilter)} leads found for selected date.`
                : "Try selecting a different filter or clearing search."}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {isDateFilterActive && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => applyDatePreset("ALL")}
                  className="text-xs bg-accent/15 text-accent hover:bg-accent/25"
                >
                  View All Time Leads
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs">
                <RotateCcw size={13} className="mr-1.5" /> Clear Filters
              </Button>
            </div>
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
                    {lead.phone && <div className="font-mono text-xs text-ink-soft mt-0.5">{lead.phone}</div>}
                    <div className="font-mono text-xs text-ink-soft mt-0.5">{lead.email}</div>
                  </div>

                  {/* Direct Phone & WhatsApp Tap Targets */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <LeadContactButtons
                      phone={lead.phone}
                      size="lg"
                      onLogCall={() => openCallModal(lead)}
                    />
                  </div>
                </div>

                {/* Source & Notes */}
                <div className="flex flex-col gap-1 pt-1 border-t border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-semibold text-ink-soft tracking-wider">Source:</span>
                    <SourceBadge source={lead.source || lead.sourceForm} />
                  </div>
                  {(() => {
                    const remarks = getLeadLatestRemarks(lead);
                    const hasAny = remarks.followUpNote || remarks.latestCallNote || remarks.originalNote;
                    if (!hasAny) {
                      return (
                        <div className="text-[11px] text-ink-soft/40 italic">
                          No notes yet
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-1 mt-0.5">
                        {remarks.followUpNote && (
                          <div
                            className="text-[11px] text-amber-950 dark:text-amber-200 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1.5 rounded-lg flex items-start gap-1"
                            title={`Follow-up Note: ${remarks.followUpNote}`}
                          >
                            <span className="font-semibold shrink-0 text-amber-700 dark:text-amber-400">Follow-up:</span>
                            <span className="italic break-words">&ldquo;{remarks.followUpNote}&rdquo;</span>
                          </div>
                        )}
                        {remarks.latestCallNote && remarks.latestCallNote !== remarks.followUpNote && (
                          <div
                            className="text-[11px] text-ink/85 bg-bg/70 border border-border/60 px-2.5 py-1.5 rounded-lg flex items-start gap-1"
                            title={`Latest Interaction Note: ${remarks.latestCallNote}`}
                          >
                            <span className="font-semibold shrink-0 text-accent">Note:</span>
                            <span className="italic break-words">&ldquo;{remarks.latestCallNote}&rdquo;</span>
                          </div>
                        )}
                        {remarks.originalNote && remarks.originalNote !== remarks.followUpNote && remarks.originalNote !== remarks.latestCallNote && (
                          <div
                            className="text-[10px] text-ink-soft/75 italic line-clamp-2 px-1"
                            title={`Original Source Note: ${remarks.originalNote}`}
                          >
                            Src: &ldquo;{remarks.originalNote}&rdquo;
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Lead Details: Occupation, Location, Budget */}
                  {(lead.formAnswers?.occupation || lead.formAnswers?.location || lead.formAnswers?.budget) && (
                    <div className="flex flex-wrap gap-1 mt-1 text-[11px]">
                      {lead.formAnswers?.occupation && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-bg text-ink font-medium border border-border" title="Occupation">
                          💼 {lead.formAnswers.occupation}
                        </span>
                      )}
                      {lead.formAnswers?.location && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-bg text-ink font-medium border border-border" title="Location">
                          📍 {lead.formAnswers.location}
                        </span>
                      )}
                      {lead.formAnswers?.budget && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/20" title="Budget">
                          💰 {lead.formAnswers.budget}
                        </span>
                      )}
                    </div>
                  )}
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

                {/* Call Notes Box for Mobile with Add & Edit */}
                <LeadNotesBox
                  lead={lead}
                  onLeadUpdated={(updatedLead) => {
                    setLeads((prev) =>
                      prev.map((l) =>
                        l.id === updatedLead.id
                          ? {
                              ...l,
                              ...updatedLead,
                              assignmentHistory: updatedLead.assignmentHistory || l.assignmentHistory,
                              statusHistory: updatedLead.statusHistory || l.statusHistory,
                              callLogs: updatedLead.callLogs || l.callLogs,
                            }
                          : l
                      )
                    );
                  }}
                />

                {/* Dropdowns for Mobile */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-semibold text-ink-soft uppercase tracking-wider mb-1">Category</label>
                    <Select
                      className="w-full text-xs h-9 bg-bg"
                      value={getLeadEffectiveCategory(lead)}
                      onChange={(e) => updateCategory(lead.id, e.target.value)}
                      disabled={lead.status === "LOST"}
                    >
                      <option value="CALL_PICKED">Call Picked 📞</option>
                      <option value="CALL_NOT_PICKED">Call Not Picked 📵</option>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-ink-soft uppercase tracking-wider mb-1">Stage</label>
                    <Select
                      className="w-full text-xs h-9 bg-bg"
                      value={lead.funnelStage || "INTERESTED"}
                      onChange={(e) => updateStage(lead.id, e.target.value)}
                      disabled={lead.status === "LOST"}
                    >
                      {getStagesForCategory(getLeadEffectiveCategory(lead), lead.funnelStage).map((st) => (
                        <option key={st.value} value={st.value}>
                          {st.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Call Date on Mobile Card */}
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-border/40">
                  <span className="text-ink-soft font-medium flex items-center gap-1">
                    <Calendar size={12} className="text-accent" /> Call Date:
                  </span>
                  {(() => {
                    const callInfo = getLeadLastCallDate(lead);
                    if (!callInfo) {
                      return <span className="text-ink-soft/60 italic text-[11px]">Not called yet</span>;
                    }
                    return (
                      <span className="font-medium text-ink text-[11px] flex items-center gap-1.5">
                        <span className={callInfo.isToday ? "text-emerald-700 dark:text-emerald-400 font-semibold" : ""}>
                          {callInfo.dateStr}
                        </span>
                        {callInfo.timeStr && (
                          <span className="text-ink-soft font-mono">({callInfo.timeStr})</span>
                        )}
                      </span>
                    );
                  })()}
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
                    <Phone size={14} className="mr-1 text-accent" />
                    Log Call
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-2.5 text-xs text-danger hover:bg-danger/10 hover:text-danger"
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
            <p className="text-xs sm:text-sm text-ink-soft mb-3">Record interaction with <strong className="text-ink">{activeCallLead.name}</strong></p>
            
            {/* Lead Source & Notes Info Box */}
            <div className="mb-4 p-2.5 rounded-lg bg-bg border border-border flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-soft font-medium">Source:</span>
                <SourceBadge source={activeCallLead.source || activeCallLead.sourceForm} />
              </div>
              {activeCallLead.formAnswers?.notes && (
                <div className="mt-1 text-ink/80 text-[11px] italic border-t border-border/50 pt-1">
                  <span className="font-semibold not-italic text-ink-soft">Notes: </span>
                  &ldquo;{activeCallLead.formAnswers.notes}&rdquo;
                </div>
              )}
            </div>

            <form onSubmit={handleLogCall} className="space-y-3 sm:space-y-4">
              {/* 3 Bars: Occupation, Location, Budget */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1 uppercase tracking-wider">Occupation</label>
                  <Input 
                    type="text" 
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="e.g. Business Owner, Software Engineer, Doctor..."
                    className="h-10 text-xs sm:text-sm bg-bg"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink-soft mb-1 uppercase tracking-wider">Location</label>
                    <Input 
                      type="text" 
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Dehradun, Delhi, Rajpur Road..."
                      className="h-10 text-xs sm:text-sm bg-bg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-soft mb-1 uppercase tracking-wider">Budget</label>
                    <Input 
                      type="text" 
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="e.g. 50 Lakhs, 1 Cr, 75L..."
                      className="h-10 text-xs sm:text-sm bg-bg"
                    />
                  </div>
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
      {/* Office Visit Modal */}
      {activeOfficeVisitLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-surface border border-border rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-xl my-8">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-ink">Record Office Visit</h3>
                  <p className="text-xs text-ink-soft">
                    Client visit for <strong className="text-ink">{activeOfficeVisitLead.name}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveOfficeVisitLead(null)}
                className="p-1 rounded-lg text-ink-soft hover:text-ink hover:bg-bg transition-colors"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Lead Brief Box */}
            <div className="my-3 p-2.5 rounded-lg bg-bg border border-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-ink-soft">{activeOfficeVisitLead.phone}</span>
                <LeadContactButtons phone={activeOfficeVisitLead.phone} size="xs" />
              </div>
              <SourceBadge source={activeOfficeVisitLead.source || activeOfficeVisitLead.sourceForm} />
            </div>

            <form onSubmit={handleSaveOfficeVisit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1 uppercase tracking-wider">
                  Office Visit Notes & Discussions
                </label>
                <textarea
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  rows={3}
                  value={officeVisitNotes}
                  onChange={(e) => setOfficeVisitNotes(e.target.value)}
                  placeholder="e.g. Client came to the office, reviewed site layouts for Sahastradhara project, offered brochure..."
                />
              </div>

              {/* Follow-up Section */}
              <div className="border-t border-border pt-3 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink">
                  <Calendar size={14} className="text-amber-600 dark:text-amber-400" />
                  <span>Next Follow-Up Reminder (Optional)</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1">
                    Follow-Up Date & Time
                  </label>
                  <Input
                    type="datetime-local"
                    min={new Date().toISOString().slice(0, 16)}
                    value={officeVisitFollowUpAt}
                    onChange={(e) => setOfficeVisitFollowUpAt(e.target.value)}
                    className="h-10 text-xs sm:text-sm bg-bg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1">
                    Follow-Up Notes
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    rows={2}
                    value={officeVisitFollowUpNotes}
                    onChange={(e) => setOfficeVisitFollowUpNotes(e.target.value)}
                    placeholder="e.g. Follow up on payment token, send floor plan PDF on WhatsApp..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveOfficeVisitLead(null)}
                  className="h-10 px-4"
                  disabled={isSavingVisit}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSavingVisit}
                  className="h-10 px-4 font-semibold bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isSavingVisit ? "Saving Visit..." : "Save Office Visit & Update Stage"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Site Visit Modal */}
      {activeSiteVisitLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-surface border border-border rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-xl my-8">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-ink">Record Site Visit</h3>
                  <p className="text-xs text-ink-soft">
                    Physical site inspection for <strong className="text-ink">{activeSiteVisitLead.name}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSiteVisitLead(null)}
                className="p-1 rounded-lg text-ink-soft hover:text-ink hover:bg-bg transition-colors"
              >
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSiteVisit} className="mt-4 space-y-3.5">
              {/* Lead Details Banner */}
              <div className="bg-bg/80 border border-border/80 rounded-xl p-3 text-xs flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-ink-soft">Phone: </span>
                  <span className="font-semibold text-ink">{activeSiteVisitLead.phone}</span>
                </div>
                {activeSiteVisitLead.source && (
                  <SourceBadge source={activeSiteVisitLead.source} />
                )}
              </div>

              {/* Project / Site Visited */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Site / Project Visited
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
                  {["Fun Valley", "Sahastradhara", "Rani Pokhari", "Thano"].map((proj) => (
                    <button
                      key={proj}
                      type="button"
                      onClick={() => setSiteVisitProject(proj)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium border text-center transition-all ${
                        siteVisitProject === proj
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs font-semibold"
                          : "bg-bg border-border text-ink-soft hover:text-ink hover:bg-surface"
                      }`}
                    >
                      {proj}
                    </button>
                  ))}
                </div>
                <Input
                  placeholder="Or enter custom site location / plot number..."
                  value={siteVisitProject}
                  onChange={(e) => setSiteVisitProject(e.target.value)}
                  className="h-9 text-xs sm:text-sm bg-bg"
                />
              </div>

              {/* Visit Notes */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Site Visit Discussion & Feedback <span className="text-danger">*</span>
                </label>
                <textarea
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  rows={3}
                  required
                  value={siteVisitNotes}
                  onChange={(e) => setSiteVisitNotes(e.target.value)}
                  placeholder="e.g. Client inspected plot #14 at Fun Valley, liked the view and 30ft road. Offered discount for token advance this week..."
                />
              </div>

              {/* Follow-up Section */}
              <div className="border-t border-border pt-3 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink">
                  <Calendar size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Next Follow-Up Reminder (Optional)</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1">
                    Follow-Up Date & Time
                  </label>
                  <Input
                    type="datetime-local"
                    min={new Date().toISOString().slice(0, 16)}
                    value={siteVisitFollowUpAt}
                    onChange={(e) => setSiteVisitFollowUpAt(e.target.value)}
                    className="h-10 text-xs sm:text-sm bg-bg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1">
                    Follow-Up Notes
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    rows={2}
                    value={siteVisitFollowUpNotes}
                    onChange={(e) => setSiteVisitFollowUpNotes(e.target.value)}
                    placeholder="e.g. Call for token payment decision, share registry documents..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveSiteVisitLead(null)}
                  className="h-10 px-4"
                  disabled={isSavingSiteVisit}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSavingSiteVisit}
                  className="h-10 px-4 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSavingSiteVisit ? "Saving Visit..." : "Save Site Visit & Update Stage"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
