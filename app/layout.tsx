import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FlowMind AI",
  description: "Voice-first personal assistant with Google-native workflows"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
