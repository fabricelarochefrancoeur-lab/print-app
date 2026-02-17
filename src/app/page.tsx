"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EditionHeader from "@/components/EditionHeader";
import PrintFlipViewer from "@/components/PrintFlipViewer";
import Link from "next/link";
import Image from "next/image";
import EditionCarousel from "@/components/EditionCarousel";

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
  editionNumber,
  onClick,
}: {
  date: string;
  printCount: number;
  isUpcoming: boolean;
  isSelected: boolean;
  countdown: string;
  editionNumber?: number;
  onClick: () => void;
}) {
  const d = new Date(date);
  const day = d.getDate();
  const month = d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase();
  const year = d.getFullYear();

  if (isUpcoming) {
    const [h, m, s] = countdown.split(":");
    return (
      <div className="flex flex-col items-center flex-shrink-0">
        <p className="font-pixel text-sm text-gray-500 mb-3">Next edition drops in...</p>
        <button
          onClick={onClick}
          className={`relative flex-shrink-0 w-32 overflow-hidden transition-all ${isSelected ? "scale-105" : "hover:scale-105"}`}
        >
          <Image src="/magazine.png" alt="" width={256} height={320} className="w-full h-auto" />
          <div className="absolute inset-0 flex flex-col items-center justify-start gap-1 py-[12%] px-[12%]">
            <div className="flex items-center gap-1.5">
              <Image src="/logo.png" alt="Print" width={80} height={28} className="h-5 w-auto" />
              {editionNumber && <span className="font-pixel text-base text-black font-bold">#{editionNumber}</span>}
            </div>
            <div className="text-center flex flex-col items-center">
              <p className="font-mono text-4xl font-bold leading-none">{day}</p>
              <p className="font-pixel text-sm leading-none">{month}</p>
              <p className="font-pixel text-[10px] leading-none opacity-50">{year}</p>
            </div>
            <div className="flex items-center gap-1 font-mono text-[10px] font-bold">
              <span>{h}</span>
              <span className="animate-pulse">:</span>
              <span>{m}</span>
              <span className="animate-pulse">:</span>
              <span>{s}</span>
            </div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`relative flex-shrink-0 w-32 overflow-hidden transition-all ${isSelected ? "scale-105" : "hover:scale-105"}`}
    >
      <Image src="/magazine.png" alt="" width={256} height={320} className="w-full h-auto" />
      <div className="absolute inset-0 flex flex-col items-center justify-start gap-1 py-[12%] px-[12%]">
        <div className="flex items-center gap-1.5">
          <Image src="/logo.png" alt="Print" width={80} height={28} className="h-5 w-auto" />
          {editionNumber && <span className="font-pixel text-base text-black font-bold">#{editionNumber}</span>}
        </div>
        <div className="text-center flex flex-col items-center">
          <p className="font-mono text-4xl font-bold leading-none">{day}</p>
          <p className="font-pixel text-sm leading-none">{month}</p>
          <p className="font-pixel text-[10px] leading-none opacity-50">{year}</p>
        </div>
        <p className="font-pixel text-[9px]">
          {printCount} print{printCount !== 1 ? "s" : ""}
        </p>
      </div>
    </button>
  );
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [editions, setEditions] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [openedDate, setOpenedDate] = useState<string | null>(null);
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

          // Auto-focus the upcoming edition (tomorrow) without opening
          setSelectedDate(tomorrow);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router, tomorrow]);

  // Step 1: select/focus a magazine in the carousel (no fetch)
  const selectEdition = (date: string) => {
    setSelectedDate(date);
    // Close any opened edition when navigating
    setOpenedDate(null);
    setPrints([]);
  };

  // Step 2: open a magazine (fetch its prints)
  const openEdition = (date: string) => {
    setSelectedDate(date);
    setOpenedDate(date);
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

  // Build list: oldest at top → most recent → upcoming at bottom
  const editionItems: { date: string; printCount: number; isUpcoming: boolean; editionNumber: number }[] = [];

  // Count past editions (excluding tomorrow)
  const pastEditions = editions.filter((ed) => {
    const edDate = new Date(ed.date).toISOString().split("T")[0];
    return edDate !== tomorrow;
  });

  // Add past editions in reverse: oldest first (#1 at top), most recent last
  for (let i = pastEditions.length - 1; i >= 0; i--) {
    const ed = pastEditions[i];
    const edDate = new Date(ed.date).toISOString().split("T")[0];
    editionItems.push({
      date: edDate,
      printCount: ed._count?.editionPrint || 0,
      isUpcoming: false,
      editionNumber: pastEditions.length - i,
    });
  }

  // Upcoming edition last (bottom of carousel)
  editionItems.push({
    date: tomorrow,
    printCount: 0,
    isUpcoming: true,
    editionNumber: pastEditions.length + 1,
  });

  return (
    <div>
      {/* Edition carousel - 3D vertical roulette */}
      {!openedDate && (
        <div className="mb-8">
          <EditionCarousel
            items={editionItems}
            selectedDate={selectedDate}
            countdown={countdown}
            onSelect={selectEdition}
            onOpen={openEdition}
            renderItem={(item, isCenter) => (
              <EditionIcon
                date={item.date}
                printCount={item.printCount}
                isUpcoming={item.isUpcoming}
                isSelected={isCenter}
                countdown={countdown}
                editionNumber={item.editionNumber}
                onClick={() => {}}
              />
            )}
          />
          {/* Hint text */}
          {selectedDate && (
            <p className="text-center font-pixel text-xs text-gray-400 mt-2">
              Tap the magazine to open it
            </p>
          )}
        </div>
      )}

      {/* Opened edition content */}
      {openedDate && (
        <div>
          {/* Back button to return to carousel */}
          <button
            onClick={() => {
              setOpenedDate(null);
              setPrints([]);
            }}
            className="font-pixel text-sm text-gray-500 hover:text-black transition-colors mb-4 flex items-center gap-1"
          >
            &larr; Back to editions
          </button>

          {openedDate === tomorrow ? (
            <div className="text-center py-16">
              <img
                src="/London.png"
                alt="Big Ben"
                className="mx-auto mb-6 h-48 object-contain"
              />
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
            </div>
          ) : (
            <>
              {printsLoading ? (
                <div className="text-center py-16 font-pixel text-xl animate-pulse">
                  Loading...
                </div>
              ) : prints.length === 0 ? (
                <div className="text-center py-16">
                  <p className="font-pixel text-xl text-gray-500 mb-4">
                    No PRINTs yet.
                  </p>
                  <p className="font-pixel text-lg text-gray-400">
                    Follow users or write your first PRINT.
                  </p>
                </div>
              ) : (
                <PrintFlipViewer
                  prints={prints}
                  date={openedDate}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
