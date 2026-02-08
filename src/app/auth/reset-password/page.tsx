"use client";

import { useState, Suspense } from "react";
import axios from "axios";
import { ArrowRight, Lock, Key } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { validatePassword } from "@/lib/validation";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setMessage({ type: "error", text: "Please enter a valid 6-digit code." });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    const validation = validatePassword(password);
    if (!validation.isValid) {
      setMessage({ type: "error", text: validation.message });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await axios.post("/api/auth/reset-password", {
        email: emailParam,
        otp,
        newPassword: password,
      });

      setMessage({ type: "success", text: res.data.msg || "Password reset successfully. Redirecting..." });
      
      setTimeout(() => {
        router.push("/");
      }, 2000);
      
    } catch (error) {
      const msg = axios.isAxiosError(error) && error.response?.data?.msg
        ? String(error.response.data.msg)
        : "Failed to reset password. Code may be invalid or expired.";
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
            <Key className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Set New Password</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter the 6-digit code sent to <strong>{emailParam}</strong> and your new password.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="input-calm w-full text-center text-lg tracking-widest"
                placeholder="123456"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-calm w-full"
                placeholder="New password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-calm w-full"
                placeholder="Confirm new password"
              />
            </div>
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
            {loading ? "Resetting..." : "Reset Password"}
            {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
          </button>
        </form>
         <div className="text-center">
            <Link href="/auth/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Resend Code
            </Link>
          </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
