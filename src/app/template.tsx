"use client";
import { useEffect, useState } from "react";

/** Every route change is a blackout: the page is dark for 240 ms, then switches on. */
export default function Template({ children }: { children: React.ReactNode }) {
  const [clear, setClear] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setClear(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <>
      {children}
      <div aria-hidden className={`blackout ${clear ? "is-clear" : ""}`} style={{ zIndex: 65 }} />
    </>
  );
}
