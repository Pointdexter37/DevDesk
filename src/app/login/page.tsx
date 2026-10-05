"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Unable to sign in.");
      }
      router.replace("/");
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f1ea] px-5 text-[#151515]">
      <form className="w-full max-w-sm rounded-3xl border border-black/10 bg-[#fbfaf7] p-8" onSubmit={submit}>
        <p className="text-sm font-medium text-[#77736c]">Private workspace</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">Sign in to DevDesk</h1>
        <label className="mt-8 block text-sm font-medium text-[#53606c]">
          Password
          <input className="mt-2 w-full rounded-xl border border-black/15 bg-transparent px-4 py-3 outline-none focus:border-black" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoFocus required />
        </label>
        {error ? <p className="mt-3 text-sm font-medium text-[#9f2d3d]">{error}</p> : null}
        <button className="mt-6 w-full rounded-xl bg-[#151515] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
