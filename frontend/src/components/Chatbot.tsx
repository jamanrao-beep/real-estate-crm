"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, CheckCircle2, Phone, Calendar, Clock, MapPin, Sparkles, Building2, Trees, Home, ShieldCheck } from "lucide-react";
import api from "@/lib/api";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  options?: string[];
  isConfirmedCard?: boolean;
  confirmedData?: {
    name: string;
    phone: string;
    interest: string;
    location: string;
    budget: string;
    timeline: string;
    appointmentType: string;
    date: string;
    time: string;
  };
}

type ScriptStep =
  | "NAME"
  | "INTENT"
  | "LOCATION"
  | "BUDGET"
  | "TIMELINE"
  | "APPOINTMENT_TYPE"
  | "APPOINTMENT_DATE"
  | "APPOINTMENT_TIME"
  | "PHONE"
  | "CONFIRMED";

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [step, setStep] = useState<ScriptStep>("NAME");
  const [leadData, setLeadData] = useState({
    name: "",
    phone: "",
    interest: "",
    location: "",
    budget: "",
    timeline: "",
    appointmentType: "Site Visit",
    date: "",
    time: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "bot",
      text: "👋 Welcome to **Badri Kedar Developer**!\n\nWe help you find the right property — premium plots, flats & commercial spaces in prime locations.\n\nMay I know your name, please? 🙂"
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleUserInput = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: text.trim()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Process state machine
    await processNextStep(text.trim());
  };

  const processNextStep = async (userInput: string) => {
    const nextMsgId = (Date.now() + 1).toString();

    switch (step) {
      case "NAME": {
        const clientName = userInput;
        setLeadData((prev) => ({ ...prev, name: clientName }));
        setStep("INTENT");

        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: nextMsgId,
              sender: "bot",
              text: `Nice to meet you, **${clientName}**! What are you looking for today?`,
              options: [
                "🏠 Residential Property",
                "🏢 Commercial Property",
                "🌳 Plot / Land",
                "📋 Just Exploring"
              ]
            }
          ]);
        }, 500);
        break;
      }

      case "INTENT": {
        setLeadData((prev) => ({ ...prev, interest: userInput }));
        setStep("LOCATION");

        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: nextMsgId,
              sender: "bot",
              text: "Great choice! Which location/area or project are you interested in?\n*(e.g., Highway frontage, Township, Prime Central)*",
              options: ["Highway Frontage", "Gated Township", "City Center", "Open to Suggestions"]
            }
          ]);
        }, 500);
        break;
      }

      case "LOCATION": {
        setLeadData((prev) => ({ ...prev, location: userInput }));
        setStep("BUDGET");

        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: nextMsgId,
              sender: "bot",
              text: "What's your approximate budget range?",
              options: ["Under ₹30L", "₹30L – ₹60L", "₹60L – ₹1Cr", "₹1Cr+"]
            }
          ]);
        }, 500);
        break;
      }

      case "BUDGET": {
        setLeadData((prev) => ({ ...prev, budget: userInput }));
        setStep("TIMELINE");

        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: nextMsgId,
              sender: "bot",
              text: "When are you planning to buy/invest?",
              options: [
                "Immediately (within 1 month)",
                "1–3 months",
                "3–6 months",
                "Just researching"
              ]
            }
          ]);
        }, 500);
        break;
      }

      case "TIMELINE": {
        setLeadData((prev) => ({ ...prev, timeline: userInput }));
        setStep("APPOINTMENT_TYPE");

        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: nextMsgId,
              sender: "bot",
              text: "Would you like to schedule a **site visit** (with complimentary cab pickup) or a **call with our property advisor**?",
              options: ["📍 Site Visit", "☎️ Call Back", "🏢 Office Meeting"]
            }
          ]);
        }, 500);
        break;
      }

      case "APPOINTMENT_TYPE": {
        const appType = userInput.replace(/[^a-zA-Z ]/g, "").trim() || "Site Visit";
        setLeadData((prev) => ({ ...prev, appointmentType: appType }));
        setStep("APPOINTMENT_DATE");

        // Generate next 3 days
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date(today);
        dayAfter.setDate(dayAfter.getDate() + 2);

        const formatDate = (d: Date) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: nextMsgId,
              sender: "bot",
              text: `Perfect! Please choose your preferred date for the **${appType}**:`,
              options: [
                `Today (${formatDate(today)})`,
                `Tomorrow (${formatDate(tomorrow)})`,
                `This Weekend (${formatDate(dayAfter)})`,
                "Custom Date"
              ]
            }
          ]);
        }, 500);
        break;
      }

      case "APPOINTMENT_DATE": {
        setLeadData((prev) => ({ ...prev, date: userInput }));
        setStep("APPOINTMENT_TIME");

        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: nextMsgId,
              sender: "bot",
              text: "And what time slot works best for you?",
              options: [
                "10:00 AM – 12:00 PM",
                "12:00 PM – 2:00 PM",
                "4:00 PM – 6:00 PM",
                "6:00 PM – 8:00 PM"
              ]
            }
          ]);
        }, 500);
        break;
      }

      case "APPOINTMENT_TIME": {
        setLeadData((prev) => ({ ...prev, time: userInput }));
        setStep("PHONE");

        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: nextMsgId,
              sender: "bot",
              text: "Almost done! Please share your **10-digit mobile number** so our site manager can confirm your booking. 📞"
            }
          ]);
        }, 500);
        break;
      }

      case "PHONE": {
        const cleanPhone = userInput.replace(/[^0-9]/g, "");
        if (cleanPhone.length < 10) {
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                id: nextMsgId,
                sender: "bot",
                text: "Please enter a valid 10-digit contact number (e.g. 9876543210) so we can send your appointment details."
              }
            ]);
          }, 400);
          return;
        }

        const finalData = { ...leadData, phone: cleanPhone };
        setLeadData(finalData);
        setStep("CONFIRMED");
        setIsSubmitting(true);

        try {
          // Push lead to CRM webhook
          await api.post("/leads/webhook", {
            name: finalData.name,
            phone: finalData.phone,
            source: "Website AI Bot (BKD Script)",
            category: "HOT",
            funnelStage: "INTERESTED",
            notes: `[Bot Booking] ${finalData.appointmentType} on ${finalData.date} at ${finalData.time}. Interest: ${finalData.interest}, Budget: ${finalData.budget}, Location: ${finalData.location}`,
            formAnswers: {
              interest: finalData.interest,
              location: finalData.location,
              budget: finalData.budget,
              timeline: finalData.timeline,
              appointmentType: finalData.appointmentType,
              date: finalData.date,
              time: finalData.time
            }
          });
        } catch (err) {
          console.error("Failed to push bot lead to CRM:", err);
        } finally {
          setIsSubmitting(false);
        }

        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: nextMsgId,
              sender: "bot",
              text: "✅ **Your appointment is booked!**\n\nOur team has received your request and will call you shortly to confirm. Thank you for choosing **Badri Kedar Developer**! 🙏",
              isConfirmedCard: true,
              confirmedData: finalData
            }
          ]);
        }, 600);
        break;
      }

      case "CONFIRMED": {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: nextMsgId,
              sender: "bot",
              text: "Thank you! Our property advisor will get in touch with you shortly. You can also reach our helpline directly at **+91 90585 71709**."
            }
          ]);
        }, 500);
        break;
      }
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 font-sans">
      {isOpen ? (
        <div className="bg-surface w-[92vw] sm:w-[390px] md:w-[410px] rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col h-[560px] max-h-[85vh] animate-in fade-in-50 zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-ink via-[#273640] to-ink border-b border-accent/30 text-surface p-4 flex justify-between items-center shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface/10 border border-accent/40 flex items-center justify-center text-accent shadow-inner">
                <Sparkles size={20} className="text-accent" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-sm tracking-wide text-white">Badri Kedar AI</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Online
                  </span>
                </div>
                <p className="text-[11px] text-accent font-medium">Property & Site Visit Concierge</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-surface/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
              aria-label="Close assistant"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3.5 bg-bg/80">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-2">
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm shadow-2xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-ink text-surface self-end ml-auto rounded-br-xs border border-accent/20"
                      : "bg-surface border border-border text-ink self-start rounded-bl-xs shadow-2xs"
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>
                </div>

                {/* Confirmation Card if booked */}
                {msg.isConfirmedCard && msg.confirmedData && (
                  <div className="bg-accent-soft/25 border border-accent/40 rounded-2xl p-4 text-xs space-y-2.5 text-ink shadow-xs">
                    <div className="flex items-center gap-2 font-bold text-ink text-xs">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-700 flex items-center justify-center">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                      </div>
                      <span className="font-serif tracking-tight">Appointment Booking Confirmed</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-accent/20">
                      <div><span className="text-ink-soft">Client:</span> <strong className="text-ink block">{msg.confirmedData.name}</strong></div>
                      <div><span className="text-ink-soft">Phone:</span> <strong className="text-ink block">{msg.confirmedData.phone}</strong></div>
                      <div><span className="text-ink-soft">Booking Type:</span> <strong className="text-accent block">{msg.confirmedData.appointmentType}</strong></div>
                      <div><span className="text-ink-soft">Preferred Date:</span> <strong className="text-ink block">{msg.confirmedData.date}</strong></div>
                      <div className="col-span-2"><span className="text-ink-soft">Time Slot:</span> <strong className="text-ink block">{msg.confirmedData.time}</strong></div>
                      <div className="col-span-2"><span className="text-ink-soft">Property Interest:</span> <strong className="text-ink block">{msg.confirmedData.interest}</strong></div>
                    </div>
                  </div>
                )}

                {/* Interactive Quick Reply Buttons */}
                {msg.options && msg.options.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleUserInput(opt)}
                        className="bg-surface hover:bg-accent-soft/40 text-ink border border-border hover:border-accent px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-2xs hover:scale-102 text-left"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUserInput(input);
            }}
            className="p-3 bg-surface border-t border-border flex gap-2 items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your reply or question..."
              disabled={isSubmitting}
              className="flex-1 border border-border bg-bg rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent placeholder:text-ink-soft"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSubmitting}
              className="bg-ink hover:bg-ink/90 disabled:opacity-50 text-accent border border-accent/30 p-2.5 rounded-xl transition-all flex items-center justify-center shadow-xs"
            >
              <Send size={15} />
            </button>
          </form>
          <div className="py-1.5 bg-surface text-center text-[10px] text-ink-soft border-t border-border/60 flex items-center justify-center gap-1.5">
            <ShieldCheck size={12} className="text-accent" />
            <span>Badri Kedar Developer AI Assistant &bull; Verified CRM</span>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 sm:gap-3 bg-ink text-surface pl-3 pr-4 sm:pl-3.5 sm:pr-5 py-2.5 sm:py-3 rounded-full shadow-xl hover:shadow-2xl border border-accent/40 hover:border-accent transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
          aria-label="Open Site Visit Assistant"
        >
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 border border-accent/40 text-accent group-hover:scale-110 transition-transform">
            <Sparkles size={16} className="text-accent group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-ink"></span>
            </span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[9px] uppercase font-mono tracking-widest text-accent font-semibold leading-tight">
              Badri Kedar AI
            </span>
            <span className="text-xs sm:text-sm font-bold text-white tracking-wide leading-tight">
              Book Site Visit
            </span>
          </div>
        </button>
      )}
    </div>
  );
}
export default Chatbot;
