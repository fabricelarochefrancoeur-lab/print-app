"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="text-center mb-8">
        <h1 className="font-mono text-4xl mb-2">PRINT</h1>
        <p className="font-pixel text-lg text-gray-500">
          Sign in to read today&apos;s edition
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-2 border-black p-6 space-y-4"
      >
        {error && (
          <div className="font-pixel text-sm text-red-600 border border-red-600 p-2">
            {error}
          </div>
        )}

        <div>
          <label className="block font-mono text-sm mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border-2 border-black px-3 py-2 font-pixel text-lg focus:outline-none focus:ring-2 focus:ring-black"
            required
          />
        </div>

        <div>
          <label className="block font-mono text-sm mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border-2 border-black px-3 py-2 font-pixel text-lg focus:outline-none focus:ring-2 focus:ring-black"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full font-mono text-lg border-2 border-black px-4 py-2 hover:bg-black hover:text-white transition-colors disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="text-center font-pixel text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="underline text-black">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
}
