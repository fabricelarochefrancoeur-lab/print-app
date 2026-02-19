"use client";

import { useRef, useEffect } from "react";

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
  onSelect,
  onOpen,
  renderItem,
}: EditionCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Scroll to selected item when selectedDate changes
  useEffect(() => {
    if (selectedDate && itemRefs.current.has(selectedDate)) {
      itemRefs.current.get(selectedDate)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedDate]);

  // On mount, scroll to the last item (most recent)
  useEffect(() => {
    if (items.length > 0 && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <div
      ref={scrollRef}
      className="flex flex-col items-center gap-4 overflow-y-auto py-4 px-2"
      style={{ maxHeight: "400px" }}
    >
      {items.map((item) => {
        const isSelected = item.date === selectedDate;
        return (
          <div
            key={item.date}
            ref={(el) => {
              if (el) itemRefs.current.set(item.date, el);
            }}
            className={`transition-all duration-200 cursor-pointer ${
              isSelected ? "scale-100" : "scale-90 opacity-60"
            }`}
            onClick={() => {
              if (isSelected) {
                onOpen(item.date);
              } else {
                onSelect(item.date);
              }
            }}
          >
            {renderItem(item, isSelected)}
          </div>
        );
      })}
    </div>
  );
}
