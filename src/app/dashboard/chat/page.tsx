"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Clock3, History, MessageCircle, Plus, Send, Shield, User } from "lucide-react";

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface ServerMessage {
  id?: string;
  role: "user" | "ai" | "system";
  content: string;
  timestamp: string;
}

interface ChatSummary {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  messageCount: number;
}

const ACTIVE_CHAT_STORAGE_KEY = "digital_twin_active_chat_id";

const quickPrompts = [
  "How am I doing this week?",
  "I need focus advice",
  "I feel stressed today",
];

const introMessage: ChatMessage = {
  id: "intro",
  text: "I am your companion for this journey. What would you like to work through right now?",
  sender: "ai",
  timestamp: new Date(),
};

function toUiMessage(message: ServerMessage, fallbackId: string): ChatMessage | null {
  if (message.role !== "user" && message.role !== "ai") {
    return null;
  }

  return {
    id: message.id || fallbackId,
    text: String(message.content || ""),
    sender: message.role,
    timestamp: new Date(message.timestamp || Date.now()),
  };
}

function formatHistoryTime(value: string): string {
  const date = new Date(value);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CompanionPage() {
  const router = useRouter();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyChats, setHistoryChats] = useState<ChatSummary[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [historyLoadingId, setHistoryLoadingId] = useState<string | null>(null);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const historyPanelRef = useRef<HTMLDivElement>(null);
  const shouldScrollToBottomRef = useRef(true);

  useEffect(() => {
    void initializeChatPage();
  }, []);

  useEffect(() => {
    if (shouldScrollToBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      shouldScrollToBottomRef.current = true;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (!historyPanelOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!historyPanelRef.current) return;
      if (!historyPanelRef.current.contains(event.target as Node)) {
        setHistoryPanelOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [historyPanelOpen]);

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  };

  const startNewSession = (clearInput = true) => {
    sessionStorage.removeItem(ACTIVE_CHAT_STORAGE_KEY);
    setActiveChatId(null);
    setMessages([introMessage]);
    if (clearInput) {
      setInput("");
    }
    setErrorMessage("");
    setHistoryPanelOpen(false);
  };

  const fetchHistoryChats = async (headers: Record<string, string>) => {
    const response = await axios.get("/api/chat/history", { headers });
    const rawChats = Array.isArray(response.data?.chats) ? (response.data.chats as ChatSummary[]) : [];
    setHistoryChats(rawChats);
    return rawChats;
  };

  const loadConversationById = async (chatId: string, headers: Record<string, string>) => {
    const response = await axios.get("/api/chat/history", {
      headers,
      params: { chatId },
    });

    const rawMessages = Array.isArray(response.data?.messages) ? (response.data.messages as ServerMessage[]) : [];
    const pagination = response.data?.pagination || {};

    setHasMoreMessages(!!pagination.hasMore);
    setNextCursor(pagination.nextCursor || null);

    const parsedMessages = rawMessages
      .map((message, index) => toUiMessage(message, `history-${index}`))
      .filter((message): message is ChatMessage => Boolean(message));

    setMessages(parsedMessages.length ? parsedMessages : [introMessage]);
    setActiveChatId(chatId);
    sessionStorage.setItem(ACTIVE_CHAT_STORAGE_KEY, chatId);
    shouldScrollToBottomRef.current = true;
  };

  const loadMoreMessages = async () => {
    if (!nextCursor || loadingMore || !activeChatId) return;

    const headers = authHeaders();
    if (!headers) return;

    setLoadingMore(true);
    try {
      const response = await axios.get("/api/chat/history", {
        headers,
        params: { chatId: activeChatId, cursor: nextCursor },
      });

      const rawMessages = Array.isArray(response.data?.messages) ? (response.data.messages as ServerMessage[]) : [];
      const pagination = response.data?.pagination || {};

      setHasMoreMessages(!!pagination.hasMore);
      setNextCursor(pagination.nextCursor || null);

      const parsedMessages = rawMessages
        .map((message, index) => toUiMessage(message, `history-more-${Date.now()}-${index}`))
        .filter((message): message is ChatMessage => Boolean(message));

      if (parsedMessages.length > 0) {
        shouldScrollToBottomRef.current = false;
        setMessages((prev) => [...parsedMessages, ...prev]);
      }
    } catch (error) {
      console.error("Failed to load more messages", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const initializeChatPage = async () => {
    const headers = authHeaders();
    if (!headers) {
      router.push("/");
      return;
    }

    try {
      await fetchHistoryChats(headers);

      const storedActiveChatId = sessionStorage.getItem(ACTIVE_CHAT_STORAGE_KEY);
      if (storedActiveChatId) {
        try {
          await loadConversationById(storedActiveChatId, headers);
        } catch {
          startNewSession(false);
        }
      } else {
        startNewSession(false);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push("/");
        return;
      }

      startNewSession(false);
      setErrorMessage("Unable to load chat history right now.");
    } finally {
      setBootstrapping(false);
    }
  };

  const openHistoryChat = async (chatId: string) => {
    const headers = authHeaders();
    if (!headers) {
      router.push("/");
      return;
    }

    setHistoryLoadingId(chatId);
    try {
      await loadConversationById(chatId, headers);
      setErrorMessage("");
      setHistoryPanelOpen(false);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push("/");
        return;
      }

      setErrorMessage("Unable to open this conversation.");
    } finally {
      setHistoryLoadingId(null);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const headers = authHeaders();
    if (!headers) {
      router.push("/");
      return;
    }

    const outgoingText = input.trim();
    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      text: outgoingText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await axios.post(
        "/api/chat/send",
        { message: outgoingText, chatId: activeChatId },
        { headers },
      );

      const reply = String(response.data?.reply || "").trim();
      const resolvedChatId = String(response.data?.chatId || "").trim();
      if (!reply) {
        throw new Error("Empty AI response.");
      }

      if (resolvedChatId && resolvedChatId !== activeChatId) {
        setActiveChatId(resolvedChatId);
        sessionStorage.setItem(ACTIVE_CHAT_STORAGE_KEY, resolvedChatId);
      }

      const aiMessage: ChatMessage = {
        id: `${Date.now()}-ai`,
        text: reply,
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((current) => [...current, aiMessage]);
      await fetchHistoryChats(headers);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push("/");
        return;
      }

      const serverMessage =
        axios.isAxiosError(error) && typeof error.response?.data?.msg === "string"
          ? error.response.data.msg
          : "Message failed to send.";
      setErrorMessage(serverMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-5.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_42px_-30px_rgba(15,23,42,0.6)] animate-fade-in">
      <header className="relative flex items-center justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-[#eef2ff] to-[#f7f4ff] px-5 py-4 text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-white">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Companion</h1>
            <p className="text-xs text-slate-500">
              {activeChatId ? "Active conversation in this tab" : "New conversation"}
            </p>
          </div>
        </div>

        <div ref={historyPanelRef} className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => startNewSession()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-700"
          >
            <Plus className="h-3.5 w-3.5" />
            New Chat
          </button>

          <button
            type="button"
            onClick={() => setHistoryPanelOpen((value) => !value)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-700"
          >
            <History className="h-3.5 w-3.5" />
            History
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
              {historyChats.length}
            </span>
          </button>

          {historyPanelOpen && (
            <div className="absolute right-0 top-10 z-20 max-h-80 w-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              {historyChats.length ? (
                <div className="space-y-1">
                  {historyChats.map((chat) => (
                    <button
                      key={chat.id}
                      type="button"
                      onClick={() => {
                        void openHistoryChat(chat.id);
                      }}
                      className={[
                        "w-full rounded-lg border px-3 py-2 text-left transition-colors",
                        chat.id === activeChatId
                          ? "border-blue-200 bg-blue-50"
                          : "border-transparent hover:border-slate-200 hover:bg-slate-50",
                      ].join(" ")}
                      disabled={historyLoadingId === chat.id}
                    >
                      <p className="truncate text-xs font-semibold text-slate-900">{chat.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">{chat.preview}</p>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3 w-3" />
                          {formatHistoryTime(chat.updatedAt)}
                        </span>
                        <span>{chat.messageCount} msg</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="px-2 py-4 text-center text-xs text-slate-500">No previous chats yet.</p>
              )}
            </div>
          )}
        </div>
      </header>

      {errorMessage && (
        <div className="border-b border-orange-200 bg-orange-50 px-5 py-2 text-left text-xs text-orange-700">
          {errorMessage}
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50/40 to-white px-4 py-5">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          {hasMoreMessages && !bootstrapping && (
            <button
              onClick={() => void loadMoreMessages()}
              disabled={loadingMore}
              className="mx-auto mb-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
            >
              {loadingMore ? "Loading..." : "Load Older Messages"}
            </button>
          )}
          {bootstrapping ? (
            <p className="text-sm text-slate-500">Loading conversation...</p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={[
                  "flex items-end gap-2",
                  message.sender === "user" ? "justify-end" : "justify-start",
                ].join(" ")}
              >
                {message.sender === "ai" && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={[
                    "max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                    message.sender === "user"
                      ? "rounded-br-md bg-blue-600 text-white"
                      : "rounded-bl-md border border-slate-200 bg-white text-slate-800",
                  ].join(" ")}
                >
                  <p>{message.text}</p>
                  <p
                    className={[
                      "mt-2 text-[10px]",
                      message.sender === "user" ? "text-blue-100" : "text-slate-400",
                    ].join(" ")}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                {message.sender === "user" && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-white">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex items-end gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="typing-dot h-2 w-2 rounded-full bg-violet-500" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-violet-500" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-violet-500" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50 px-4 py-2">
        <div className="mx-auto flex w-full max-w-3xl gap-2 overflow-x-auto">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setInput(prompt)}
              className="whitespace-nowrap rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex w-full max-w-3xl items-end gap-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write what is on your mind..."
            className="min-h-[52px] max-h-[140px] flex-1 resize-none rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-blue-400"
            rows={1}
          />

          <button
            type="button"
            onClick={() => {
              void handleSend();
            }}
            disabled={!input.trim() || isLoading || bootstrapping}
            className="btn-calm-primary flex h-12 w-12 items-center justify-center rounded-2xl p-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
