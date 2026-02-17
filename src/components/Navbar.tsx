"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function calculate() {
      const now = new Date();
      const londonTime = new Date(
        now.toLocaleString("en-US", { timeZone: "Europe/London" })
      );
      const midnight = new Date(londonTime);
      midnight.setDate(midnight.getDate() + 1);
      midnight.setHours(0, 0, 0, 0);

      const diff = midnight.getTime() - londonTime.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      );
    }

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, []);

  return timeLeft;
}

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const countdown = useCountdown();

  return (
    <nav className="border-b-2 border-black bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image src="/logo.png" alt="Print" width={80} height={32} className="h-7 w-auto" priority />
        </Link>

        {session ? (
          <>
            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6 font-pixel text-lg uppercase">
              <Link href="/" className="hover:underline">
                Editions
              </Link>
              <Link href="/create" className="hover:underline">
                Write
              </Link>
              <Link href="/discover" className="hover:underline">
                Discover
              </Link>
              <Link
                href={`/profile/${(session.user as any).username}`}
                className="hover:underline"
              >
                Profile
              </Link>
              <Link href="/settings" className="hover:underline">
                Settings
              </Link>
              <button
                onClick={() => signOut()}
                className="hover:underline text-gray-500"
              >
                Logout
              </button>
            </div>

            {/* Countdown */}
            <div className="hidden md:block font-pixel text-sm text-gray-500">
              Next edition in: {countdown}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden font-pixel text-2xl"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? "×" : "≡"}
            </button>
          </>
        ) : (
          <div className="flex items-center gap-4 font-pixel text-lg uppercase">
            <Link href="/login" className="hover:underline">
              Login
            </Link>
            <Link
              href="/register"
              className="border-2 border-black px-3 py-1 hover:bg-black hover:text-white transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {menuOpen && session && (
        <div className="md:hidden border-t-2 border-black bg-white px-4 py-3 flex flex-col gap-3 font-pixel text-lg uppercase">
          <div className="text-sm text-gray-500 pb-2 border-b border-dashed border-gray-300">
            Next edition in: {countdown}
          </div>
          <Link href="/" onClick={() => setMenuOpen(false)}>
            Editions
          </Link>
          <Link href="/create" onClick={() => setMenuOpen(false)}>
            Write
          </Link>
          <Link href="/discover" onClick={() => setMenuOpen(false)}>
            Discover
          </Link>
          <Link
            href={`/profile/${(session.user as any).username}`}
            onClick={() => setMenuOpen(false)}
          >
            Profile
          </Link>
          <Link href="/settings" onClick={() => setMenuOpen(false)}>
            Settings
          </Link>
          <button
            onClick={() => signOut()}
            className="text-left text-gray-500"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
