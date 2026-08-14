"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Phone, Search, XCircle, Clock } from "lucide-react";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  category: string | null;
  funnelStage: string | null;
  status: string;
  dateReceived: string;
}

export default function MyLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Call Log Modal State
  const [activeCallLead, setActiveCallLead] = useState<Lead | null>(null);
  const [callNotes, setCallNotes] = useState("");
  const [callStart, setCallStart] = useState("");
  const [callEnd, setCallEnd] = useState("");

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
      await api.patch(`/leads/${id}/lost`);
      setLeads(leads.map(l => l.id === id ? { ...l, status: "LOST" } : l));
    } catch (err) {
      console.error("Failed to mark lost", err);
      alert("Failed to mark lead as lost");
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
        notes: callNotes
      });
      alert("Call logged successfully!");
      setActiveCallLead(null);
      setCallStart("");
      setCallEnd("");
      setCallNotes("");
    } catch (err: any) {
      console.error("Failed to log call", err);
      alert(err.response?.data?.error || "Failed to log call");
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
    setActiveCallLead(lead);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-ink">My Leads Workspace</h1>
          <p className="text-sm text-ink-soft mt-1">
            Manage your assigned leads, update progress, and log interactions.
          </p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
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

      {/* Call Logging Modal */}
      {activeCallLead && (
        <div className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-serif text-ink mb-1">Log Call</h3>
            <p className="text-sm text-ink-soft mb-6">Record interaction with {activeCallLead.name}</p>
            
            <form onSubmit={handleLogCall} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1 uppercase tracking-wider">Start Time</label>
                  <Input 
                    type="datetime-local" 
                    required 
                    value={callStart}
                    onChange={(e) => setCallStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1 uppercase tracking-wider">End Time</label>
                  <Input 
                    type="datetime-local" 
                    required 
                    value={callEnd}
                    onChange={(e) => setCallEnd(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-soft mb-1 uppercase tracking-wider">Notes (Optional)</label>
                <textarea
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  rows={3}
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="Discussed pricing, client wants to visit..."
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="ghost" onClick={() => setActiveCallLead(null)}>Cancel</Button>
                <Button type="submit">Save Call Record</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
