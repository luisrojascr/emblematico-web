"use client";

import { useState } from "react";

export function CopyUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a href={url} className="text-sand-dark break-all underline">
        {url}
      </a>
      <button
        type="button"
        className="border-ink/30 rounded-full border px-3 py-1 text-sm"
        onClick={() => {
          void navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
          });
        }}
      >
        {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}
