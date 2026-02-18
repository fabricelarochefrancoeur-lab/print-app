"use client";

import { useState, useEffect } from "react";

export default function ClipButton({ printId }: { printId: string }) {
  const [clipped, setClipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/prints/${printId}/clip`)
      .then((r) => r.json())
      .then((data) => {
        setClipped(data.clipped);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [printId]);

  const toggleClip = async () => {
    const res = await fetch(`/api/prints/${printId}/clip`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setClipped(data.clipped);
    }
  };

  if (loading) {
    return <div className="h-8" />;
  }

  return (
    <button
      onClick={toggleClip}
      className={`font-pixel text-sm border-2 px-3 py-1 transition-colors ${
        clipped
          ? "border-black bg-black text-white"
          : "border-black hover:bg-black hover:text-white"
      }`}
    >
      {clipped ? "CLIPPED" : "CLIP"}
    </button>
  );
}
