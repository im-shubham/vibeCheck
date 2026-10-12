import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "VibeCheck — AI-powered testimonial collection", template: "%s · VibeCheck" },
  description:
    "Collect authentic testimonials, make writing effortless with AI, and showcase your best customer stories anywhere on your website.",
};

export const viewport: Viewport = { themeColor: "#090d1f", width: "device-width", initialScale: 1 };

// Applies the saved theme before first paint to avoid a flash.
const themeScript = `try{var t=localStorage.getItem('vc-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster theme="system" position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
