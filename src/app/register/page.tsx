"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username, displayName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }

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
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="text-center mb-8">
        <h1 className="font-mono text-4xl mb-2">PRINT</h1>
        <p className="font-pixel text-lg text-gray-500">
          Join the daily newspaper
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
          <label className="block font-mono text-sm mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            className="w-full border-2 border-black px-3 py-2 font-pixel text-lg focus:outline-none focus:ring-2 focus:ring-black"
            required
            placeholder="your_username"
          />
        </div>

        <div>
          <label className="block font-mono text-sm mb-1">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full border-2 border-black px-3 py-2 font-pixel text-lg focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Your Name"
          />
        </div>

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
            minLength={6}
          />
          <p className="font-pixel text-xs text-gray-400 mt-1">
            6 characters minimum
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full font-mono text-lg border-2 border-black px-4 py-2 hover:bg-black hover:text-white transition-colors disabled:opacity-50"
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>

        <p className="text-center font-pixel text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="underline text-black">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
