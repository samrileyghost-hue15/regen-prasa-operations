import type { NextConfig } from 'next'
import path from 'node:path'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: path.join(__dirname),

  experimental: {
    serverActions: {
      bodySizeLimit: '6mb',
    },
  },

  // ── Security headers ───────────────────────────────────────────────────
  // Applied to every response. CSP is intentionally scoped: Supabase CDN
  // is the only external frame/script source this app needs.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Prevent this page being embedded in an iframe on another origin.
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Stop browser MIME-type sniffing.
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Only send the origin as the referrer, not the full URL.
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Restrict browser features to what the app actually uses.
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          // Upgrade HTTP connections to HTTPS. Max-age = 1 year.
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          // Content Security Policy.
          // script-src 'self' 'unsafe-inline' is required by Next.js runtime.
          // connect-src includes Supabase project URL and wss:// for realtime.
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://uxmygsttakkranssoapr.supabase.co",
              "font-src 'self' data:",
              "connect-src 'self' https://uxmygsttakkranssoapr.supabase.co wss://uxmygsttakkranssoapr.supabase.co",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
