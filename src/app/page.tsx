"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EditionHeader from "@/components/EditionHeader";
import PrintCard from "@/components/PrintCard";
import Link from "next/link";
import Image from "next/image";

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

function EditionIcon({
  date,
  printCount,
  isUpcoming,
  isSelected,
  countdown,
  onClick,
}: {
  date: string;
  printCount: number;
  isUpcoming: boolean;
  isSelected: boolean;
  countdown: string;
  onClick: () => void;
}) {
  const d = new Date(date);
  const day = d.getDate();
  const month = d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase();
  const year = d.getFullYear();

  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 w-28 border-2 transition-all ${
        isSelected
          ? "border-black bg-black text-white scale-105"
          : "border-black bg-white text-black hover:bg-gray-100"
      }`}
    >
      <div className="border-b border-current px-2 py-1 flex justify-center">
        <Image src="/logo.png" alt="Print" width={60} height={20} className={`h-3.5 w-auto ${isSelected ? "invert" : ""}`} />
      </div>
      <div className="px-2 py-3 text-center">
        <p className="font-mono text-3xl font-bold leading-none">{day}</p>
        <p className="font-pixel text-sm mt-1">{month}</p>
        <p className="font-pixel text-[10px] opacity-60">{year}</p>
      </div>
      <div className="border-t border-current px-2 py-1 text-center">
        {isUpcoming ? (
          <p className="font-pixel text-[10px] animate-pulse">{countdown}</p>
        ) : (
          <p className="font-pixel text-[10px]">
            {printCount} print{printCount !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </button>
  );
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [editions, setEditions] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [prints, setPrints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [printsLoading, setPrintsLoading] = useState(false);
  const countdown = useCountdown();

  const today = new Date().toISOString().split("T")[0];
  // The upcoming edition is tomorrow's date (publishes at midnight)
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().split("T")[0];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetch("/api/editions")
        .then((res) => res.json())
        .then((data) => {
          const eds = Array.isArray(data) ? data : [];
          setEditions(eds);

          // Auto-select the upcoming edition (tomorrow)
          selectEdition(tomorrow);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router, tomorrow]);

  const selectEdition = (date: string) => {
    setSelectedDate(date);
    setPrintsLoading(true);
    fetch(`/api/editions?date=${date}`)
      .then((res) => res.json())
      .then((data) => {
        setPrints(data.prints || []);
        setPrintsLoading(false);
      })
      .catch(() => setPrintsLoading(false));
  };

  if (status === "loading" || loading) {
    return (
      <div className="text-center py-20 font-pixel text-xl animate-pulse">
        Loading editions...
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  // Build list: upcoming (tomorrow) + past editions
  const editionItems: { date: string; printCount: number; isUpcoming: boolean }[] = [];

  // Always add the upcoming edition first (tomorrow's date)
  editionItems.push({
    date: tomorrow,
    printCount: 0,
    isUpcoming: true,
  });

  // Add past editions
  for (const ed of editions) {
    const edDate = new Date(ed.date).toISOString().split("T")[0];
    if (edDate === tomorrow) continue;
    editionItems.push({
      date: edDate,
      printCount: ed._count?.editionPrint || 0,
      isUpcoming: false,
    });
  }

  return (
    <div>
      {/* Edition icons - scrollable grid */}
      <div className="mb-8">
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide flex-wrap justify-center">
          {editionItems.map((item) => (
            <EditionIcon
              key={item.date}
              date={item.date}
              printCount={item.printCount}
              isUpcoming={item.isUpcoming}
              isSelected={selectedDate === item.date}
              countdown={countdown}
              onClick={() => selectEdition(item.date)}
            />
          ))}
        </div>
      </div>

      {/* Selected edition content */}
      {selectedDate && (
        <>
          <EditionHeader
            date={selectedDate}
            printCount={prints.length}
          />

          {printsLoading ? (
            <div className="text-center py-16 font-pixel text-xl animate-pulse">
              Loading...
            </div>
          ) : prints.length === 0 ? (
            <div className="text-center py-16">
              {selectedDate === tomorrow ? (
                <>
                  <p className="font-pixel text-xl text-gray-500 mb-4">
                    This edition will be published tonight at midnight London time
                  </p>
                  <p className="font-pixel text-lg text-gray-400 mb-8">
                    Follow users to receive their PRINTs in your daily edition.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Link
                      href="/discover"
                      className="font-pixel text-lg border-2 border-black px-6 py-2 hover:bg-black hover:text-white transition-colors"
                    >
                      Discover
                    </Link>
                    <Link
                      href="/create"
                      className="font-pixel text-lg border-2 border-black px-6 py-2 hover:bg-black hover:text-white transition-colors"
                    >
                      Write a PRINT
                    </Link>
                  </div>
                </>
              ) : (
                <p className="font-pixel text-xl text-gray-500 mb-4">
                  No PRINTs in this edition.
                </p>
              )}
            </div>
          ) : (
            <div className="columns-1 md:columns-2 gap-6">
              {prints.map((print: any) => (
                <PrintCard key={print.id} print={print} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
