"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { History as HistoryIcon } from "lucide-react";

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      // Mock history if API fails/not implemented
      try {
        const res = await axios.get("/api/checkin/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHistory(res.data);
      } catch (e) {
        // fallback mock
        setHistory([
          { date: new Date(), overallScore: "85% (Mock)" },
          { date: new Date(Date.now() - 86400000), overallScore: "70% (Mock)" },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[800px] mx-auto animate-fade-in">
      <div className="flex flex-col gap-6">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
          <h2 className="text-xl font-bold text-slate-800 m-0 p-4 border-b border-slate-100 flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-slate-500" />
            Check-In History
          </h2>
          <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
            {loading ? (
              <p className="text-slate-500">Loading...</p>
            ) : history.length === 0 ? (
              <p className="text-slate-500">No history yet.</p>
            ) : (
              history.map((item, index) => (
                <div
                  key={index}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 text-left transition-transform hover:shadow-sm"
                >
                  <div className="text-slate-800 mb-1">
                    <strong>Date:</strong>{" "}
                    {new Date(item.date).toLocaleDateString()}
                  </div>
                  <div className="text-slate-600">
                    <strong>Score:</strong> {item.overallScore}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
