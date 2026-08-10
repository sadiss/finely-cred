/**
 * Typed react-pageflip wrapper — chapter-as-leaf flip stage for GuideReaderShell.
 * Library typings mark optional props as required; we soften them here.
 */
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import HTMLFlipBook from 'react-pageflip';

export type GuideFlipBookHandle = {
  flipTo: (pageIndex: number) => void;
  flipNext: () => void;
  flipPrev: () => void;
};

type FlipBookInner = {
  pageFlip: () => {
    flip: (page: number, corner?: 'top' | 'bottom') => void;
    flipNext: (corner?: 'top' | 'bottom') => void;
    flipPrev: (corner?: 'top' | 'bottom') => void;
    getCurrentPageIndex: () => number;
  };
};

const FlipLeaf = forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(
  function FlipLeaf({ children, className }, ref) {
    return (
      <div ref={ref} className={className ?? 'grs-flip-leaf'}>
        <div className="grs-flip-leaf__scroll">{children}</div>
      </div>
    );
  },
);

export type GuideReaderFlipBookProps = {
  pageIndex: number;
  onPageChange: (index: number) => void;
  width: number;
  height: number;
  className?: string;
  children: React.ReactNode[];
};

export const GuideReaderFlipBook = forwardRef<GuideFlipBookHandle, GuideReaderFlipBookProps>(
  function GuideReaderFlipBook({ pageIndex, onPageChange, width, height, className, children }, ref) {
    const bookRef = useRef<FlipBookInner | null>(null);
    const syncingRef = useRef(false);

    useImperativeHandle(
      ref,
      () => ({
        flipTo: (idx: number) => {
          const api = bookRef.current?.pageFlip?.();
          if (!api) return;
          syncingRef.current = true;
          try {
            api.flip(idx, 'top');
          } catch {
            /* ignore cold-start flips */
          }
          window.setTimeout(() => {
            syncingRef.current = false;
          }, 80);
        },
        flipNext: () => bookRef.current?.pageFlip?.().flipNext('top'),
        flipPrev: () => bookRef.current?.pageFlip?.().flipPrev('top'),
      }),
      [],
    );

    useEffect(() => {
      const api = bookRef.current?.pageFlip?.();
      if (!api) return;
      const current = api.getCurrentPageIndex?.();
      if (typeof current === 'number' && current !== pageIndex) {
        syncingRef.current = true;
        try {
          api.flip(pageIndex, 'top');
        } catch {
          /* ignore */
        }
        window.setTimeout(() => {
          syncingRef.current = false;
        }, 80);
      }
    }, [pageIndex]);

    // Soften broken package typings (all optional props marked required).
    const Book = HTMLFlipBook as unknown as React.ForwardRefExoticComponent<
      {
        width: number;
        height: number;
        size?: 'fixed' | 'stretch';
        minWidth?: number;
        maxWidth?: number;
        minHeight?: number;
        maxHeight?: number;
        drawShadow?: boolean;
        flippingTime?: number;
        usePortrait?: boolean;
        startPage?: number;
        startZIndex?: number;
        autoSize?: boolean;
        maxShadowOpacity?: number;
        showCover?: boolean;
        mobileScrollSupport?: boolean;
        clickEventForward?: boolean;
        useMouseEvents?: boolean;
        swipeDistance?: number;
        showPageCorners?: boolean;
        disableFlipByClick?: boolean;
        className?: string;
        style?: React.CSSProperties;
        children?: React.ReactNode;
        onFlip?: (e: { data: number }) => void;
      } & React.RefAttributes<FlipBookInner>
    >;

    return (
      <div className={className ?? 'grs-flip-stage'}>
        <Book
          ref={bookRef}
          width={width}
          height={height}
          size="stretch"
          minWidth={Math.min(320, width)}
          maxWidth={width}
          minHeight={Math.min(420, height)}
          maxHeight={height}
          drawShadow
          flippingTime={700}
          usePortrait
          startPage={pageIndex}
          autoSize
          maxShadowOpacity={0.35}
          showCover={false}
          mobileScrollSupport
          clickEventForward={false}
          useMouseEvents
          showPageCorners
          disableFlipByClick={false}
          onFlip={(e) => {
            if (syncingRef.current) return;
            if (typeof e?.data === 'number') onPageChange(e.data);
          }}
        >
          {children.map((child, i) => (
            <FlipLeaf key={i}>{child}</FlipLeaf>
          ))}
        </Book>
      </div>
    );
  },
);
