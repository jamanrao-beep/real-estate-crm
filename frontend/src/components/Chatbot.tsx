"use client";

import { useState } from "react";
import { MessageSquare, X, Send, Bot } from "lucide-react";

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'bot', text: string}[]>([
    { role: 'bot', text: 'Hi! I am ChatMytra, powered by OpenAI. I can help you manage your real estate leads and answer your questions.' }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'user' as const, text: input }];
    setMessages(newMessages);
    setInput("");
    
    // Mock response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: 'bot' as const, text: 'This is a mock response from ChatMytra (OpenAI API). I am currently just a UI placeholder!' }
      ]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {isOpen ? (
        <div className="bg-surface w-80 sm:w-96 rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col h-[500px]">
          <div className="bg-accent text-surface p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <span className="font-serif font-semibold text-surface">ChatMytra Support</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-surface/80 hover:text-surface transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-bg">
            {messages.map((msg, idx) => (
              <div key={idx} className={`max-w-[85%] p-3 rounded-xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-accent text-surface self-end rounded-tr-sm' : 'bg-surface border border-border text-ink self-start rounded-tl-sm'}`}>
                {msg.text}
              </div>
            ))}
          </div>
          
          <div className="p-3 bg-surface border-t border-border flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask ChatMytra..." 
              className="flex-1 border border-border bg-bg rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent placeholder:text-ink-soft"
            />
            <button 
              onClick={handleSend}
              className="bg-accent hover:bg-accent/90 text-surface p-2 rounded-lg transition-colors flex items-center justify-center"
            >
              <Send size={18} />
            </button>
          </div>
          <div className="py-2 bg-surface text-center text-xs text-ink-soft border-t border-border">
            Powered by OpenAI API
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-accent hover:bg-accent/90 text-surface p-4 rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center"
        >
          <MessageSquare size={24} />
        </button>
      )}
    </div>
  );
}
