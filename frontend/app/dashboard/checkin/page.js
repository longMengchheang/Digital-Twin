'use client';

import { useState, useEffect } from 'react';
import { Star, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import axios from 'axios';

export default function CheckInPage() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [responses, setResponses] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get('/api/checkin/questions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuestions(res.data.questions);
      setLoading(false);
    } catch (err) {
      if (err.response && err.response.status === 400) {
        setIsAlreadyCompleted(true);
      }
      setLoading(false);
    }
  };

  const handleRating = (rating) => {
    setSelectedRating(rating);
  };

  const handleSubmit = async () => {
    if (selectedRating === 0) return;

    const newResponses = [...responses, { question: questions[currentQuestionIndex], rating: selectedRating }];
    setResponses(newResponses);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedRating(0);
    } else {
      await submitCheckIn(newResponses);
    }
  };

  const submitCheckIn = async (finalResponses) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const ratings = finalResponses.map(r => r.rating);
      const res = await axios.post('/api/checkin/submit', { ratings }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const totalScore = ratings.reduce((a, b) => a + b, 0);
      const maxScore = questions.length * 5;
      const percentage = Math.round((totalScore / maxScore) * 100);

      setResult({ totalScore, maxScore, percentage });
      setIsCompleted(true);

      if (percentage >= 70) {
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      alert('Failed to submit check-in');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  if (isAlreadyCompleted) {
    return (
      <div className="w-full max-w-[600px] mx-auto animate-fade-in">
        <div className="bg-[hsl(210_25%_11%)] border border-[hsl(210_25%_16%)] rounded-xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-[hsl(210_25%_16%)]">
             <h2 className="text-xl font-bold text-[hsl(48_96%_50%)] m-0">Daily Check-In</h2>
          </div>
          <div className="p-6">
             <p className="text-[hsl(210_40%_98%)] text-lg">Daily check-in already completed today.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isCompleted && result) {
    let message = '';
    if (result.percentage >= 80) message = 'Excellent day! You\'re doing amazing!';
    else if (result.percentage >= 60) message = 'Good day! Keep up the good work!';
    else if (result.percentage >= 40) message = 'Average day. Tomorrow can be better!';
    else message = 'Challenging day. Remember, every day is a new opportunity.';

    return (
      <div className="w-full max-w-[600px] mx-auto animate-fade-in">
        <div className="bg-[hsl(210_25%_11%)] border border-[hsl(210_25%_16%)] rounded-xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-[hsl(210_25%_16%)]">
            <h2 className="text-xl font-bold text-[hsl(48_96%_50%)] m-0">Daily Check-In</h2>
          </div>
          <div className="p-6">
            <div className="flex flex-col items-center justify-center gap-4 py-8 animate-fade-in">
               <Check className="w-16 h-16 text-[hsl(120_100%_50%)]" />
               <span className="text-xl font-bold text-[hsl(120_100%_50%)]">Thanks for checking in today!</span>
            </div>
            <div className="flex flex-col gap-4 animate-fade-in mt-4 border-t border-[hsl(210_25%_16%)] pt-4">
              <div className="text-lg font-bold text-[hsl(210_40%_98%)] text-center">Overall Score: {result.totalScore}/{result.maxScore}</div>
              <div className="h-4 bg-[hsl(210_25%_16%)] rounded-full overflow-hidden relative">
                 <div className="h-full bg-[hsl(48_96%_50%)] transition-[width] duration-1000 ease-out" style={{ width: `${result.percentage}%` }}></div>
              </div>
              <div className="text-base text-[hsl(210_15%_65%)] text-center italic">{message}</div>
              <div className="mt-4 flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                {responses.map((r, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-[rgba(255,255,255,0.03)] rounded text-sm border-l-2 border-[hsl(48_96%_50%)]">
                    <span className="text-[hsl(210_40%_98%)] text-left flex-1 mr-4">{r.question}</span>
                    <span className="font-bold text-[hsl(48_96%_50%)]">{r.rating}/5</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[600px] mx-auto animate-fade-in">
      <div className="bg-[hsl(210_25%_11%)] border border-[hsl(210_25%_16%)] rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-[hsl(210_25%_16%)]">
           <h2 className="text-xl font-bold text-[hsl(48_96%_50%)] m-0">Daily Check-In</h2>
        </div>
        <div className="p-6">
          <div className="text-sm text-[hsl(210_15%_65%)] uppercase tracking-wider mb-4 font-medium text-center">
             Question {currentQuestionIndex + 1} of {questions.length}
          </div>
          <div className="text-xl text-[hsl(210_40%_98%)] mb-8 font-medium leading-relaxed min-h-[60px] flex items-center justify-center">
             {questions[currentQuestionIndex]}
          </div>
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className="bg-none border-none cursor-pointer p-1 transition-transform hover:scale-125 focus:outline-none group"
                onClick={() => handleRating(star)}
              >
                <Star
                  className={`w-10 h-10 transition-colors duration-200 ${star <= selectedRating ? 'text-[hsl(48_96%_50%)] fill-[hsl(48_96%_50%)]' : 'text-[hsl(210_25%_24%)] group-hover:text-[hsl(48_96%_50%)]'}`}
                />
              </button>
            ))}
          </div>
          <div className="flex justify-between px-4 mb-8 text-xs text-[hsl(210_15%_65%)] uppercase tracking-wide font-medium">
            <span>Poor</span>
            <span>Excellent</span>
          </div>
          <button
            className="w-full py-3 px-6 bg-[hsl(48_96%_50%)] text-[hsl(210_25%_8%)] border-none rounded-lg text-base font-bold uppercase tracking-wider cursor-pointer transition-all duration-200 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100"
            onClick={handleSubmit}
            disabled={selectedRating === 0 || submitting}
          >
            {submitting ? 'Calculating...' : (currentQuestionIndex < questions.length - 1 ? 'Next' : 'Submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
