"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, MessageSquare } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial message
    if (messages.length === 0) {
      setMessages([
        {
          id: "1",
          text: "Hello! I'm your AI companion. How can I help you today?",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const generateAIResponse = (userText: string) => {
    const text = userText.toLowerCase();
    const responses = [
      // ... (keep responses same, just typing function arg)
      "That's wonderful to hear! How can I assist you further?",
      "I understand. Would you like to talk more about that?",
      "I'm sorry to hear that. Remember I'm here to help.",
      "Interesting perspective! Tell me more about your thoughts on this.",
      "Let me think about how best to help with that...",
    ];

    if (text.includes("?") || text.includes("help")) {
      return "I'd be happy to help with that. Could you provide more details?";
    } else if (text.includes("sad") || text.includes("upset")) {
      return "I'm sorry you're feeling this way. Would it help to talk about what's bothering you?";
    } else if (text.includes("happy") || text.includes("excited")) {
      return "That's fantastic! It's great to hear you're feeling positive!";
    } else {
      return responses[Math.floor(Math.random() * responses.length)];
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate delay
    setTimeout(
      () => {
        const responseText = generateAIResponse(userMessage.text);
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: responseText,
          sender: "ai",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsLoading(false);
      },
      1000 + Math.random() * 500,
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full max-w-[900px] mx-auto animate-fade-in bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm relative">
      <div className="p-4 bg-white border-b border-slate-100 flex items-center gap-2">
        <Bot className="text-blue-600" size={24} />
        <h2 className="text-lg font-semibold text-slate-800 m-0">
          AI Companion
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scroll-smooth bg-slate-50/50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4 opacity-70">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-slate-400" />
            </div>
            <p>Start a conversation with your AI companion</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${msg.sender === "user" ? "self-end flex-row-reverse" : "self-start"}`}
            >
              {msg.sender === "ai" && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 bg-blue-600 shadow-sm">
                  <Bot size={16} />
                </div>
              )}

              <div className="flex flex-col max-w-full">
                <div
                  className={`p-3 rounded-2xl relative text-sm leading-relaxed shadow-sm ${msg.sender === "user" ? "bg-slate-800 text-white rounded-tr-none" : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"}`}
                >
                  {msg.text}
                  <div
                    className={`text-[10px] opacity-70 mt-1 text-right ${msg.sender === "user" ? "text-slate-300" : "text-slate-400"}`}
                  >
                    <span className="message-time">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              </div>

              {msg.sender === "user" && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 bg-slate-800 shadow-sm">
                  <User size={16} />
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-3 max-w-[85%] self-start animate-fade-in">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 bg-blue-600 shadow-sm">
              <Bot size={16} />
            </div>
            <div className="flex flex-col max-w-full">
              <div className="bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-tl-none p-4 flex items-center h-10 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0s]"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 bg-white border-t border-slate-100 flex gap-2 items-end">
        <textarea
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-sm resize-none min-h-[44px] max-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder:text-slate-400"
          placeholder="Type your message..."
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        ></textarea>
        <button
          className="w-11 h-11 bg-slate-900 text-white border-none rounded-xl flex items-center justify-center cursor-pointer transition-all hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
