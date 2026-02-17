"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface EditionItem {
  date: string;
  printCount: number;
  isUpcoming: boolean;
  editionNumber: number;
}

interface EditionCarouselProps {
  items: EditionItem[];
  selectedDate: string | null;
  countdown: string;
  onSelect: (date: string) => void;
  onOpen: (date: string) => void;
  renderItem: (item: EditionItem, isCenter: boolean) => React.ReactNode;
}

export default function EditionCarousel({
  items,
  selectedDate,
  countdown,
  onSelect,
  onOpen,
  renderItem,
}: EditionCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(() => {
    // Start at last item (bottom = most recent/upcoming)
    return items.length > 0 ? items.length - 1 : 0;
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const lastWheelTime = useRef(0);

  // Sync activeIndex when selectedDate changes externally
  useEffect(() => {
    if (selectedDate) {
      const idx = items.findIndex((item) => item.date === selectedDate);
      if (idx !== -1 && idx !== activeIndex) {
        setActiveIndex(idx);
      }
    }
  }, [selectedDate, items]);

  const navigate = useCallback(
    (direction: 1 | -1) => {
      if (isAnimating) return;
      const newIndex = activeIndex + direction;
      if (newIndex < 0 || newIndex >= items.length) return;
      setIsAnimating(true);
      setActiveIndex(newIndex);
      onSelect(items[newIndex].date);
      setTimeout(() => setIsAnimating(false), 300);
    },
    [activeIndex, items, isAnimating, onSelect]
  );

  // Wheel navigation with debounce
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheelTime.current < 400) return;
      lastWheelTime.current = now;
      if (e.deltaY > 0) navigate(1);
      else if (e.deltaY < 0) navigate(-1);
    },
    [navigate]
  );

  // Touch swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const deltaY = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(deltaY) > 40) {
        navigate(deltaY > 0 ? 1 : -1);
      }
    },
    [navigate]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        navigate(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        navigate(-1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  if (items.length === 0) return null;

  // Compute positions for visible items: prev, current, next
  const positions = [
    { index: activeIndex - 1, slot: "top" as const },
    { index: activeIndex, slot: "center" as const },
    { index: activeIndex + 1, slot: "bottom" as const },
  ].filter((p) => p.index >= 0 && p.index < items.length);

  const slotStyles: Record<string, string> = {
    top: "scale-[0.65] -translate-y-[110%] opacity-50",
    center: "scale-100 translate-y-0 opacity-100 z-10",
    bottom: "scale-[0.65] translate-y-[110%] opacity-50",
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center overflow-hidden"
      style={{ height: "340px", perspective: "800px" }}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Navigation arrows */}
      {activeIndex > 0 && (
        <button
          onClick={() => navigate(-1)}
          className="absolute top-2 z-20 font-pixel text-2xl text-gray-400 hover:text-black transition-colors"
          aria-label="Previous edition"
        >
          ▲
        </button>
      )}

      {/* Items container */}
      <div className="relative w-40 h-full flex items-center justify-center">
        {positions.map(({ index, slot }) => {
          const item = items[index];
          const isCenter = slot === "center";
          return (
            <div
              key={item.date}
              className={`absolute transition-all duration-300 ease-out ${slotStyles[slot]}`}
              style={{ transformStyle: "preserve-3d" }}
              onClick={() => {
                if (isCenter) {
                  onOpen(item.date);
                } else {
                  navigate(slot === "top" ? -1 : 1);
                }
              }}
            >
              <div className={isCenter ? "cursor-pointer" : "cursor-pointer"}>
                {renderItem(item, isCenter)}
              </div>
            </div>
          );
        })}
      </div>

      {activeIndex < items.length - 1 && (
        <button
          onClick={() => navigate(1)}
          className="absolute bottom-2 z-20 font-pixel text-2xl text-gray-400 hover:text-black transition-colors"
          aria-label="Next edition"
        >
          ▼
        </button>
      )}

      {/* Dots indicator */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
        {items.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              i === activeIndex ? "bg-black scale-125" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
