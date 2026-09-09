"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { 
  Users, 
  Check, 
  X, 
  Loader2, 
  AlertCircle, 
  UserCheck, 
  UserX,
  Sparkles,
  CheckSquare,
  Square
} from "lucide-react";

export interface SalesMember {
  id: string;
  name: string;
  email: string;
  role?: string;
  isActive: boolean;
}

interface TeamDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  unassignedCount: number;
  salesTeam: SalesMember[];
  onSuccess: (message: string) => void;
  onTeamUpdated?: () => void;
}

export default function TeamDistributionModal({
  isOpen,
  onClose,
  unassignedCount,
  salesTeam,
  onSuccess,
  onTeamUpdated,
}: TeamDistributionModalProps) {
  // Selected IDs for distribution
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [team, setTeam] = useState<SalesMember[]>([]);
  const [isDistributing, setIsDistributing] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize team and select only active members when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setTeam(salesTeam);
      const activeIds = salesTeam.filter((m) => m.isActive).map((m) => m.id);
      setSelectedIds(activeIds);
    }
  }, [isOpen, salesTeam]);

  if (!isOpen) return null;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(team.map((m) => m.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  // Toggle user's permanent/saved availability in the CRM database
  const handleToggleAvailability = async (member: SalesMember) => {
    const newStatus = !member.isActive;
    setTogglingId(member.id);
    try {
      await api.patch(`/auth/users/${member.id}/availability`, { isActive: newStatus });
      setTeam((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, isActive: newStatus } : m))
      );
      // If toggled to active, ensure selected; if toggled to inactive, remove from selected
      if (newStatus) {
        setSelectedIds((prev) => (prev.includes(member.id) ? prev : [...prev, member.id]));
      } else {
        setSelectedIds((prev) => prev.filter((id) => id !== member.id));
      }
      if (onTeamUpdated) onTeamUpdated();
    } catch (err: any) {
      console.error("Failed to toggle availability:", err);
      setError("Failed to update availability status. Please try again.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDistribute = async () => {
    if (selectedIds.length === 0) {
      setError("Please select at least 1 sales executive to distribute leads to.");
      return;
    }
    if (unassignedCount === 0) {
      setError("There are no unassigned leads to distribute right now.");
      return;
    }

    setIsDistributing(true);
    setError(null);

    try {
      const res = await api.post("/leads/auto-assign", {
        salesPersonIds: selectedIds,
      });

      onSuccess(res.data.message || `Successfully distributed leads across ${selectedIds.length} executives!`);
      onClose();
    } catch (err: any) {
      console.error("Auto-distribution failed:", err);
      setError(err.response?.data?.error || "Auto-distribution failed. Please try again.");
    } finally {
      setIsDistributing(false);
    }
  };

  const selectedCount = selectedIds.length;
  const estimatedPerRep =
    selectedCount > 0 && unassignedCount > 0
      ? Math.floor(unassignedCount / selectedCount)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-bg/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent/15 text-accent border border-accent/20">
              <Users size={22} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-serif text-ink font-bold">
                Selective Lead Distribution
              </h2>
              <p className="text-xs text-ink-soft mt-0.5">
                Choose which sales executives receive leads today
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ink-soft hover:text-ink p-1.5 rounded-lg hover:bg-border/50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          
          {error && (
            <div className="p-3 bg-danger/10 border border-danger/25 rounded-xl text-danger text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Distribution Summary Stats */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-bg/60 border border-border rounded-xl">
            <div>
              <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block">
                Unassigned Leads
              </span>
              <span className="text-lg font-bold text-ink font-mono mt-0.5 block">
                {unassignedCount} Leads
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block">
                Est. Allocation Each
              </span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
                {selectedCount > 0 ? `~${estimatedPerRep} leads` : "—"}
              </span>
            </div>
          </div>

          {/* Quick Selection Toolbar */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="text-xs font-semibold text-ink">
              Sales Team Availability ({selectedCount} of {team.length} selected):
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-accent hover:underline font-medium px-1 py-0.5"
              >
                Select All
              </button>
              <span className="text-ink-soft">•</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-ink-soft hover:text-ink hover:underline px-1 py-0.5"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Team Members List */}
          <div className="space-y-2">
            {team.length === 0 ? (
              <div className="p-6 text-center text-xs text-ink-soft border border-border rounded-xl">
                No sales executives registered in the system.
              </div>
            ) : (
              team.map((member) => {
                const isSelected = selectedIds.includes(member.id);
                const isToggling = togglingId === member.id;

                const initials = member.name
                  ? member.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "SP";

                return (
                  <div
                    key={member.id}
                    onClick={() => handleToggleSelect(member.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-accent/5 border-accent/40 shadow-xs"
                        : "bg-surface border-border hover:border-border/80 opacity-75"
                    }`}
                  >
                    {/* Checkbox and Member Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 text-accent">
                        {isSelected ? (
                          <CheckSquare size={18} className="text-accent" />
                        ) : (
                          <Square size={18} className="text-ink-soft" />
                        )}
                      </div>

                      <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center font-bold text-xs shrink-0">
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-ink truncate block">
                            {member.name}
                          </span>
                          {member.isActive ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              On Duty
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.2 rounded-full bg-bg text-ink-soft border border-border shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-ink-soft/50"></span>
                              On Leave
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-ink-soft font-mono truncate block">
                          {member.email}
                        </span>
                      </div>
                    </div>

                    {/* Toggle Availability Switch Button */}
                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        disabled={isToggling}
                        onClick={() => handleToggleAvailability(member)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors flex items-center gap-1.5 ${
                          member.isActive
                            ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 bg-emerald-500/5"
                            : "border-border text-ink-soft hover:text-ink hover:bg-bg bg-bg/50"
                        }`}
                        title={member.isActive ? "Click to mark On Leave" : "Click to mark On Duty"}
                      >
                        {isToggling ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : member.isActive ? (
                          <UserCheck size={12} className="text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <UserX size={12} className="text-ink-soft" />
                        )}
                        <span>{member.isActive ? "Active" : "Leave"}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <p className="text-[11px] text-ink-soft leading-relaxed bg-bg/40 p-2.5 rounded-xl border border-border">
            💡 <strong>Tip:</strong> Team members marked <em>Active</em> will automatically receive leads on future distribution runs. You can toggle anyone to <em>Leave</em> when unavailable, or customize this specific distribution batch using the checkboxes.
          </p>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-border bg-bg/50 flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDistributing}
            className="w-full sm:w-auto text-xs sm:text-sm h-10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDistribute}
            disabled={selectedCount === 0 || unassignedCount === 0 || isDistributing}
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs sm:text-sm h-10 bg-accent hover:bg-accent/90 text-surface font-semibold shadow-sm"
          >
            {isDistributing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Distributing Leads...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Distribute {unassignedCount > 0 ? `${unassignedCount} Leads` : "Leads"} ({selectedCount} Selected)
              </>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}
