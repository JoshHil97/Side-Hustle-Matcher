"use client";

import { useEffect, useMemo, useState } from "react";

const VERSES = [
  {
    text: "Commit thy works unto the LORD, and thy thoughts shall be established.",
    reference: "Proverbs 16:3 (KJV)",
  },
  {
    text: "I can do all things through Christ which strengtheneth me.",
    reference: "Philippians 4:13 (KJV)",
  },
  {
    text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding.",
    reference: "Proverbs 3:5 (KJV)",
  },
  {
    text: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.",
    reference: "2 Timothy 1:7 (KJV)",
  },
  {
    text: "Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.",
    reference: "Joshua 1:9 (KJV)",
  },
  {
    text: "And let us not be weary in well doing: for in due season we shall reap, if we faint not.",
    reference: "Galatians 6:9 (KJV)",
  },
] as const;

const ROTATE_MS = 7000;

export function InspirationVerse() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % VERSES.length);
    }, ROTATE_MS);

    return () => window.clearInterval(timer);
  }, []);

  const verse = useMemo(() => VERSES[index], [index]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-700 bg-gradient-to-r from-[#1e120b]/95 via-[#2a190f]/95 to-[#1e120b]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-3 py-2 sm:px-4">
        <button
          type="button"
          onClick={() => setIndex((current) => (current - 1 + VERSES.length) % VERSES.length)}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-stone-500 bg-stone-800/70 text-xs font-semibold text-stone-200 transition hover:border-amber-400 hover:text-amber-200"
          aria-label="Previous verse"
        >
          ‹
        </button>

        <div className="min-w-0 flex-1">
          <p key={`verse-${index}`} className="truncate text-xs text-stone-200 sm:text-sm">
            <span className="font-semibold text-amber-100">{verse.text}</span>{" "}
            <span className="text-stone-400">{verse.reference}</span>
          </p>
          <div className="mt-1 flex items-center gap-1">
            {VERSES.map((item, dotIndex) => (
              <button
                key={item.reference}
                type="button"
                onClick={() => setIndex(dotIndex)}
                className={`h-1.5 w-4 rounded-full transition ${dotIndex === index ? "bg-amber-300" : "bg-stone-600 hover:bg-stone-500"}`}
                aria-label={`Show verse ${dotIndex + 1}`}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIndex((current) => (current + 1) % VERSES.length)}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-stone-500 bg-stone-800/70 text-xs font-semibold text-stone-200 transition hover:border-amber-400 hover:text-amber-200"
          aria-label="Next verse"
        >
          ›
        </button>
      </div>
    </div>
  );
}
