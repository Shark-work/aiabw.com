"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type TypewriterTextProps = {
  text: string;
  className?: string;
  speed?: number;
  onComplete?: () => void;
};

export function TypewriterText({ text, className, speed = 18, onComplete }: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDone(false);
    if (!text) {
      setDisplayed("");
      return;
    }

    setDisplayed(text.slice(0, 1));

    let index = 1;
    const timer = window.setInterval(() => {
      index += 1;
      setDisplayed(text.slice(0, index));
      if (index >= text.length) {
        window.clearInterval(timer);
        setDone(true);
        onComplete?.();
      }
    }, speed);

    return () => window.clearInterval(timer);
  }, [text, speed, onComplete]);

  return (
    <span className={cn("whitespace-pre-wrap", className)}>
      {displayed}
      {!done ? <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-cyan-300 align-middle" /> : null}
    </span>
  );
}
