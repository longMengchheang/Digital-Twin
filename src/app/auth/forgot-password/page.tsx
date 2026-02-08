"use client";

import { useState } from "react";
import axios from "axios";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await axios.post("/api/auth/forgot-password", { email });
      setMessage({ type: "success", text: res.data.msg || "Code sent. Redirecting to verification..." });
      
      // Redirect to reset password page with email
      setTimeout(() => {
        const params = new URLSearchParams();
        params.set("email", email);
        // Use window.location as router.push might be too fast or just strictly go there
        window.location.href = `/auth/reset-password?${params.toString()}`;
      }, 1000);

    } catch (error) {
      const msg = axios.isAxiosError(error) && error.response?.data?.msg
        ? String(error.response.data.msg)
        : "Failed to process request. Please try again.";
      setMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f8fc] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Mail className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Forgot Password?</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-calm w-full"
              placeholder="Email address"
            />
          </div>

          {message && (
            <div
              className={`rounded-md p-4 text-sm ${
                message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}
            >
              <p>{message.text}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-calm-primary group relative flex w-full justify-center py-3"
          >
            {loading ? "Sending..." : "Send Reset Link"}
            {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
          </button>
        </form>

        <div className="text-center">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
