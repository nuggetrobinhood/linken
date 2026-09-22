import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

const DESCRIPTION =
  "Net carry — fees minus impermanent loss minus real gas — for concentrated liquidity positions on Robinhood Chain.";

export const metadata: Metadata = {
  metadataBase: new URL("https://linken.site"),
  title: "LINKEN — Position risk & net carry, Robinhood Chain",
  description: DESCRIPTION,
  openGraph: {
    title: "LINKEN — Position risk & net carry",
    description: DESCRIPTION,
    url: "https://linken.site",
    siteName: "LINKEN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LINKEN — Position risk & net carry",
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
