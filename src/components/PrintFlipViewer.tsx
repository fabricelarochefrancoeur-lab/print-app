"use client";

import { useState, useEffect, useCallback, useRef, ReactNode } from "react";

interface PrintFlipViewerProps {
  prints: any[];
  renderCard: (print: any) => ReactNode;
}

export default function PrintFlipViewer({ prints, renderCard }: PrintFlipViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animClass, setAnimClass] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(0);
  const touchStartX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset index when prints change
  useEffect(() => {
    setCurrentIndex(0);
    setDisplayIndex(0);
    setAnimClass("");
    setIsAnimating(false);
  }, [prints]);

  const goTo = useCallback(
    (newIndex: number, direction: "left" | "right") => {
      if (isAnimating || newIndex < 0 || newIndex >= prints.length) return;
      setIsAnimating(true);

      // Phase 1: flip out
      const outClass = direction === "right" ? "flip-out-right" : "flip-out-left";
      setAnimClass(outClass);

      setTimeout(() => {
        // Swap content at midpoint
        setDisplayIndex(newIndex);
        setCurrentIndex(newIndex);

        // Phase 2: flip in
        const inClass = direction === "right" ? "flip-in-right" : "flip-in-left";
        setAnimClass(inClass);

        setTimeout(() => {
          setAnimClass("");
          setIsAnimating(false);
        }, 250);
      }, 250);
    },
    [isAnimating, prints.length]
  );

  const goPrev = useCallback(() => {
    if (currentIndex > 0) goTo(currentIndex - 1, "left");
  }, [currentIndex, goTo]);

  const goNext = useCallback(() => {
    if (currentIndex < prints.length - 1) goTo(currentIndex + 1, "right");
  }, [currentIndex, prints.length, goTo]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goPrev, goNext]);

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) goNext();
      else goPrev();
    }
  };

  if (prints.length === 0) return null;

  const animStyle: React.CSSProperties = animClass
    ? { animation: `${animClass} 250ms ease-in-out forwards` }
    : {};

  return (
    <div
      ref={containerRef}
      className="flip-perspective"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Navigation header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0 || isAnimating}
          className="font-mono text-2xl px-3 py-1 border-2 border-black hover:bg-black hover:text-white transition-colors disabled:opacity-20 disabled:hover:bg-white disabled:hover:text-black"
        >
          &larr;
        </button>

        <span className="font-pixel text-sm text-gray-500">
          {currentIndex + 1} / {prints.length}
        </span>

        <button
          onClick={goNext}
          disabled={currentIndex === prints.length - 1 || isAnimating}
          className="font-mono text-2xl px-3 py-1 border-2 border-black hover:bg-black hover:text-white transition-colors disabled:opacity-20 disabled:hover:bg-white disabled:hover:text-black"
        >
          &rarr;
        </button>
      </div>

      {/* Flip container */}
      <div style={{ ...animStyle, transformOrigin: "center center" }}>
        {renderCard(prints[displayIndex])}
      </div>

      {/* Dot indicators for <= 12 prints */}
      {prints.length > 1 && prints.length <= 12 && (
        <div className="flex justify-center gap-2 mt-4">
          {prints.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (i !== currentIndex && !isAnimating) {
                  goTo(i, i > currentIndex ? "right" : "left");
                }
              }}
              className={`w-2.5 h-2.5 border border-black transition-colors ${
                i === currentIndex ? "bg-black" : "bg-white hover:bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
