"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

export type PageLayout = "two-col" | "hero-image" | "float-left" | "float-right";

type ImageOrientation = "landscape" | "portrait" | "square" | "unknown";

function SmartImage({
  url,
  textLength,
  floatSide,
}: {
  url: string;
  textLength: number;
  floatSide: "left" | "right";
}) {
  const [orientation, setOrientation] = useState<ImageOrientation>("unknown");

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (w > h * 1.1) setOrientation("landscape");
    else if (h > w * 1.1) setOrientation("portrait");
    else setOrientation("square");
  }, []);

  const isPortraitOrSquare = orientation === "portrait" || orientation === "square";
  const shouldFloat = isPortraitOrSquare && textLength > 200;

  if (shouldFloat) {
    return (
      <div
        className={`mb-1.5 overflow-hidden ${
          floatSide === "left" ? "float-left mr-2" : "float-right ml-2"
        }`}
        style={{ width: "45%", maxWidth: "200px" }}
      >
        <Image
          src={url}
          alt=""
          width={400}
          height={600}
          className="w-full h-auto"
          onLoad={handleLoad}
        />
      </div>
    );
  }

  return (
    <div className="mb-2 -mx-3">
      <div className="w-full">
        <Image
          src={url}
          alt=""
          width={1200}
          height={800}
          className="w-full h-auto"
          onLoad={handleLoad}
        />
      </div>
    </div>
  );
}

export interface NewspaperPageData {
  printId: string;
  title: string;
  author: { username: string; displayName: string | null };
  date: string;
  paragraphs: string[];
  images: string[];
  layout: PageLayout;
  isFirstPage: boolean;
  pageLabel?: string; // e.g. "continued"
}

// Simple seeded random from string
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function pickLayout(printId: string, hasImages: boolean): PageLayout {
  const layouts: PageLayout[] = hasImages
    ? ["two-col", "hero-image", "float-left", "float-right"]
    : ["two-col"];
  return layouts[hashStr(printId) % layouts.length];
}

export function splitPrintIntoPages(
  print: any,
  layout: PageLayout
): NewspaperPageData[] {
  const paragraphs: string[] = (print.content || "")
    .split(/\n+/)
    .filter((p: string) => p.trim().length > 0);

  const images: string[] = print.images || [];
  const date = print.publishedAt || print.createdAt;

  const FIRST_PAGE_CHARS = layout === "hero-image" ? 500 : 900;
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
      layout: isFirst ? layout : "two-col",
      isFirstPage: isFirst,
      pageLabel: isFirst ? undefined : "continued",
    });

    isFirst = false;
  }

  // If no paragraphs but we have a title/images
  if (pages.length === 0) {
    pages.push({
      printId: print.id,
      title: print.title,
      author: print.author,
      date,
      paragraphs: [],
      images,
      layout,
      isFirstPage: true,
    });
  }

  return pages;
}

export default function NewspaperPage({ page }: { page: NewspaperPageData }) {
  const { title, author, date, paragraphs, images, isFirstPage, pageLabel } = page;
  const totalTextLength = paragraphs.reduce((sum, p) => sum + p.length, 0);
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
        {images.length > 0 && (
          <>
            {images.map((url, i) => {
              const floatSide = i % 2 === 0 ? "left" as const : "right" as const;
              return (
                <SmartImage
                  key={i}
                  url={url}
                  textLength={totalTextLength}
                  floatSide={floatSide}
                />
              );
            })}
          </>
        )}

        {/* Text */}
        <div className="text-sm leading-snug">
          {paragraphs.map((p, i) => (
            <p key={i} className="mb-1.5 font-pixel">{p}</p>
          ))}
        </div>

        {images.length > 0 && <div className="clear-both" />}
      </div>
    </article>
  );
}
