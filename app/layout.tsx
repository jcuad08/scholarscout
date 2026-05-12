import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScholarScout — Find niche scholarships before everyone else",
  description:
    "A scholarship finder, application helper, and tracker built for incoming college freshmen. Find low-competition scholarships, get personalized application guides, and stay organized.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('theme');
                const m = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (t === 'dark' || (!t && m)) document.documentElement.classList.add('dark');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
