// app/not-found.tsx
// Next.js App Router — auto-renders for all unmatched routes
// Place this file at:  src/app/not-found.tsx  (or app/not-found.tsx)

import type { Metadata } from "next";
import NotFoundPage from "@/components/NotFoundPage";

export const metadata: Metadata = {
  title: "404 — Page Not Found | CallMind AI",
  description:
    "The page you're looking for doesn't exist. Return to CallMind AI and automate your voice calling workflows.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <NotFoundPage />;
}