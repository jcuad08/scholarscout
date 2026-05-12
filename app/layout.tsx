import type { Metadata, Viewport } from "next";
import "./globals.css";

// Resolve a base URL for absolute Open Graph / Twitter image links.
// Vercel auto-injects VERCEL_URL on every deploy. NEXT_PUBLIC_SITE_URL is an
// optional override (set it in Vercel project settings if you wire up a custom
// domain). Falls back to localhost for dev so og-image links still resolve.
const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const title = "ScholarScout — Find niche scholarships before everyone else";
const description =
  "A scholarship finder, application helper, and tracker built for incoming college freshmen. Surfaces low-competition niche awards over high-traffic ones — with a built-in essay coach, school-specific awards, and a local tracker.";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: title,
    template: "%s · ScholarScout",
  },
  description,
  applicationName: "ScholarScout",
  keywords: [
    "scholarships",
    "college freshmen",
    "financial aid",
    "niche scholarships",
    "low competition scholarships",
    "scholarship finder",
    "essay coach",
  ],
  authors: [{ name: "jcuad08" }],
  creator: "jcuad08",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "ScholarScout",
    title,
    description,
    locale: "en_US",
    // app/opengraph-image.tsx is auto-discovered by Next; explicit entry here
    // makes the absolute URL deterministic across crawlers/unfurlers.
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ScholarScout — Find scholarships everyone else misses",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
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
