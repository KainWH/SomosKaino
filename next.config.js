/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // Necesario para el Dockerfile en producción
}

module.exports = nextConfig
