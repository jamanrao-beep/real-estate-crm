"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search, XCircle, Plus } from "lucide-react";

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
  
  // Submit Lead Modal State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [newLeadEmail, setNewLeadEmail] = useState("");

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/broker/leads");
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



  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName || !newLeadPhone) return;

    try {
      const res = await api.post("/broker/leads", {
        name: newLeadName,
        phone: newLeadPhone,
        email: newLeadEmail,
        source: "Channel Partner Portal"
      });
      setLeads([res.data, ...leads]);
      alert("Lead submitted successfully!");
      setIsSubmitModalOpen(false);
      setNewLeadName("");
      setNewLeadPhone("");
      setNewLeadEmail("");
    } catch (err: any) {
      console.error("Failed to submit lead", err);
      alert(err.response?.data?.error || "Failed to submit lead");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-ink">My Submitted Leads</h1>
          <p className="text-sm text-ink-soft mt-1">
            Manage your submitted leads, update progress, and log interactions.
          </p>
        </div>
        <Button onClick={() => setIsSubmitModalOpen(true)}>
          <Plus size={16} className="mr-2" />
          Submit New Lead
        </Button>
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



      {/* Submit Lead Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-serif text-ink mb-1">Submit New Lead</h3>
            <p className="text-sm text-ink-soft mb-6">Enter the details of the lead you referred.</p>
            
            <form onSubmit={handleSubmitLead} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-soft mb-1 uppercase tracking-wider">Name</label>
                <Input 
                  type="text" 
                  required 
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-soft mb-1 uppercase tracking-wider">Phone</label>
                <Input 
                  type="tel" 
                  required 
                  value={newLeadPhone}
                  onChange={(e) => setNewLeadPhone(e.target.value)}
                  placeholder="+91 9876543210"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-soft mb-1 uppercase tracking-wider">Email (Optional)</label>
                <Input 
                  type="email" 
                  value={newLeadEmail}
                  onChange={(e) => setNewLeadEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="ghost" onClick={() => setIsSubmitModalOpen(false)}>Cancel</Button>
                <Button type="submit">Submit Lead</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
