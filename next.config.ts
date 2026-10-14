import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        // Banner do torneio (docs/TORNEIOS.md), guardado no Vercel Blob —
        // cada store tem um subdomínio próprio em *.public.blob.vercel-storage.com.
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
