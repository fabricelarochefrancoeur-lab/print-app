"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PrintCard from "@/components/PrintCard";

export default function ClippingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [prints, setPrints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      fetch("/api/clippings")
        .then((r) => r.json())
        .then((data) => {
          setPrints(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  if (status !== "authenticated" || loading) {
    return (
      <div className="text-center py-20 font-pixel text-xl animate-pulse">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-mono text-2xl font-bold mb-6 border-b-2 border-black pb-2 uppercase">
        My Clippings
      </h1>

      {prints.length === 0 ? (
        <p className="font-pixel text-lg text-gray-500">
          No clippings yet. Clip PRINTs to save them here.
        </p>
      ) : (
        <div>
          {prints.map((print, index) => (
            <div key={print.id}>
              <div className="font-pixel text-xs text-gray-400 mb-1">
                #{index + 1} — Clipped: {print.clippedAt ? new Date(print.clippedAt).toLocaleString() : "unknown"}
              </div>
              <PrintCard print={print} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
