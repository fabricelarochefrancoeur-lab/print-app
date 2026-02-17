"use client";

import { useState, useEffect, useCallback, useRef, useMemo, ReactNode } from "react";
import Image from "next/image";
import NewspaperPage, { splitPrintIntoPages, pickLayout, NewspaperPageData } from "./NewspaperPage";

interface PrintFlipViewerProps {
  prints: any[];
  date?: string;
  renderCard?: (print: any) => ReactNode;
}

function CoverPage({ date, printCount, coverImage, coverAuthor }: { date: string; printCount: number; coverImage: string | null; coverAuthor: string | null }) {
  const d = new Date(date);
  const day = d.getDate();
  const month = d.toLocaleDateString("en-GB", { month: "long" }).toUpperCase();
  const year = d.getFullYear();

  return (
    <article
      className="border-2 border-black bg-white overflow-hidden flex flex-col"
      style={{ height: "calc(100vh - 120px)", minHeight: "500px", maxHeight: "800px" }}
    >
      <div className="flex-1 flex flex-col items-center justify-center py-10 px-6">
        <Image src="/logo.png" alt="PRINT" width={160} height={56} className="h-12 w-auto mb-6" />

        <div className="text-center mb-6">
          <p className="font-mono text-6xl font-bold leading-none">{day}</p>
          <p className="font-pixel text-xl mt-1">{month}</p>
          <p className="font-pixel text-sm opacity-50">{year}</p>
        </div>

        {coverImage && (
          <div className="w-full max-w-sm mb-6">
            <div className="border border-black overflow-hidden">
              <Image
                src={coverImage}
                alt="Cover"
                width={600}
                height={400}
                className="w-full h-auto object-cover"
              />
            </div>
            {coverAuthor && (
              <p className="font-pixel text-xs text-gray-400 text-right mt-1">
                image from @{coverAuthor}&apos;s PRINT
              </p>
            )}
          </div>
        )}

        <p className="font-pixel text-lg">
          {printCount} PRINT{printCount !== 1 ? "S" : ""}
        </p>
      </div>
    </article>
  );
}

export default function PrintFlipViewer({ prints, date, renderCard }: PrintFlipViewerProps) {
  const hasCover = !!date;
  const useNewspaper = !renderCard;

  // Build newspaper pages from prints
  const newspaperPages = useMemo<NewspaperPageData[]>(() => {
    if (!useNewspaper) return [];
    const allPages: NewspaperPageData[] = [];
    for (const print of prints) {
      const hasImages = print.images && print.images.length > 0;
      const layout = pickLayout(print.id, hasImages);
      const pages = splitPrintIntoPages(print, layout);
      allPages.push(...pages);
    }
    return allPages;
  }, [prints, useNewspaper]);

  // Build pages: cover (if date provided) + prints
  const coverData = useMemo(() => {
    if (!hasCover) return { image: null, author: null };
    const allEntries: { image: string; author: string }[] = [];
    for (const p of prints) {
      if (p.images && p.images.length > 0) {
        for (const img of p.images) {
          allEntries.push({ image: img, author: p.author?.username || "" });
        }
      }
    }
    if (allEntries.length === 0) return { image: null, author: null };
    const pick = allEntries[Math.floor(Math.random() * allEntries.length)];
    return { image: pick.image, author: pick.author };
  }, [prints, hasCover]);

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
      return <CoverPage date={date!} printCount={prints.length} coverImage={coverData.image} coverAuthor={coverData.author} />;
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
