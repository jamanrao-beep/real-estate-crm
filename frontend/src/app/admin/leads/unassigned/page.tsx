"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { RefreshCw, Users, Check, Inbox } from "lucide-react";

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
  const [successMessage, setSuccessMessage] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [leadsRes, teamRes] = await Promise.all([
        api.get("/leads/unassigned"),
        api.get("/auth/users"), // Our newly added endpoint
      ]);
      setLeads(leadsRes.data);
      setSalesTeam(teamRes.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleManualAssign = async (leadId: string, salesPersonId: string) => {
    if (!salesPersonId) return;
    try {
      await api.patch(`/leads/${leadId}/assign`, { salesPersonId });
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      showSuccess("Lead assigned successfully");
    } catch (err) {
      console.error("Failed to assign lead", err);
    }
  };

  const handleAutoDistribute = async () => {
    setIsDistributing(true);
    try {
      const res = await api.post("/leads/auto-assign");
      showSuccess(res.data.message);
      fetchData(); // Refresh list to empty
    } catch (err) {
      console.error("Failed to auto-distribute", err);
    } finally {
      setIsDistributing(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-ink">Lead Inbox</h1>
          <p className="text-sm text-ink-soft mt-1">
            Incoming unassigned leads from Facebook.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {successMessage && (
            <span className="text-success text-sm flex items-center gap-1 font-medium bg-success/10 px-3 py-1.5 rounded-full">
              <Check size={14} /> {successMessage}
            </span>
          )}
          <Button
            variant="outline"
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button
            onClick={handleAutoDistribute}
            disabled={isDistributing || leads.length === 0}
            className="flex items-center gap-2"
          >
            <Users size={16} />
            Auto-Distribute All
          </Button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
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
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="ledger-row">
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
                      <Badge variant="outline">{lead.sourceForm}</Badge>
                    </td>
                    <td className="p-4 align-top text-right">
                      <div className="flex justify-end">
                        <Select
                          className="w-48 bg-bg"
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
    </div>
  );
}
