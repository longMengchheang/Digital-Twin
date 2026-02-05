'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard/checkin');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage('Email and password are required');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await axios.post(endpoint, { email, password });

      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        if (!isLogin) {
             setMessage('Registration successful! Redirecting...');
             setTimeout(() => router.push('/dashboard/checkin'), 1000);
        } else {
             router.push('/dashboard/checkin');
        }
      }
    } catch (err) {
      const msg = err.response?.data?.msg || (isLogin ? 'Login failed' : 'Registration failed');
      setMessage(msg);
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen w-full bg-[hsl(210_25%_11%)]">
       <div className="bg-[hsla(0,0%,0%,0.285)] p-10 rounded-[20px] text-center w-[300px] shadow-[0_2px_10px_hsla(0,0%,0%,0.037)] z-[1001]">
          <h2 className="mb-[15px] text-[hsl(84_81%_44%)] text-xl font-bold">
            {isLogin ? 'Login to Digital Twin' : 'Register for Digital Twin'}
          </h2>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="my-[10px] p-[8px] w-full border border-[#ccc] rounded text-black"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="my-[10px] p-[8px] w-full border border-[#ccc] rounded text-black"
            />
            <button
              type="submit"
              disabled={loading}
              className={`p-[8px_16px] w-full border-none cursor-pointer mt-[10px] rounded text-white hover:brightness-75 transition-all ${isLogin ? 'bg-[hsl(120,100%,50%)]' : 'bg-[hsl(84_81%_44%)]'}`}
            >
              {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
            </button>
          </form>
          <p className={`mt-[10px] ${message.includes('successful') ? 'text-green-500' : 'text-red-500'}`}>{message}</p>
          <p className="mt-[10px] text-gray-300">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setIsLogin(!isLogin); setMessage(''); }}
              className="text-[hsl(210_100%_50%)] no-underline hover:underline"
            >
              {isLogin ? 'Register' : 'Login'}
            </a>
          </p>
       </div>
    </div>
  );
}
