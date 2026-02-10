import type { Metadata } from "next";
import localFont from "next/font/local";
import { Commissioner } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";

const satoshi = localFont({
  src: [
    {
      path: "../public/fonts/Satoshi-Variable.woff2",
      style: "normal",
    },
    {
      path: "../public/fonts/Satoshi-VariableItalic.woff2",
      style: "italic",
    },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

const commissioner = Commissioner({
  subsets: ["latin"],
  variable: "--font-commissioner",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Introspection - Reflect on Your AI Conversations",
  description:
    "Gain deeper insights from your past AI conversations with thoughtfully crafted introspection questions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${satoshi.variable} ${commissioner.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
