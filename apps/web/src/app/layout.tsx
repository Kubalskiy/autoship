import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoShip — Ship software with AI agents. Automatically.",
  description:
    "AutoShip orchestrates AI agents to design, build, test, and deploy your software. CI/CD for the AI agent era. Open-source core, self-hostable.",
  openGraph: {
    title: "AutoShip — Ship software with AI agents. Automatically.",
    description:
      "AutoShip orchestrates AI agents to design, build, test, and deploy your software. CI/CD for the AI agent era.",
    siteName: "AutoShip",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoShip — Ship software with AI agents. Automatically.",
    description:
      "CI/CD for AI agent workflows. Open-source, self-hostable.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-gray-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
