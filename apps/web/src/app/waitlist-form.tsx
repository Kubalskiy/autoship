"use client";

import { useState } from "react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/api/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message || "You're on the list!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="mt-8 rounded-lg border border-emerald-800 bg-emerald-950/50 px-6 py-4">
        <p className="text-sm font-medium text-emerald-400">{message}</p>
        <p className="mt-1 text-xs text-gray-400">We&apos;ll be in touch soon.</p>
      </div>
    );
  }

  return (
    <form
      className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
      onSubmit={handleSubmit}
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none sm:w-80"
        required
        disabled={status === "loading"}
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-gray-200 disabled:opacity-50 sm:w-auto"
      >
        {status === "loading" ? "Joining..." : "Join Waitlist"}
      </button>
      {status === "error" && (
        <p className="w-full text-xs text-red-400 sm:w-auto">{message}</p>
      )}
    </form>
  );
}
