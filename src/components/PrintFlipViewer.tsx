"use client";

import { useState, useEffect, useCallback, useRef, useMemo, ReactNode } from "react";
import Image from "next/image";
import NewspaperPage, {
  splitPrintIntoPages,
  parsePrintParagraphs,
  pickLayout,
  NewspaperPageData,
  PAGE_STYLE,
} from "./NewspaperPage";

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

/**
 * Hook that measures actual DOM heights to split prints into pages
 * that fit within the fixed-height newspaper page container.
 */
function useMeasuredPages(prints: any[], enabled: boolean): NewspaperPageData[] | null {
  const [pages, setPages] = useState<NewspaperPageData[] | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);

  // Create hidden measurement container on mount
  useEffect(() => {
    if (!enabled) return;
    const div = document.createElement("div");
    div.style.cssText =
      "position:absolute;visibility:hidden;pointer-events:none;left:-9999px;top:0;overflow:hidden;";
    document.body.appendChild(div);
    measureRef.current = div;
    return () => {
      document.body.removeChild(div);
      measureRef.current = null;
    };
  }, [enabled]);

  // Measure and split
  const measure = useCallback(() => {
    const container = measureRef.current;
    if (!container || !enabled || prints.length === 0) return;

    // Get the actual page height from a temporary element with the same styles
    const sizer = document.createElement("div");
    sizer.style.cssText = `height:${PAGE_STYLE.height};min-height:${PAGE_STYLE.minHeight};max-height:${PAGE_STYLE.maxHeight};width:100%;`;
    container.appendChild(sizer);
    const pageHeight = sizer.offsetHeight;
    container.removeChild(sizer);

    if (pageHeight === 0) return;

    // Set measurement container to same width as a real page would have
    // Use the first .newspaper-page in the DOM if available, else use container width
    const existingPage = document.querySelector(".newspaper-page");
    const pageWidth = existingPage ? (existingPage as HTMLElement).offsetWidth : container.offsetWidth || 400;
    container.style.width = `${pageWidth}px`;

    const allPages: NewspaperPageData[] = [];

    for (const print of prints) {
      const paragraphs = parsePrintParagraphs(print.content);
      const images: string[] = print.images || [];
      const date = print.publishedAt || print.createdAt;

      // Measure header height
      const headerEl = document.createElement("div");
      headerEl.style.cssText = "padding:20px 20px 16px 20px;";
      headerEl.innerHTML = `
        <h2 class="text-2xl md:text-3xl font-black leading-tight tracking-tight font-pixel">${escapeHtml(print.title)}</h2>
        <div class="flex items-center justify-between mt-2">
          <span class="font-pixel text-xs">Printed by @${escapeHtml(print.author?.username || "")}</span>
          <span class="font-pixel text-xs text-gray-400">${new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
        </div>
      `;
      container.appendChild(headerEl);
      const headerHeight = headerEl.offsetHeight;
      container.removeChild(headerEl);

      // Measure "continued from" label height
      const contFromEl = document.createElement("div");
      contFromEl.style.cssText = "padding:12px 20px 8px 20px;";
      contFromEl.innerHTML = `<span class="font-pixel text-[10px] text-gray-400 italic tracking-wide">\u2190 Continued from previous page</span>`;
      container.appendChild(contFromEl);
      const contFromHeight = contFromEl.offsetHeight;
      container.removeChild(contFromEl);

      // Measure "continued on next page" footer height
      const contNextEl = document.createElement("div");
      contNextEl.style.cssText = "padding:4px 20px 12px 20px;text-align:right;";
      contNextEl.innerHTML = `<span class="font-pixel text-[10px] text-gray-400 italic tracking-wide">Continued on next page \u2192</span>`;
      container.appendChild(contNextEl);
      const contNextHeight = contNextEl.offsetHeight;
      container.removeChild(contNextEl);

      // Measure like button footer height
      const likeEl = document.createElement("div");
      likeEl.style.cssText = "padding:8px 20px 12px 20px;border-top:1px solid #e5e7eb;";
      likeEl.innerHTML = `<div style="height:32px"></div>`; // approximate like button height
      container.appendChild(likeEl);
      const likeHeight = likeEl.offsetHeight;
      container.removeChild(likeEl);

      // Estimate images height from viewport-based max-height constraints
      // (images load async so we can't measure them directly — use the CSS max-height as budget)
      let imagesHeight = 0;
      if (images.length > 0) {
        const vh = window.innerHeight / 100;
        const perImageMaxH = images.length > 1 ? 25 * vh : 35 * vh;
        imagesHeight = images.length * perImageMaxH + 20; // +20 for mb-5 margin
      }

      // Content area padding (px-5 py-3 = 20px horizontal, 12px vertical)
      const contentPadding = 24; // 12px top + 12px bottom

      // Measure each paragraph height
      const paraHeights: number[] = [];
      const paraContainer = document.createElement("div");
      paraContainer.style.cssText = "padding:0 20px;";
      paraContainer.className = "text-sm leading-snug";
      for (const p of paragraphs) {
        const el = document.createElement(p === "" ? "div" : "p");
        if (p === "") {
          el.className = "h-2";
        } else {
          el.className = "mb-2.5 text-justify font-pixel";
          el.textContent = p;
        }
        paraContainer.appendChild(el);
      }
      container.appendChild(paraContainer);
      // Measure each child
      for (let i = 0; i < paraContainer.children.length; i++) {
        const child = paraContainer.children[i] as HTMLElement;
        paraHeights.push(child.offsetHeight + parseFloat(getComputedStyle(child).marginBottom || "0"));
      }
      container.removeChild(paraContainer);

      // Distribute paragraphs across pages
      const printPages: NewspaperPageData[] = [];
      let remaining = [...paragraphs];
      let remainingHeights = [...paraHeights];
      let isFirst = true;

      while (remaining.length > 0) {
        // Budget calculation
        let budget = pageHeight - contentPadding;
        if (isFirst) {
          budget -= headerHeight;
          budget -= imagesHeight;
        } else {
          budget -= contFromHeight;
        }

        // Tentatively assume this might not be the last page → reserve space for "continued" footer
        // We'll adjust after we see if all remaining paragraphs fit
        const budgetWithContinued = budget - contNextHeight;
        const budgetWithLike = budget - likeHeight;

        // Try to fit paragraphs with "continued" footer budget
        let usedHeight = 0;
        let sliceEnd = 0;
        for (let i = 0; i < remaining.length; i++) {
          const h = remainingHeights[i];
          if (usedHeight + h > budgetWithContinued && sliceEnd > 0) {
            break;
          }
          usedHeight += h;
          sliceEnd = i + 1;
        }

        // Check if all remaining paragraphs fit with the like button budget instead
        {
          let totalH = 0;
          for (let i = 0; i < remaining.length; i++) totalH += remainingHeights[i];
          if (totalH <= budgetWithLike) {
            sliceEnd = remaining.length;
          }
        }

        // Ensure at least one paragraph per page to avoid infinite loops
        if (sliceEnd === 0) sliceEnd = 1;

        const pageParas = remaining.slice(0, sliceEnd);
        remaining = remaining.slice(sliceEnd);
        remainingHeights = remainingHeights.slice(sliceEnd);

        const isLast = remaining.length === 0;

        printPages.push({
          printId: print.id,
          title: print.title,
          author: print.author,
          date,
          paragraphs: pageParas,
          images: isFirst ? images : [],
          layout: "single",
          isFirstPage: isFirst,
          isLastPageOfPrint: isLast,
          pageLabel: isFirst ? undefined : "continued",
        });

        isFirst = false;
      }

      // Handle empty prints
      if (printPages.length === 0) {
        printPages.push({
          printId: print.id,
          title: print.title,
          author: print.author,
          date,
          paragraphs: [],
          images,
          layout: "single",
          isFirstPage: true,
          isLastPageOfPrint: true,
        });
      }

      allPages.push(...printPages);
    }

    setPages(allPages);
  }, [prints, enabled]);

  // Run measurement after render and on resize
  useEffect(() => {
    if (!enabled) return;
    // Delay to ensure fonts are loaded and layout is stable
    const timer = setTimeout(measure, 50);

    const observer = new ResizeObserver(() => {
      measure();
    });
    if (measureRef.current) {
      // Observe the body to detect viewport changes
      observer.observe(document.body);
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [measure, enabled]);

  // Re-measure when prints change
  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(measure, 50);
    return () => clearTimeout(timer);
  }, [prints, measure, enabled]);

  return pages;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

  // Build newspaper pages: use DOM measurement for accurate pagination, with char-based fallback
  const measuredPages = useMeasuredPages(prints, useNewspaper);
  const fallbackPages = useMemo<NewspaperPageData[]>(() => {
    if (!useNewspaper) return [];
    const allPages: NewspaperPageData[] = [];
    for (const print of prints) {
      const layout = pickLayout();
      const pages = splitPrintIntoPages(print, layout);
      allPages.push(...pages);
    }
    return allPages;
  }, [prints, useNewspaper]);
  const newspaperPages = measuredPages || fallbackPages;


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
