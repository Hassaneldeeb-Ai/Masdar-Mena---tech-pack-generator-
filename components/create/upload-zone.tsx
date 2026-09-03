"use client";

import { useRef, useState } from "react";
import { ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onFile: (file: File) => void;
}

export function UploadZone({ onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function accept(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Unsupported format. Allowed: JPG, PNG, WEBP.");
      return;
    }
    setError(null);
    setPreview(URL.createObjectURL(file));
    onFile(file);
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          accept(e.dataTransfer.files[0]);
        }}
        className={cn(
          "bg-blueprint-fine relative flex h-64 cursor-pointer flex-col items-center justify-center gap-2 rounded-[24px] border-2 border-dashed bg-sheet/70 transition-colors duration-300",
          dragOver ? "border-signal bg-sheet shadow-[0_0_24px_0_rgb(109_74_255/0.25)]" : "border-ink/30 hover:border-signal/70",
          preview && "border-solid"
        )}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Product preview"
              className="absolute inset-0 size-full object-contain p-3"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPreview(null);
                onFile(null as unknown as File);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full bg-ink text-sheet shadow-md transition-colors hover:bg-signal"
              aria-label="Remove image"
            >
              <X />
            </button>
            {error && <p className="absolute bottom-3 font-mono text-xs text-destructive">{error}</p>}
          </>
        ) : (
          <>
            <ImageIcon className="size-8 text-signal/50" />
            <p className="text-sm font-medium">Drop image or browse files</p>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
              JPG · PNG · WEBP
            </p>
            {error && <p className="font-mono text-xs text-destructive">{error}</p>}
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => accept(e.target.files?.[0])}
      />
    </div>
  );
}
