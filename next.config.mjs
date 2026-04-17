/** @type {import('next').NextConfig} */

const s3PublicUrl = process.env.S3_PUBLIC_URL ?? '';

// Parse hostname and port from S3_PUBLIC_URL for next/image domain allowlist.
// Operators deploying to a custom CDN/S3 domain should add it here.
function s3RemotePattern() {
  try {
    const url = new URL(s3PublicUrl);
    return {
      protocol: url.protocol.replace(':', ''),
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
      pathname: '/**',
    };
  } catch {
    return null;
  }
}

const remotePatterns = [
  { protocol: 'https', hostname: 'api.dicebear.com', pathname: '/**' },
];
const pattern = s3RemotePattern();
if (pattern) remotePatterns.push(pattern);

const imgSrcHosts = [
  "'self'",
  'https://api.dicebear.com',
  s3PublicUrl,
  'data:',
].filter(Boolean).join(' ');

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  `img-src ${imgSrcHosts}`,
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
].join('; ');

const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
