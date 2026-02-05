'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { History as HistoryIcon } from 'lucide-react';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get('/api/checkin/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[800px] mx-auto animate-fade-in">
      <div className="flex flex-col gap-6">
        <div className="bg-[hsl(210_25%_11%)] border border-[hsl(210_25%_16%)] rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
          <h2 className="text-xl font-bold text-[hsl(84_81%_44%)] m-0 p-4 border-b border-[hsl(210_25%_16%)] flex items-center gap-2">
            <HistoryIcon className="w-5 h-5" />
            Check-In History
          </h2>
          <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
             {loading ? <p className="text-[hsl(210_15%_65%)]">Loading...</p> : history.length === 0 ? <p className="text-[hsl(210_15%_65%)]">No history yet.</p> : (
               history.map((item, index) => (
                 <div key={index} className="bg-[hsl(210_25%_11%)] border border-[hsl(210_25%_16%)] rounded-xl p-4 mb-4 text-left transition-transform hover:-translate-y-1 hover:shadow-md">
                    <div className="text-[hsl(210_40%_98%)] mb-1"><strong>Date:</strong> {new Date(item.date).toLocaleDateString()}</div>
                    <div className="text-[hsl(210_40%_98%)]"><strong>Score:</strong> {item.overallScore}</div>
                 </div>
               ))
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
