"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";

export function DemoButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startDemo() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/demo", { method: "POST" });
      if (!res.ok) throw new Error("Demo could not be prepared.");
      const { id } = await res.json();
      router.push(`/tech-pack/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <button
        type="button"
        onClick={startDemo}
        disabled={loading}
        className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-[var(--signal)] px-7 text-[15px] font-semibold text-white shadow-[0_0_29px_0_var(--signal),inset_0_1px_14px_0_rgb(255_255_255/0.35)] transition-all duration-300 hover:bg-[var(--masdr-purple)] hover:shadow-[0_0_38px_0_var(--signal),inset_0_1px_14px_0_rgb(255_255_255/0.4)] disabled:cursor-wait disabled:opacity-80"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Preparing demo…
          </>
        ) : (
          <>
            <Sparkles className="size-4 transition-transform duration-300 group-hover:scale-110" aria-hidden />
            Try the live demo
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
          </>
        )}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
