"use client";

import Image from "next/image";
import Link from "next/link";

export type PageLayout = "single";

export interface NewspaperPageData {
  printId: string;
  title: string;
  author: { username: string; displayName: string | null };
  date: string;
  paragraphs: string[];
  images: string[];
  layout: PageLayout;
  isFirstPage: boolean;
  pageLabel?: string;
}

export function pickLayout(): PageLayout {
  return "single";
}

export function splitPrintIntoPages(
  print: any,
  layout: PageLayout
): NewspaperPageData[] {
  // Split on newlines but preserve empty lines as empty paragraphs
  const rawLines: string[] = (print.content || "").split(/\n/);
  // Group into paragraphs: consecutive non-empty lines form a paragraph,
  // empty lines create spacing (preserved as empty string entries)
  const paragraphs: string[] = [];
  for (const line of rawLines) {
    if (line.trim().length === 0) {
      // Preserve paragraph break
      if (paragraphs.length > 0 && paragraphs[paragraphs.length - 1] !== "") {
        paragraphs.push("");
      }
    } else {
      paragraphs.push(line);
    }
  }
  // Remove trailing empty
  while (paragraphs.length > 0 && paragraphs[paragraphs.length - 1] === "") {
    paragraphs.pop();
  }

  const images: string[] = print.images || [];
  const date = print.publishedAt || print.createdAt;

  const hasImages = images.length > 0;
  const FIRST_PAGE_CHARS = hasImages ? 500 : 900;
  const CONT_PAGE_CHARS = 1300;

  const pages: NewspaperPageData[] = [];
  let remaining = [...paragraphs];
  let isFirst = true;
  let usedImages = false;

  while (remaining.length > 0) {
    const charLimit = isFirst ? FIRST_PAGE_CHARS : CONT_PAGE_CHARS;
    let charCount = 0;
    let sliceEnd = 0;

    for (let i = 0; i < remaining.length; i++) {
      charCount += remaining[i].length;
      sliceEnd = i + 1;
      if (charCount >= charLimit && i < remaining.length - 1) break;
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
    });
  }

  return pages;
}

export default function NewspaperPage({ page }: { page: NewspaperPageData }) {
  const { title, author, date, paragraphs, images, isFirstPage, pageLabel } = page;
  const formattedDate = new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article
      className="newspaper-page border-2 border-black bg-white overflow-hidden flex flex-col"
      style={{ height: "calc(100vh - 120px)", minHeight: "500px", maxHeight: "800px" }}
    >
      {/* Header */}
      {isFirstPage && (
        <div className="px-3 pt-2 pb-1 border-b border-black">
          <div className="flex items-center justify-between">
            <Link
              href={`/profile/${author.username}`}
              className="font-pixel text-xs hover:underline uppercase tracking-wider"
            >
              @{author.username}
            </Link>
            <span className="font-pixel text-xs text-gray-400">{formattedDate}</span>
          </div>
          <h2 className="font-mono text-2xl md:text-3xl font-black leading-tight tracking-tight uppercase mt-1">
            {title}
          </h2>
        </div>
      )}

      {/* Continuation label */}
      {pageLabel && (
        <div className="px-3 pt-2 pb-1 border-b border-gray-300">
          <span className="font-pixel text-xs text-gray-400 italic uppercase tracking-widest">
            {title} — {pageLabel}
          </span>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-hidden px-3 py-2">
        {/* Images first, always full width, never cropped */}
        {images.length > 0 && (
          <div className="mb-2 -mx-3">
            {images.map((url, i) => (
              <div key={i} className="w-full">
                <Image
                  src={url}
                  alt=""
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                  style={{ maxHeight: "40vh", objectFit: "contain", backgroundColor: "#f5f5f5" }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Text — single column, justified, preserving paragraph breaks */}
        <div className="text-sm leading-snug">
          {paragraphs.map((p, i) =>
            p === "" ? (
              <div key={i} className="h-2" />
            ) : (
              <p key={i} className="mb-1.5 font-pixel text-justify">{p}</p>
            )
          )}
        </div>
      </div>
    </article>
  );
}
