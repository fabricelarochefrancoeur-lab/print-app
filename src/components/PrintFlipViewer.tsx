"use client";

import { useState, useEffect, useCallback, useMemo, memo, ReactNode } from "react";
import Image from "next/image";
import NewspaperPage, {
  splitPrintIntoPages,
  pickLayout,
  NewspaperPageData,
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

function CoverPage({ date, printCount, cover }: { date: string; printCount: number; cover: CoverData | null }) {
  const d = new Date(date);
  const dayName = d.toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase();
  const day = d.getDate();
  const month = d.toLocaleDateString("en-GB", { month: "long" }).toUpperCase();
  const year = d.getFullYear();
  const dateStr = `${dayName}, ${day} ${month} ${year}`;

  return (
    <article className="border-2 border-black bg-white flex flex-col items-center py-12 px-6">
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

      {/* Cover image + author */}
      {cover && (
        <div className="w-full max-w-xs flex flex-col items-center mt-8">
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
      <div className="w-full mt-8">
        <div className="w-full h-px bg-black" />
        <div className="w-full h-px bg-black mt-1" />
      </div>
    </article>
  );
}

function PrintFlipViewer({ prints, date, renderCard }: PrintFlipViewerProps) {
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

  useEffect(() => {
    setCurrentIndex(0);
  }, [prints]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(totalPages - 1, i + 1));
  }, [totalPages]);

  if (prints.length === 0) return null;

  // Render current page
  const renderCurrentPage = () => {
    if (hasCover && currentIndex === 0) {
      return <CoverPage date={date!} printCount={prints.length} cover={coverData} />;
    }
    const contentIndex = hasCover ? currentIndex - 1 : currentIndex;
    if (useNewspaper) {
      return <NewspaperPage page={newspaperPages[contentIndex]} />;
    }
    return renderCard!(prints[contentIndex]);
  };

  return (
    <div>
      {renderCurrentPage()}

      {/* Bottom navigation */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="font-mono text-2xl px-3 py-1 border-2 border-black hover:bg-black hover:text-white transition-colors disabled:opacity-20 disabled:hover:bg-white disabled:hover:text-black"
          >
            &larr;
          </button>

          <span className="font-pixel text-sm text-gray-500">
            {hasCover && currentIndex === 0 ? "Cover" : `${hasCover ? currentIndex : currentIndex + 1} / ${contentPageCount}`}
          </span>

          <button
            onClick={goNext}
            disabled={currentIndex === totalPages - 1}
            className="font-mono text-2xl px-3 py-1 border-2 border-black hover:bg-black hover:text-white transition-colors disabled:opacity-20 disabled:hover:bg-white disabled:hover:text-black"
          >
            &rarr;
          </button>
        </div>
      )}

      {/* Dot indicators */}
      {totalPages > 1 && totalPages <= 13 && (
        <div className="flex justify-center gap-2 mt-3">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => {
                if (i !== currentIndex) setCurrentIndex(i);
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

export default memo(PrintFlipViewer);
