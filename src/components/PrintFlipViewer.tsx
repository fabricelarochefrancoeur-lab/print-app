"use client";

import { useState, useEffect, useCallback, useRef, ReactNode } from "react";

interface PrintFlipViewerProps {
  prints: any[];
  renderCard: (print: any) => ReactNode;
}

export default function PrintFlipViewer({ prints, renderCard }: PrintFlipViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [flipState, setFlipState] = useState<null | {
    direction: "next" | "prev";
    fromIndex: number;
    toIndex: number;
  }>(null);
  const [dragProgress, setDragProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidth = useRef(0);

  useEffect(() => {
    setCurrentIndex(0);
    setFlipState(null);
    setIsAnimating(false);
    setDragProgress(0);
    setIsDragging(false);
  }, [prints]);

  // Measure container width for drag ratio
  useEffect(() => {
    if (containerRef.current) {
      containerWidth.current = containerRef.current.offsetWidth;
    }
  });

  const goTo = useCallback(
    (newIndex: number, direction: "next" | "prev") => {
      if (isAnimating || newIndex < 0 || newIndex >= prints.length) return;
      setIsAnimating(true);
      setFlipState({ direction, fromIndex: currentIndex, toIndex: newIndex });
      setDragProgress(0);

      // Let CSS animation run, then finalize
      setTimeout(() => {
        setCurrentIndex(newIndex);
        setFlipState(null);
        setIsAnimating(false);
      }, 600);
    },
    [isAnimating, currentIndex, prints.length]
  );

  const goPrev = useCallback(() => {
    if (currentIndex > 0) goTo(currentIndex - 1, "prev");
  }, [currentIndex, goTo]);

  const goNext = useCallback(() => {
    if (currentIndex < prints.length - 1) goTo(currentIndex + 1, "next");
  }, [currentIndex, prints.length, goTo]);

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
    if (progress > 0 && currentIndex >= prints.length - 1) return;
    if (progress < 0 && currentIndex <= 0) return;

    setIsDragging(true);
    setDragProgress(progress);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 0.3;
    if (dragProgress > threshold && currentIndex < prints.length - 1) {
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

    if (progress > 0 && currentIndex >= prints.length - 1) return;
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

  // Determine what to render
  const isFlipping = flipState !== null && !isDragging;
  const isDragCurling = isDragging && Math.abs(dragProgress) > 0.01;

  // During drag: compute the rotation angle from drag progress
  const dragAngle = isDragCurling ? Math.abs(dragProgress) * 180 : 0;
  const dragDirection = dragProgress > 0 ? "next" : "prev";

  // Indices for the under-page during drag
  const underIndex = isDragCurling
    ? dragDirection === "next"
      ? Math.min(currentIndex + 1, prints.length - 1)
      : Math.max(currentIndex - 1, 0)
    : currentIndex;

  return (
    <div>
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

      {/* Page curl container */}
      <div
        ref={containerRef}
        className="page-curl-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Under page (the page being revealed) */}
        {(isFlipping || isDragCurling) && (
          <div className="page-curl-under">
            {renderCard(prints[isFlipping ? flipState!.toIndex : underIndex])}
          </div>
        )}

        {/* Current / curling page */}
        <div
          className={`page-curl-page ${
            isFlipping
              ? flipState!.direction === "next"
                ? "page-curl-next"
                : "page-curl-prev"
              : ""
          }`}
          style={
            isDragCurling
              ? {
                  transformOrigin: dragDirection === "next" ? "left center" : "right center",
                  transform: `perspective(1800px) rotateY(${
                    dragDirection === "next" ? -dragAngle : dragAngle
                  }deg)`,
                  transition: "none",
                }
              : undefined
          }
        >
          {renderCard(prints[currentIndex])}

          {/* Shadow overlay on the curling page */}
          {(isFlipping || isDragCurling) && (
            <div
              className="page-curl-shadow"
              style={
                isDragCurling
                  ? { opacity: Math.abs(dragProgress) * 0.4 }
                  : undefined
              }
            />
          )}
        </div>

        {/* Shadow cast on the under-page */}
        {(isFlipping || isDragCurling) && (
          <div
            className={`page-curl-cast-shadow ${
              isFlipping
                ? flipState!.direction === "next"
                  ? "cast-shadow-next"
                  : "cast-shadow-prev"
                : ""
            }`}
            style={
              isDragCurling
                ? {
                    opacity: Math.abs(dragProgress) * 0.25,
                    transform: `translateX(${dragDirection === "next" ? "-" : ""}${Math.abs(dragProgress) * 30}%)`,
                  }
                : undefined
            }
          />
        )}
      </div>

      {/* Dot indicators */}
      {prints.length > 1 && prints.length <= 12 && (
        <div className="flex justify-center gap-2 mt-4">
          {prints.map((_, i) => (
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
