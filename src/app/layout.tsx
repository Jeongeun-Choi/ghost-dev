import type { Metadata } from "next";
import { type ReactNode } from "react";
import { Space_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "@/styles/global.css";

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "GhostDev",
  description:
    "내가 업무에 집중하는 동안, AI는 내 사이드 프로젝트를 빌드합니다.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={spaceMono.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
