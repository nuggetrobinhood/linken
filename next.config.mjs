/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Don't let Next fetch/inline the Google Fonts stylesheet at build time; the
  // <link> in the layout loads it in the user's browser at runtime instead.
  optimizeFonts: false,
  webpack: (config, { webpack }) => {
    // wagmi's connectors barrel pulls in Coinbase's base-account connector, which
    // drags in optional @x402/* packages we never use (LINKEN only uses the
    // injected connector). Ignore the whole subtree so the bundle resolves.
    config.plugins.push(
      new webpack.IgnorePlugin({ resourceRegExp: /^@x402\// })
    );
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
