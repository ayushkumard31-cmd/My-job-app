/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // Static exports have no Image Optimization API; serve local images directly.
  images: { unoptimized: true },
};

export default nextConfig;
