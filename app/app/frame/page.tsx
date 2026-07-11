import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const title = "Ajora Daily Pot";
  const description = "Save safely. Pick a number. Win the pot.";
  // We link to the main URL (adjust to the production mini-app deep link when deploying)
  const url = "https://ajora.com"; 
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : "http://localhost:3000";
  const imageUrl = `${baseUrl}/api/og`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [imageUrl],
    },
    other: {
      "fc:frame": "vNext",
      "fc:frame:image": imageUrl,
      "fc:frame:image:aspect_ratio": "1.91:1",
      "fc:frame:button:1": "Play Now",
      "fc:frame:button:1:action": "link",
      "fc:frame:button:1:target": url,
    },
  };
}

export default function FramePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-bold text-celo-green">Ajora Daily Pot</h1>
      <p className="mt-4 text-gray-500">
        This URL provides the Farcaster Frame metadata.
        <br />
        To play, <Link href="/" className="underline text-celo-green">visit the app</Link>.
      </p>
    </main>
  );
}
