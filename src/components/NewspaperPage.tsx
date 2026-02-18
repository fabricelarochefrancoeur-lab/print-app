"use client";

import Image from "next/image";
import Link from "next/link";
import LikeButton from "./LikeButton";

export type PageLayout = "single";

/** Page container style constants — reused for DOM measurement */
export const PAGE_STYLE = {
  height: "calc(100vh - 120px)",
  minHeight: "500px",
  maxHeight: "800px",
} as const;

export interface NewspaperPageData {
  printId: string;
  title: string;
  author: { username: string; displayName: string | null };
  date: string;
  paragraphs: string[];
  images: string[];
  layout: PageLayout;
  isFirstPage: boolean;
  isLastPageOfPrint: boolean;
  pageLabel?: string;
}

export function pickLayout(): PageLayout {
  return "single";
}

/** Parse print content into paragraphs (no page splitting — that's done by measurement) */
export function parsePrintParagraphs(content: string): string[] {
  const rawLines: string[] = (content || "").split(/\n/);
  const paragraphs: string[] = [];
  for (const line of rawLines) {
    if (line.trim().length === 0) {
      if (paragraphs.length > 0 && paragraphs[paragraphs.length - 1] !== "") {
        paragraphs.push("");
      }
    } else {
      paragraphs.push(line);
    }
  }
  while (paragraphs.length > 0 && paragraphs[paragraphs.length - 1] === "") {
    paragraphs.pop();
  }
  return paragraphs;
}

/** Character-based fallback splitting (used before DOM measurement completes) */
export function splitPrintIntoPages(
  print: any,
  layout: PageLayout
): NewspaperPageData[] {
  const paragraphs = parsePrintParagraphs(print.content);
  const images: string[] = print.images || [];
  const date = print.publishedAt || print.createdAt;

  const hasImages = images.length > 0;
  const FIRST_PAGE_CHARS = hasImages ? 200 : 600;
  const CONT_PAGE_CHARS = 800;

  const pages: NewspaperPageData[] = [];
  let remaining = [...paragraphs];
  let isFirst = true;
  let usedImages = false;

  while (remaining.length > 0) {
    const charLimit = isFirst ? FIRST_PAGE_CHARS : CONT_PAGE_CHARS;
    let charCount = 0;
    let sliceEnd = 0;

    for (let i = 0; i < remaining.length; i++) {
      const nextCount = charCount + remaining[i].length;
      if (nextCount > charLimit && sliceEnd > 0) break;
      charCount = nextCount;
      sliceEnd = i + 1;
    }

    const pageParas = remaining.slice(0, sliceEnd);
    remaining = remaining.slice(sliceEnd);

    const pageImages = isFirst && !usedImages ? images : [];
    if (isFirst) usedImages = true;

    pages.push({
      printId: print.id,
      title: print.title,
      author: print.author,
      date,
      paragraphs: pageParas,
      images: pageImages,
      layout: "single",
      isFirstPage: isFirst,
      isLastPageOfPrint: false,
      pageLabel: isFirst ? undefined : "continued",
    });

    isFirst = false;
  }

  if (pages.length === 0) {
    pages.push({
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

  if (pages.length > 0) {
    pages[pages.length - 1].isLastPageOfPrint = true;
  }

  return pages;
}

export default function NewspaperPage({ page }: { page: NewspaperPageData }) {
  const { title, author, date, paragraphs, images, isFirstPage, isLastPageOfPrint, pageLabel } = page;
  const formattedDate = new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article
      className="newspaper-page border-2 border-black bg-white overflow-hidden flex flex-col"
      style={PAGE_STYLE}
    >
      {/* Header */}
      {isFirstPage && (
        <div className="px-5 pt-5 pb-4">
          <h2 className="text-2xl md:text-3xl font-black leading-tight tracking-tight font-pixel">
            {title}
          </h2>
          <div className="flex items-center justify-between mt-2">
            <Link
              href={`/profile/${author.username}`}
              className="font-pixel text-xs hover:underline"
            >
              Printed by @{author.username}
            </Link>
            <span className="font-pixel text-xs text-gray-400">{formattedDate}</span>
          </div>
        </div>
      )}

      {/* Continued from previous page */}
      {pageLabel && (
        <div className="px-5 pt-3 pb-2">
          <span className="font-pixel text-[10px] text-gray-400 italic tracking-wide">
            ← Continued from previous page
          </span>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-hidden px-5 pt-3 pb-5 flex flex-col">
        {/* Images first, always full width, never cropped, sized to fit with text */}
        {images.length > 0 && (
          <div className="mb-5 -mx-5 flex-shrink-0">
            {images.map((url, i) => (
              <div key={i} className="w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  style={{ maxWidth: "100%", maxHeight: images.length > 1 ? "25vh" : "35vh", objectFit: "contain", display: "block", margin: "0 auto" }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Text — single column, justified, preserving paragraph breaks */}
        <div className="flex-1 overflow-hidden text-sm leading-snug">
          {paragraphs.map((p, i) =>
            p === "" ? (
              <div key={i} className="h-2" />
            ) : (
              <p key={i} className="mb-2.5 text-justify font-pixel">{p}</p>
            )
          )}
        </div>
      </div>

      {/* Like button on last page */}
      {isLastPageOfPrint && (
        <div className="px-5 pb-4 pt-3 flex-shrink-0 border-t-2 border-gray-300">
          <LikeButton printId={page.printId} />
        </div>
      )}

      {/* Continued on next page */}
      {!isLastPageOfPrint && (
        <div className="px-5 pb-3 pt-1 text-right flex-shrink-0">
          <span className="font-pixel text-[10px] text-gray-400 italic tracking-wide">
            Continued on next page →
          </span>
        </div>
      )}
    </article>
  );
}
