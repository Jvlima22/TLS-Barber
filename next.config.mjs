/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "utfs.io",
      },
      {
        hostname: "logodownload.org",
      },
      {
        hostname: "cdn.shopify.com",
      },
      {
        hostname: "www.pngall.com",
      },
      {
        hostname: "images.unsplash.com",
      },
    ],
  },
}

export default nextConfig
