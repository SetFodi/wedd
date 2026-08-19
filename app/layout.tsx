import type { Metadata } from "next";
import { headers } from "next/headers";
import { getPublishedInvitation } from "@/lib/invitation-store";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPublishedInvitation();
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto")?.split(",", 1)[0] ?? (host.startsWith("localhost") ? "http" : "https");
  const image = `${protocol}://${host}/og.png`;

  return {
    title: content.meta.title,
    description: content.meta.description,
    icons: { icon: "/favicon.svg" },
    openGraph: {
      title: `${content.couple.firstName} & ${content.couple.secondName}`,
      description: `${content.event.dateLong} · ${content.event.venue}`,
      images: [{
        url: image,
        width: 1200,
        height: 630,
        alt: `${content.couple.firstName} and ${content.couple.secondName} wedding invitation`,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${content.couple.firstName} & ${content.couple.secondName}`,
      description: `${content.event.dateLong} · ${content.event.venue}`,
      images: [image],
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ka">
      <body>{children}</body>
    </html>
  );
}
