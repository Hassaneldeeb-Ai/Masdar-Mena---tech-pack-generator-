"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";

const Lottie = dynamic(
  () => import("lottie-react").then((m) => m.Lottie),
  { ssr: false },
);

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* Scroll-reveal wrapper: adds .reveal-in when the element enters the viewport. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.classList.add("reveal-in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add("reveal-in");
            io.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className ?? ""}`}
      style={{ "--rd": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

/* Pointer-parallax container: children with .parallax + --px drift with the cursor. */
export function ParallaxZone({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const mx = Math.min(1, Math.max(-1, ((e.clientX - r.left) / r.width) * 2 - 1));
        const my = Math.min(1, Math.max(-1, ((e.clientY - r.top) / r.height) * 2 - 1));
        el.style.setProperty("--mx", mx.toFixed(3));
        el.style.setProperty("--my", my.toFixed(3));
      });
    };
    const onLeave = () => {
      el.style.setProperty("--mx", "0");
      el.style.setProperty("--my", "0");
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/* A floating object: absolutely positioned, cursor parallax + idle drift. */
export function Float({
  children,
  className,
  px = 14,
  driftX = 0,
  driftY = -16,
  rot = 0,
  rot2 = 0,
  dur = 9,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  px?: number;
  driftX?: number;
  driftY?: number;
  rot?: number;
  rot2?: number;
  dur?: number;
  delay?: number;
}) {
  const vars = {
    "--px": `${px}px`,
    "--drift-x": `${driftX}px`,
    "--drift-y": `${driftY}px`,
    "--drift-rot": `${rot}deg`,
    "--drift-rot2": `${rot2}deg`,
    "--drift-dur": `${dur}s`,
    "--d": `${delay}ms`,
  } as CSSProperties;
  return (
    <div
      aria-hidden
      className={`parallax animate-drift pointer-events-none absolute ${className ?? ""}`}
      style={vars}
    >
      {children}
    </div>
  );
}

/* Client-only Lottie player; pauses entirely when the user prefers reduced motion. */
export function LottieAnim({
  src,
  className,
  loop = true,
}: {
  src: string;
  className?: string;
  loop?: boolean;
}) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPaused(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (paused) return <div aria-hidden className={className} />;
  return <Lottie src={src} loop={loop} autoplay aria-hidden className={className} />;
}
