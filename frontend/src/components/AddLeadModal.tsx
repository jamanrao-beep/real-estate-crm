"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { X, UserPlus, Loader2, AlertCircle, FileSpreadsheet } from "lucide-react";

interface SalesPerson {
  id: string;
  name: string;
}

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  defaultAssignedToId?: string;
  onOpenExcel?: () => void;
}

export default function AddLeadModal({
  isOpen,
  onClose,
  onSuccess,
  defaultAssignedToId = "",
  onOpenExcel,
}: AddLeadModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("Facebook Lead Ad");
  const [customSource, setCustomSource] = useState("");
  const [category, setCategory] = useState("HOT");
  const [assignedToId, setAssignedToId] = useState(defaultAssignedToId);
  const [notes, setNotes] = useState("");

  const [salesTeam, setSalesTeam] = useState<SalesPerson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch sales team for assignment dropdown
      api
        .get("/auth/users")
        .then((res) => setSalesTeam(res.data))
        .catch((err) => console.error("Failed to fetch sales team for AddLeadModal", err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName && !trimmedPhone) {
      setError("Please provide at least a Name or a Phone number.");
      return;
    }

    const finalSource = source === "Custom" ? (customSource.trim() || "Manual Entry") : source;

    setIsLoading(true);
    try {
      await api.post("/leads", {
        name: trimmedName || `Lead (${trimmedPhone})`,
        phone: trimmedPhone || "N/A",
        email: email.trim() || undefined,
        source: finalSource,
        category,
        assignedToId: assignedToId || null,
        notes: notes.trim() || undefined,
      });

      onSuccess(
        assignedToId
          ? "Lead created and assigned successfully!"
          : "New lead created in Unassigned Lead Inbox!"
      );
      handleClose();
    } catch (err: any) {
      console.error("Failed to create lead:", err);
      setError(err.response?.data?.error || "Failed to create lead. Please check details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setPhone("");
    setEmail("");
    setSource("Facebook Lead Ad");
    setCustomSource("");
    setCategory("HOT");
    setAssignedToId(defaultAssignedToId);
    setNotes("");
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-bg/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center text-accent">
              <UserPlus size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-ink">Create New Lead</h2>
              <p className="text-xs text-ink-soft">
                Add an inquiry directly into the CRM inbox or assign it
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-ink-soft hover:text-ink hover:bg-bg/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {onOpenExcel && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-xs text-ink font-medium">Have an Excel or CSV file with multiple leads?</span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  handleClose();
                  onOpenExcel();
                }}
                className="h-7 px-2.5 text-xs border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 font-medium shrink-0"
              >
                Import Excel
              </Button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-xs sm:text-sm flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <Input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 text-sm bg-bg"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1">
                Phone Number *
              </label>
              <Input
                type="tel"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10 text-sm bg-bg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1">
                Email Address (Optional)
              </label>
              <Input
                type="email"
                placeholder="e.g. rahul@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 text-sm bg-bg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1">
                Lead Source
              </label>
              <Select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="h-10 text-sm bg-bg w-full"
              >
                <option value="Facebook Lead Ad">Facebook Lead Ad</option>
                <option value="Google Sheet / Webhook">Google Sheet / Webhook</option>
                <option value="WhatsApp Bot (ChatMitra)">WhatsApp Bot</option>
                <option value="Website Contact Form">Website Form</option>
                <option value="Direct Call / Walk-in">Direct Call / Walk-in</option>
                <option value="Channel Partner">Channel Partner</option>
                <option value="Manual Test Lead">Manual Test Lead</option>
                <option value="Custom">Other (Specify below)</option>
              </Select>
            </div>
          </div>

          {source === "Custom" && (
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1">
                Custom Source Name
              </label>
              <Input
                type="text"
                placeholder="e.g. Instagram Ad, Radio Promo"
                value={customSource}
                onChange={(e) => setCustomSource(e.target.value)}
                className="h-10 text-sm bg-bg"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1">
                Initial Category
              </label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 text-sm bg-bg w-full"
              >
                <option value="HOT">🔥 Hot (High Intent)</option>
                <option value="WARM">🌤️ Warm (Evaluating)</option>
                <option value="COLD">❄️ Cold (Future)</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1">
                Assign Lead To
              </label>
              <Select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="h-10 text-sm bg-bg w-full"
              >
                <option value="">📥 Unassigned (Lead Inbox)</option>
                {salesTeam.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    👤 {rep.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1">
              Notes / Requirement (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Interested in 2BHK flat, budget 45L..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-border bg-bg text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isLoading}
              className="h-9 px-4 text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading}
              className="h-9 px-5 text-xs font-semibold bg-accent hover:bg-accent/90 text-surface flex items-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <UserPlus size={14} />
                  <span>{assignedToId ? "Create & Assign" : "Create in Inbox"}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
