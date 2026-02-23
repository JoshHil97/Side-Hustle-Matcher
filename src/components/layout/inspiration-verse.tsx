"use client";

import { useEffect, useState } from "react";

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
];

export function InspirationVerse() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const onAnyClick = () => {
      setIndex((current) => (current + 1) % VERSES.length);
    };

    document.addEventListener("click", onAnyClick);
    return () => document.removeEventListener("click", onAnyClick);
  }, []);

  const currentVerse = VERSES[index];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 border-t border-stone-700 bg-stone-900/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 text-xs text-stone-200 sm:text-sm">
        <p className="truncate">
          <span className="font-medium text-stone-100">{currentVerse.text}</span>{" "}
          <span className="text-stone-400">{currentVerse.reference}</span>
        </p>
        <span className="shrink-0 text-[11px] uppercase tracking-wide text-stone-500">Click to change</span>
      </div>
    </div>
  );
}
