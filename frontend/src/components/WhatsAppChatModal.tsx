"use client";

import { useState } from "react";
import { MessageSquare, Send, Bot, User, CheckCircle2, Phone, Sparkles, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";

interface ChatMessage {
  sender: string;
  message: string;
  timestamp: string;
  channel?: string;
  status?: string;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  aiChatHistory?: ChatMessage[] | null;
  category?: string | null;
  funnelStage?: string | null;
}

interface WhatsAppChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onLeadUpdated?: (updatedLead: Lead) => void;
}

export default function WhatsAppChatModal({
  isOpen,
  onClose,
  lead,
  onLeadUpdated,
}: WhatsAppChatModalProps) {
  const [customMessage, setCustomMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState("");

  if (!isOpen || !lead) return null;

  const chatHistory = Array.isArray(lead.aiChatHistory) ? lead.aiChatHistory : [];

  const handleSendGreeting = async () => {
    setIsSending(true);
    setStatusFeedback("");
    try {
      const res = await api.post(`/leads/${lead.id}/send-whatsapp`, {});
      if (res.data.lead && onLeadUpdated) {
        onLeadUpdated(res.data.lead);
      }
      setStatusFeedback("Greeting dispatched successfully via ChatMitra!");
      setTimeout(() => setStatusFeedback(""), 4000);
    } catch (err: any) {
      console.error("Error sending WhatsApp greeting:", err);
      setStatusFeedback("Failed to send greeting: " + (err.response?.data?.error || err.message));
    } finally {
      setIsSending(false);
    }
  };

  const handleSendCustomMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMessage.trim() || isSending) return;

    setIsSending(true);
    setStatusFeedback("");
    try {
      const res = await api.post(`/leads/${lead.id}/send-whatsapp`, {
        message: customMessage.trim(),
      });
      if (res.data.lead && onLeadUpdated) {
        onLeadUpdated(res.data.lead);
      }
      setCustomMessage("");
      setStatusFeedback("WhatsApp message sent!");
      setTimeout(() => setStatusFeedback(""), 4000);
    } catch (err: any) {
      console.error("Error sending WhatsApp message:", err);
      setStatusFeedback("Failed to send: " + (err.response?.data?.error || err.message));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-emerald-600 dark:bg-emerald-700 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
              <Bot size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">{lead.name}</h3>
                <span className="bg-emerald-500/40 text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border border-white/20 text-emerald-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                  Bot BKD Active
                </span>
              </div>
              <p className="text-xs text-emerald-100 flex items-center gap-1.5 mt-0.5 font-mono">
                <Phone size={11} /> {lead.phone}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Bot Quick Actions Banner */}
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/40 px-4 py-2.5 flex items-center justify-between gap-2 flex-wrap">
          <div className="text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
            <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Interactive options (1-5) auto-reply when the lead texts back.</span>
          </div>
          <Button
            size="sm"
            onClick={handleSendGreeting}
            disabled={isSending}
            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw size={12} className={isSending ? "animate-spin" : ""} />
            Send BKD Greeting
          </Button>
        </div>

        {/* Feedback Alert */}
        {statusFeedback && (
          <div className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-100 text-xs px-4 py-2 flex items-center gap-1.5 border-b border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{statusFeedback}</span>
          </div>
        )}

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#e5ddd5]/30 dark:bg-bg min-h-[260px]">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-ink-soft space-y-2">
              <MessageSquare size={36} className="text-ink-soft/40" />
              <p className="font-semibold text-ink text-sm">No WhatsApp messages yet</p>
              <p className="text-xs max-w-sm">
                Click &ldquo;Send BKD Greeting&rdquo; above or write a message below to engage this customer on WhatsApp.
              </p>
            </div>
          ) : (
            chatHistory.map((msg, index) => {
              const isLead = msg.sender === "customer" || msg.sender === "lead";
              return (
                <div
                  key={index}
                  className={`flex items-end gap-2 ${isLead ? "justify-start" : "justify-end"}`}
                >
                  {isLead && (
                    <div className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[10px] shrink-0 font-bold">
                      <User size={12} />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-sm whitespace-pre-line ${
                      isLead
                        ? "bg-surface border border-border text-ink rounded-bl-xs"
                        : "bg-emerald-600 text-white rounded-br-xs"
                    }`}
                  >
                    <div className="font-medium text-[10px] opacity-75 mb-1 flex items-center justify-between gap-3">
                      <span>{isLead ? lead.name : "BKD WhatsApp Bot"}</span>
                      <span>
                        {msg.timestamp
                          ? new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                    </div>
                    <div className="leading-relaxed">{msg.message}</div>
                  </div>
                  {!isLead && (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shrink-0">
                      <Bot size={12} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSendCustomMessage}
          className="p-3 bg-surface border-t border-border flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Type a WhatsApp message to customer..."
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            disabled={isSending}
            className="flex-1 bg-bg border border-border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
          <Button
            type="submit"
            disabled={isSending || !customMessage.trim()}
            className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm"
          >
            <Send size={14} />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
