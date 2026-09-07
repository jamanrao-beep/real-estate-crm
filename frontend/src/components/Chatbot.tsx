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
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {isOpen ? (
        <div className="bg-surface w-[92vw] sm:w-[380px] md:w-[400px] rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col h-[560px] max-h-[85vh] animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 flex justify-between items-center shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white">
                <Bot size={20} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-serif font-bold text-sm tracking-wide text-white">Badri Kedar AI</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                </div>
                <p className="text-[11px] text-emerald-100 font-medium">Property & Site Visit Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3.5 bg-bg/80">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-2">
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm shadow-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-emerald-600 text-white self-end ml-auto rounded-br-xs"
                      : "bg-surface border border-border text-ink self-start rounded-bl-xs"
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>
                </div>

                {/* Confirmation Card if booked */}
                {msg.isConfirmedCard && msg.confirmedData && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl p-3.5 text-xs space-y-2 text-ink shadow-sm">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 text-xs">
                      <CheckCircle2 size={15} className="text-emerald-600" />
                      <span>Booking Summary</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1 border-t border-emerald-200 dark:border-emerald-900">
                      <div><span className="text-ink-soft">Name:</span> <strong className="text-ink">{msg.confirmedData.name}</strong></div>
                      <div><span className="text-ink-soft">Phone:</span> <strong className="text-ink">{msg.confirmedData.phone}</strong></div>
                      <div><span className="text-ink-soft">Type:</span> <strong className="text-emerald-700 dark:text-emerald-400">{msg.confirmedData.appointmentType}</strong></div>
                      <div><span className="text-ink-soft">Date:</span> <strong className="text-ink">{msg.confirmedData.date}</strong></div>
                      <div className="col-span-2"><span className="text-ink-soft">Time:</span> <strong className="text-ink">{msg.confirmedData.time}</strong></div>
                      <div className="col-span-2"><span className="text-ink-soft">Interest:</span> <strong className="text-ink">{msg.confirmedData.interest}</strong></div>
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
                        className="bg-surface hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500 px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-2xs hover:scale-102 text-left"
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
              placeholder="Type your reply here..."
              disabled={isSubmitting}
              className="flex-1 border border-border bg-bg rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-ink focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder:text-ink-soft"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors flex items-center justify-center shadow-sm"
            >
              <Send size={16} />
            </button>
          </form>
          <div className="py-1.5 bg-surface text-center text-[10px] text-ink-soft border-t border-border/60 flex items-center justify-center gap-1">
            <ShieldCheck size={11} className="text-emerald-600" />
            <span>Badri Kedar Developer AI CRM Assistant</span>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-3.5 sm:p-4 rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 group border border-white/20"
        >
          <MessageSquare size={22} className="group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline font-bold text-xs tracking-wide pr-1">Book Site Visit</span>
        </button>
      )}
    </div>
  );
}
export default Chatbot;
