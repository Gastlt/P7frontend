/**
 * Next.js configuration: rewrite /api/* to internal cluster service
 * This enables the frontend to call /api/... from the browser while the
 * server proxies those requests to the internal backend service, avoiding
 * the need for a public backend URL or CORS configuration.
 */
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://todolistapp-backend-router.mtdrworkshop.svc.cluster.local/:path*'
      }
    ]
  }
}
