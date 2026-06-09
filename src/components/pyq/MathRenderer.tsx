"use client";

import React from "react";
import katex from "katex";

function renderLatex(text: string): string {
  if (!text) return "";
  return text
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
      try {
        return katex.renderToString(tex, { displayMode: true, throwOnError: false });
      } catch {
        return tex;
      }
    })
    .replace(/\$([^$]+?)\$/g, (_, tex) => {
      try {
        return katex.renderToString(tex, { displayMode: false, throwOnError: false });
      } catch {
        return tex;
      }
    });
}

export default function MathRenderer({
  content,
  className = "",
}: {
  content: string;
  className?: string;
}) {
  const html = renderLatex(content);
  return (
    <div
      className={`prose prose-sm max-w-none dark:prose-invert ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
