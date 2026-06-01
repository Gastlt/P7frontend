/**
 * Next.js configuration: rewrite /api/* to the backend service.
 * The browser talks to /api/... and Next proxies those requests to the
 * backend host configured in BACKEND_INTERNAL_URL.
 */
const backendDestination = process.env.BACKEND_INTERNAL_URL || "http://localhost:8080";

module.exports = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: `${backendDestination}/auth/:path*`
      },
      {
        source: '/api/:path*',
        destination: `${backendDestination}/api/:path*`
      }
    ]
  }
}
