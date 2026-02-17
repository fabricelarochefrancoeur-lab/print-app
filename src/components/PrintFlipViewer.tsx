"use client";

import { useState, useEffect, useCallback, useRef, useMemo, ReactNode } from "react";
import Image from "next/image";
import NewspaperPage, { splitPrintIntoPages, pickLayout, NewspaperPageData } from "./NewspaperPage";

interface PrintFlipViewerProps {
  prints: any[];
  date?: string;
  renderCard?: (print: any) => ReactNode;
}

interface CoverData {
  image: string;
  authorUsername: string;
  authorAvatar: string | null;
}

function CoverPage({ date, printCount, cover }: { date: string; printCount: number; cover: CoverData | null }) {
  const d = new Date(date);
  const dayName = d.toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase();
  const day = d.getDate();
  const month = d.toLocaleDateString("en-GB", { month: "long" }).toUpperCase();
  const year = d.getFullYear();
  const dateStr = `${dayName}, ${day} ${month} ${year}`;

  return (
    <article
      className="border-2 border-black bg-white overflow-hidden flex flex-col"
      style={{ height: "calc(100vh - 120px)", minHeight: "500px", maxHeight: "800px" }}
    >
      <div className="flex-1 flex flex-col items-center justify-between py-12 px-6">
        {/* Top section */}
        <div className="flex flex-col items-center w-full">
          {/* Logo */}
          <Image src="/logo.png" alt="PRINT" width={300} height={100} className="h-16 w-auto" />

          {/* Date with horizontal lines */}
          <div className="flex items-center gap-3 w-full mt-6">
            <div className="flex-1 h-px bg-black" />
            <span className="font-pixel text-xs tracking-widest whitespace-nowrap">
              {dateStr}
            </span>
            <div className="flex-1 h-px bg-black" />
          </div>

          {/* Print count */}
          <p className="font-pixel text-xs text-gray-500 mt-3">
            {printCount} print{printCount !== 1 ? "s" : ""} in this edition
          </p>
        </div>

        {/* Cover image + author */}
        {cover && (
          <div className="w-full max-w-xs flex flex-col items-center">
            <div className="w-full overflow-hidden">
              <Image
                src={cover.image}
                alt="Cover"
                width={600}
                height={400}
                className="w-full h-auto"
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              {cover.authorAvatar && (
                <Image
                  src={cover.authorAvatar}
                  alt={cover.authorUsername}
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full object-cover"
                />
              )}
              <p className="font-pixel text-xs text-gray-500">
                image from @{cover.authorUsername}&apos;s PRINT
              </p>
            </div>
          </div>
        )}

        {/* Bottom double line */}
        <div className="w-full">
          <div className="w-full h-px bg-black" />
          <div className="w-full h-px bg-black mt-1" />
        </div>
      </div>
    </article>
  );
}

export default function PrintFlipViewer({ prints, date, renderCard }: PrintFlipViewerProps) {
  const hasCover = !!date;
  const useNewspaper = !renderCard;

  // Pick a random cover image + author from prints
  const coverData = useMemo<CoverData | null>(() => {
    if (!hasCover) return null;
    const entries: CoverData[] = [];
    for (const p of prints) {
      if (p.images && p.images.length > 0) {
        for (const img of p.images) {
          entries.push({
            image: img,
            authorUsername: p.author?.username || "",
            authorAvatar: p.author?.avatarUrl || null,
          });
        }
      }
    }
    if (entries.length === 0) return null;
    return entries[Math.floor(Math.random() * entries.length)];
  }, [prints, hasCover]);

  // Build newspaper pages from prints
  const newspaperPages = useMemo<NewspaperPageData[]>(() => {
    if (!useNewspaper) return [];
    const allPages: NewspaperPageData[] = [];
    for (const print of prints) {
      const layout = pickLayout();
      const pages = splitPrintIntoPages(print, layout);
      allPages.push(...pages);
    }
    return allPages;
  }, [prints, useNewspaper]);


  const contentPageCount = useNewspaper ? newspaperPages.length : prints.length;
  const totalPages = contentPageCount + (hasCover ? 1 : 0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidth = useRef(0);

  useEffect(() => {
    setCurrentIndex(0);
    setIsAnimating(false);
    setDragProgress(0);
    setIsDragging(false);
  }, [prints]);

  const renderPage = useCallback((index: number) => {
    if (hasCover && index === 0) {
      return <CoverPage date={date!} printCount={prints.length} cover={coverData} />;
    }
    const contentIndex = hasCover ? index - 1 : index;
    if (useNewspaper) {
      return <NewspaperPage page={newspaperPages[contentIndex]} />;
    }
    return renderCard!(prints[contentIndex]);
  }, [date, prints, coverData, renderCard, hasCover, useNewspaper, newspaperPages]);

  // Measure container width for drag ratio
  useEffect(() => {
    if (containerRef.current) {
      containerWidth.current = containerRef.current.offsetWidth;
    }
  });

  const goTo = useCallback(
    (newIndex: number, _direction: "next" | "prev") => {
      if (isAnimating || newIndex < 0 || newIndex >= totalPages) return;
      setIsAnimating(true);
      setCurrentIndex(newIndex);
      setDragProgress(0);

      // Wait for CSS transition to finish
      setTimeout(() => {
        setIsAnimating(false);
      }, 420);
    },
    [isAnimating, totalPages]
  );

  const goPrev = useCallback(() => {
    if (currentIndex > 0) goTo(currentIndex - 1, "prev");
  }, [currentIndex, goTo]);

  const goNext = useCallback(() => {
    if (currentIndex < totalPages - 1) goTo(currentIndex + 1, "next");
  }, [currentIndex, totalPages, goTo]);

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goPrev, goNext]);

  // Touch handlers for interactive drag curl
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnimating) return;
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    if (containerRef.current) {
      containerWidth.current = containerRef.current.offsetWidth;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isAnimating) return;
    touchCurrentX.current = e.touches[0].clientX;
    const dx = touchStartX.current - touchCurrentX.current;
    const w = containerWidth.current || 300;
    const progress = Math.max(-1, Math.min(1, dx / (w * 0.5)));

    // Only drag if there's a page in that direction
    if (progress > 0 && currentIndex >= totalPages - 1) return;
    if (progress < 0 && currentIndex <= 0) return;

    setIsDragging(true);
    setDragProgress(progress);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 0.3;
    if (dragProgress > threshold && currentIndex < totalPages - 1) {
      goTo(currentIndex + 1, "next");
    } else if (dragProgress < -threshold && currentIndex > 0) {
      goTo(currentIndex - 1, "prev");
    }
    setDragProgress(0);
  };

  // Mouse drag for desktop
  const mouseDown = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAnimating) return;
    mouseDown.current = true;
    touchStartX.current = e.clientX;
    if (containerRef.current) {
      containerWidth.current = containerRef.current.offsetWidth;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mouseDown.current || isAnimating) return;
    const dx = touchStartX.current - e.clientX;
    const w = containerWidth.current || 300;
    const progress = Math.max(-1, Math.min(1, dx / (w * 0.5)));

    if (progress > 0 && currentIndex >= totalPages - 1) return;
    if (progress < 0 && currentIndex <= 0) return;

    setIsDragging(true);
    setDragProgress(progress);
  };

  const handleMouseUp = () => {
    if (mouseDown.current) {
      mouseDown.current = false;
      handleTouchEnd();
    }
  };

  const handleMouseLeave = () => {
    if (mouseDown.current) {
      mouseDown.current = false;
      handleTouchEnd();
    }
  };

  if (prints.length === 0) return null;

  // Compute slide offset: drag adds a live pixel offset
  const dragOffset = isDragging ? -dragProgress * (containerWidth.current || 300) : 0;

  return (
    <div>
      {/* Horizontal slide container */}
      <div
        ref={containerRef}
        className="overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <div
          className="flex"
          style={{
            transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
            transition: isDragging ? "none" : "transform 400ms cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "transform",
          }}
        >
          {Array.from({ length: totalPages }, (_, i) => (
            <div key={i} className="w-full flex-shrink-0">
              {renderPage(i)}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0 || isAnimating}
          className="font-mono text-2xl px-3 py-1 border-2 border-black hover:bg-black hover:text-white transition-colors disabled:opacity-20 disabled:hover:bg-white disabled:hover:text-black"
        >
          &larr;
        </button>

        <span className="font-pixel text-sm text-gray-500">
          {hasCover && currentIndex === 0 ? "Cover" : `${hasCover ? currentIndex : currentIndex + 1} / ${contentPageCount}`}
        </span>

        <button
          onClick={goNext}
          disabled={currentIndex === totalPages - 1 || isAnimating}
          className="font-mono text-2xl px-3 py-1 border-2 border-black hover:bg-black hover:text-white transition-colors disabled:opacity-20 disabled:hover:bg-white disabled:hover:text-black"
        >
          &rarr;
        </button>
      </div>

      {/* Dot indicators */}
      {totalPages > 1 && totalPages <= 13 && (
        <div className="flex justify-center gap-2 mt-3">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => {
                if (i !== currentIndex && !isAnimating) {
                  goTo(i, i > currentIndex ? "next" : "prev");
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
