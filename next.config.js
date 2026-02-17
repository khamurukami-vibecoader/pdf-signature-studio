/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow large file uploads (up to 20 MB)
  api: {
    bodyParser: false,
    responseLimit: "20mb",
  },

  // Expose public env vars to the client
  // Set these in .env.local — see .env.example
  env: {
    NEXT_PUBLIC_UPI_ID: process.env.NEXT_PUBLIC_UPI_ID,
    NEXT_PUBLIC_PRICE:  process.env.NEXT_PUBLIC_PRICE,
  },
};

module.exports = nextConfig;
