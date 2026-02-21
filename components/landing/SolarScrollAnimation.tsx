"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const TOTAL_FRAMES = 30;

function padNum(n: number): string {
    return n.toString().padStart(3, "0");
}

function buildSrc(i: number): string {
    return `/frames/ezgif-frame-${padNum(i)}.jpg`;
}

export default function SolarScrollAnimation({
    children,
}: {
    children: React.ReactNode;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const framesRef = useRef<HTMLImageElement[]>([]);
    const loadedRef = useRef(0);
    const rafRef = useRef<number | null>(null);
    const currentFrameRef = useRef(0);
    const scrollerRef = useRef<HTMLDivElement>(null);

    const [ready, setReady] = useState(false);

    // ── Draw a specific frame to canvas ─────────────────────────────
    const drawFrame = useCallback((idx: number) => {
        const canvas = canvasRef.current;
        const img = framesRef.current[idx];
        if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const cw = canvas.width;
        const ch = canvas.height;
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;

        // Cover-fit
        const scale = Math.max(cw / iw, ch / ih);
        const sw = iw * scale;
        const sh = ih * scale;
        const ox = (cw - sw) / 2;
        const oy = (ch - sh) / 2;

        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(img, ox, oy, sw, sh);
    }, []);

    // ── Preload all frames ──────────────────────────────────────────
    useEffect(() => {
        framesRef.current = [];
        loadedRef.current = 0;

        for (let i = 1; i <= TOTAL_FRAMES; i++) {
            const img = new Image();
            img.src = buildSrc(i);
            img.onload = () => {
                loadedRef.current += 1;
                if (loadedRef.current === TOTAL_FRAMES) {
                    setReady(true);
                    drawFrame(0);
                }
            };
            img.onerror = () => {
                loadedRef.current += 1;
                if (loadedRef.current === TOTAL_FRAMES) {
                    setReady(true);
                    drawFrame(0);
                }
            };
            framesRef.current.push(img);
        }
    }, [drawFrame]);

    // ── Resize canvas to fill viewport ─────────────────────────────
    useEffect(() => {
        const resize = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            drawFrame(currentFrameRef.current);
        };
        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, [drawFrame]);

    // ── Scroll handler ──────────────────────────────────────────────
    useEffect(() => {
        if (!ready) return;

        const onScroll = () => {
            const scroller = scrollerRef.current;
            if (!scroller) return;

            const scrollerRect = scroller.getBoundingClientRect();
            const absoluteTop = window.scrollY + scrollerRect.top;

            const scrollerHeight = scroller.offsetHeight;
            const scrollableDistance = Math.max(0, scrollerHeight - window.innerHeight);

            const scrolled = window.scrollY - absoluteTop;

            if (scrolled < 0) {
                drawFrame(0);
                currentFrameRef.current = 0;
                return;
            }

            if (scrollableDistance === 0 || scrolled >= scrollableDistance) {
                drawFrame(TOTAL_FRAMES - 1);
                currentFrameRef.current = TOTAL_FRAMES - 1;
                return;
            }

            const progress = scrolled / scrollableDistance;
            const frameIdx = Math.min(
                Math.floor(progress * TOTAL_FRAMES),
                TOTAL_FRAMES - 1
            );

            if (frameIdx !== currentFrameRef.current) {
                currentFrameRef.current = frameIdx;
                if (rafRef.current) cancelAnimationFrame(rafRef.current);
                rafRef.current = requestAnimationFrame(() => drawFrame(frameIdx));
            }
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll(); // initialise on mount
        return () => window.removeEventListener("scroll", onScroll);
    }, [ready, drawFrame]);

    return (
        <>
            {/* Fixed canvas background — always behind everything */}
            <div
                style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 0,
                    pointerEvents: "none",
                }}
            >
                <canvas
                    ref={canvasRef}
                    style={{ width: "100%", height: "100%" }}
                />
                {/* Dark overlay so text is readable over bright frames */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "linear-gradient(to bottom, rgba(3,3,9,0.55) 0%, rgba(3,3,9,0.35) 50%, rgba(3,3,9,0.7) 100%)",
                    }}
                />
            </div>

            {/* Natural document flow, directly containing Hero and Stats */}
            <div ref={scrollerRef} style={{ position: "relative", zIndex: 1 }}>
                {children}
            </div>
        </>
    );
}
