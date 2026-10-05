"use client";

import React, { useState } from "react";
import api from "@/lib/api";
import { MessageSquare, Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";

export interface LeadNoteItem {
  id?: string;
  note: string;
  date?: string;
  source: "callLog" | "formAnswers";
}

export function getLeadCallNotes(lead: any): LeadNoteItem[] {
  const list: LeadNoteItem[] = [];
  if (Array.isArray(lead?.callLogs)) {
    for (const cl of lead.callLogs) {
      if (cl.notes && cl.notes.trim() && !cl.notes.trim().startsWith("[AUDIT:")) {
        list.push({
          id: cl.id,
          note: cl.notes.trim(),
          date: cl.createdAt
            ? new Date(cl.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
            : undefined,
          source: "callLog",
        });
      }
    }
  }
  if (
    lead?.formAnswers?.callNotes &&
    typeof lead.formAnswers.callNotes === "string" &&
    lead.formAnswers.callNotes.trim() &&
    !lead.formAnswers.callNotes.trim().startsWith("[AUDIT:")
  ) {
    const cn = lead.formAnswers.callNotes.trim();
    if (!list.some((item) => item.note === cn)) {
      list.unshift({ id: "formAnswers", note: cn, source: "formAnswers" });
    }
  }
  return list;
}

export interface LeadAuditItem {
  id?: string;
  action: string;
  actor: string;
  date: string;
  details: string;
  raw: string;
}

export function getLeadAuditLogs(lead: any): LeadAuditItem[] {
  const list: LeadAuditItem[] = [];
  if (Array.isArray(lead?.callLogs)) {
    for (const cl of lead.callLogs) {
      if (cl.notes && cl.notes.trim().startsWith("[AUDIT:")) {
        const text = cl.notes.trim();
        const actionMatch = text.match(/^\[AUDIT:\s*([^\]]+)\]/i);
        const action = actionMatch ? actionMatch[1].trim() : "ACTION";

        const byMatch = text.match(/by\s+([^at|]+?)\s+at\s+([^|]+?)(?:\s*\|\s*(.*))?$/i);
        const actor = byMatch ? byMatch[1].trim() : "Sales Rep";
        const dateStr = byMatch ? byMatch[2].trim() : (cl.createdAt ? new Date(cl.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "");
        const details = byMatch && byMatch[3] ? byMatch[3].trim() : text;

        list.push({
          id: cl.id,
          action,
          actor,
          date: dateStr,
          details,
          raw: text,
        });
      }
    }
  }
  return list;
}

interface LeadNotesBoxProps {
  lead: any;
  onLeadUpdated?: (updatedLead: any) => void;
  className?: string;
}

export function LeadNotesBox({ lead, onLeadUpdated, className = "" }: LeadNotesBoxProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);

  // Editing state
  const [editingTarget, setEditingTarget] = useState<{ id?: string; oldNote: string } | null>(null);
  const [editText, setEditText] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Deleting state
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const notesList = getLeadCallNotes(lead);
  const auditLogs = getLeadAuditLogs(lead);

  const notifyUpdate = (updatedLeadData: any) => {
    if (!onLeadUpdated) return;
    onLeadUpdated({
      ...lead,
      ...updatedLeadData,
      assignmentHistory: updatedLeadData.assignmentHistory || lead.assignmentHistory,
      statusHistory: updatedLeadData.statusHistory || lead.statusHistory,
      callLogs: updatedLeadData.callLogs || lead.callLogs,
    });
  };

  const handleAddNote = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newNoteText.trim() || isSubmittingNew) return;

    try {
      setIsSubmittingNew(true);
      const res = await api.post(`/leads/${lead.id}/notes`, { note: newNoteText.trim() });
      if (res.data?.lead) {
        notifyUpdate(res.data.lead);
      }
      setNewNoteText("");
      setIsAdding(false);
    } catch (err: any) {
      console.error("Failed to add note", err);
      alert(err.response?.data?.error || "Failed to add note");
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const startEditing = (noteItem: LeadNoteItem) => {
    setEditingTarget({ id: noteItem.id, oldNote: noteItem.note });
    setEditText(noteItem.note);
    setIsAdding(false);
  };

  const cancelEditing = () => {
    setEditingTarget(null);
    setEditText("");
  };

  const handleSaveEdit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingTarget || !editText.trim() || isSubmittingEdit) return;

    try {
      setIsSubmittingEdit(true);
      const res = await api.patch(`/leads/${lead.id}/notes`, {
        noteId: editingTarget.id,
        oldNote: editingTarget.oldNote,
        newNote: editText.trim(),
      });
      if (res.data?.lead) {
        notifyUpdate(res.data.lead);
      }
      setEditingTarget(null);
      setEditText("");
    } catch (err: any) {
      console.error("Failed to update note", err);
      alert(err.response?.data?.error || "Failed to update note");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteNote = async (noteItem: LeadNoteItem) => {
    if (!window.confirm(`Delete this note: "${noteItem.note}"?`)) return;

    const key = noteItem.id || noteItem.note;
    try {
      setDeletingKey(key);
      const res = await api.delete(`/leads/${lead.id}/notes`, {
        data: {
          noteId: noteItem.id,
          note: noteItem.note,
        },
      });
      if (res.data?.lead) {
        notifyUpdate(res.data.lead);
      }
    } catch (err: any) {
      console.error("Failed to delete note", err);
      alert(err.response?.data?.error || "Failed to delete note");
    } finally {
      setDeletingKey(null);
    }
  };

  // If there are no notes and not in adding mode, show friendly "+ Add Note" button
  if (notesList.length === 0 && !isAdding) {
    return (
      <div className={`mt-2 ${className}`}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-sky-700 dark:text-sky-300 hover:text-sky-900 dark:hover:text-white bg-sky-500/10 hover:bg-sky-500/20 border border-sky-400/30 rounded-md px-2 py-1 transition-all cursor-pointer shadow-xs"
          >
            <Plus size={12} className="text-sky-600 dark:text-sky-400" />
            <span>+ Add Note</span>
          </button>
          {auditLogs.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAuditTrail(!showAuditTrail)}
              className="inline-flex items-center gap-1 text-[10px] font-medium text-ink-soft hover:text-ink bg-surface-muted/60 hover:bg-surface-muted border border-border/60 rounded px-1.5 py-0.5 transition-colors cursor-pointer"
              title="View timestamped sales actions audit trail"
            >
              <span>⏱️ History ({auditLogs.length})</span>
            </button>
          )}
        </div>

        {showAuditTrail && auditLogs.length > 0 && (
          <div className="mt-2 p-2 rounded-lg border border-border bg-bg/80 text-[10px] space-y-1.5 animate-in fade-in duration-150">
            <div className="font-semibold text-ink flex items-center justify-between border-b border-border/60 pb-1">
              <span>Audit Trail (Timestamped)</span>
              <button
                type="button"
                onClick={() => setShowAuditTrail(false)}
                className="text-ink-soft hover:text-ink text-[11px]"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {auditLogs.map((log, idx) => (
                <div key={log.id || idx} className="text-ink-soft border-b border-border/30 pb-1 last:border-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold px-1 py-0.2 rounded bg-accent/10 text-accent text-[9px] uppercase">
                      {log.action}
                    </span>
                    <span className="text-ink font-medium">{log.actor}</span>
                    <span className="text-[9px] opacity-75">{log.date}</span>
                  </div>
                  <div className="text-ink/90 italic pl-1 mt-0.5 break-words">
                    {log.details}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`mt-2 p-2.5 rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-950 dark:text-sky-200 text-xs flex flex-col gap-1.5 transition-all shadow-xs ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-1">
        <span className="flex items-center gap-1.5 font-semibold text-sky-800 dark:text-sky-300">
          <MessageSquare size={13} className="shrink-0 text-sky-600 dark:text-sky-400" />
          <span>Note{notesList.length > 1 ? `s (${notesList.length})` : ""}</span>
        </span>

        <div className="flex items-center gap-1.5">
          {notesList[0]?.date && (
            <span className="text-[10px] text-sky-800/70 dark:text-sky-300/70 font-normal">
              {notesList[0].date}
            </span>
          )}
          {auditLogs.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAuditTrail(!showAuditTrail)}
              title="View timestamped sales actions audit trail"
              className="inline-flex items-center gap-1 text-[10px] font-medium text-sky-800/80 dark:text-sky-200/80 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
            >
              <span>⏱️ ({auditLogs.length})</span>
            </button>
          )}
          {!isAdding && (
            <button
              type="button"
              onClick={() => {
                setIsAdding(true);
                cancelEditing();
              }}
              title="Add a new note"
              className="inline-flex items-center gap-1 text-[10px] font-medium text-sky-800 dark:text-sky-200 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/25 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
            >
              <Plus size={11} />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>

      {showAuditTrail && auditLogs.length > 0 && (
        <div className="mt-1 p-2 rounded-lg border border-border bg-bg/80 text-[10px] space-y-1.5 animate-in fade-in duration-150">
          <div className="font-semibold text-ink flex items-center justify-between border-b border-border/60 pb-1">
            <span>Audit Trail (Timestamped)</span>
            <button
              type="button"
              onClick={() => setShowAuditTrail(false)}
              className="text-ink-soft hover:text-ink text-[11px]"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
            {auditLogs.map((log, idx) => (
              <div key={log.id || idx} className="text-ink-soft border-b border-border/30 pb-1 last:border-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold px-1 py-0.2 rounded bg-accent/10 text-accent text-[9px] uppercase">
                    {log.action}
                  </span>
                  <span className="text-ink font-medium">{log.actor}</span>
                  <span className="text-[9px] opacity-75">{log.date}</span>
                </div>
                <div className="text-ink/90 italic pl-1 mt-0.5 break-words">
                  {log.details}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inline Add Note Form */}
      {isAdding && (
        <form onSubmit={handleAddNote} className="mt-1 flex flex-col gap-1.5 bg-white/70 dark:bg-zinc-900/70 p-2 rounded-md border border-sky-400/40">
          <textarea
            autoFocus
            rows={2}
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Type your note here..."
            className="w-full text-xs p-1.5 rounded border border-ink/20 bg-background text-ink placeholder:text-ink/40 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"
          />
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewNoteText("");
              }}
              disabled={isSubmittingNew}
              className="px-2 py-0.5 text-[11px] rounded text-ink/70 hover:text-ink hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newNoteText.trim() || isSubmittingNew}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-medium rounded bg-sky-600 hover:bg-sky-700 text-white cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
            >
              {isSubmittingNew ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
              Save
            </button>
          </div>
        </form>
      )}

      {/* Primary Latest Note */}
      {notesList.length > 0 && (
        <div className="group relative">
          {editingTarget && (editingTarget.id === notesList[0].id || editingTarget.oldNote === notesList[0].note) ? (
            <form onSubmit={handleSaveEdit} className="mt-1 flex flex-col gap-1.5 bg-white/70 dark:bg-zinc-900/70 p-2 rounded-md border border-sky-400/40">
              <textarea
                autoFocus
                rows={2}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full text-xs p-1.5 rounded border border-ink/20 bg-background text-ink focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"
              />
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={isSubmittingEdit}
                  className="px-2 py-0.5 text-[11px] rounded text-ink/70 hover:text-ink hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editText.trim() || isSubmittingEdit}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-medium rounded bg-sky-600 hover:bg-sky-700 text-white cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
                >
                  {isSubmittingEdit ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                  Save
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-start justify-between gap-1 text-[11px] text-ink/90 italic">
              <span className="break-words flex-1">&ldquo;{notesList[0].note}&rdquo;</span>
              <div className="flex items-center gap-1 shrink-0 ml-1 opacity-70 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => startEditing(notesList[0])}
                  title="Edit note"
                  className="p-1 rounded hover:bg-sky-500/20 text-sky-800 dark:text-sky-300 cursor-pointer transition-colors"
                >
                  <Pencil size={11} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteNote(notesList[0])}
                  disabled={deletingKey === (notesList[0].id || notesList[0].note)}
                  title="Delete note"
                  className="p-1 rounded hover:bg-red-500/20 text-red-600 dark:text-red-400 cursor-pointer transition-colors"
                >
                  {deletingKey === (notesList[0].id || notesList[0].note) ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <Trash2 size={11} />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Older Notes */}
      {notesList.length > 1 && (
        <div className="mt-1 pt-1.5 border-t border-sky-500/20 space-y-1.5">
          {notesList.slice(1).map((cn, idx) => {
            const isEditingThis =
              editingTarget && (editingTarget.id === cn.id || editingTarget.oldNote === cn.note);

            return (
              <div key={cn.id || idx} className="group relative">
                {isEditingThis ? (
                  <form onSubmit={handleSaveEdit} className="mt-1 flex flex-col gap-1.5 bg-white/70 dark:bg-zinc-900/70 p-2 rounded-md border border-sky-400/40">
                    <textarea
                      autoFocus
                      rows={2}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full text-xs p-1.5 rounded border border-ink/20 bg-background text-ink focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"
                    />
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={cancelEditing}
                        disabled={isSubmittingEdit}
                        className="px-2 py-0.5 text-[11px] rounded text-ink/70 hover:text-ink hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!editText.trim() || isSubmittingEdit}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-medium rounded bg-sky-600 hover:bg-sky-700 text-white cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
                      >
                        {isSubmittingEdit ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-[10px] text-ink/80 flex items-start justify-between gap-1">
                    <div className="flex items-start gap-1 flex-1 min-w-0">
                      <span className="shrink-0 text-sky-700 dark:text-sky-400 font-bold">•</span>
                      <span className="italic break-words">&ldquo;{cn.note}&rdquo;</span>
                      {cn.date && (
                        <span className="shrink-0 text-[9px] opacity-70 ml-1 text-ink-soft">
                          ({cn.date})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => startEditing(cn)}
                        title="Edit note"
                        className="p-0.5 rounded hover:bg-sky-500/20 text-sky-800 dark:text-sky-300 cursor-pointer transition-colors"
                      >
                        <Pencil size={10} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(cn)}
                        disabled={deletingKey === (cn.id || cn.note)}
                        title="Delete note"
                        className="p-0.5 rounded hover:bg-red-500/20 text-red-600 dark:text-red-400 cursor-pointer transition-colors"
                      >
                        {deletingKey === (cn.id || cn.note) ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          <Trash2 size={10} />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
