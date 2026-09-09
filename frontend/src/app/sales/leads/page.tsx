"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Phone, Search, XCircle, Clock, Calendar } from "lucide-react";

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif text-ink font-bold">My Leads Workspace</h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-0.5">
            Manage your assigned leads, update progress, and log interactions.
          </p>
        </div>
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
              ) : (
                leads.map((lead) => (
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
                        <option value="SITE_VISIT_DONE">Site Visit Done</option>
                        <option value="DEAL_CLOSED">Deal Closed</option>
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
        ) : (
          leads.map((lead) => {
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
                      <option value="SITE_VISIT_DONE">Site Visit Done</option>
                      <option value="DEAL_CLOSED">Deal Closed</option>
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
