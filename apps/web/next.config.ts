import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 uses Turbopack by default; Solana externals only needed for webpack.
  turbopack: {},
  webpack: (config) => {
    config.externals ??= {};
    config.externals["@coral-xyz/anchor"] = "commonjs @coral-xyz/anchor";
    config.externals["@solana/kit"] = "commonjs @solana/kit";
    config.externals["@solana-program/memo"] = "commonjs @solana-program/memo";
    config.externals["@solana-program/system"] =
      "commonjs @solana-program/system";
    config.externals["@solana-program/token"] = "commonjs @solana-program/token";
    config.externals["@solana/spl-token"] = "commonjs @solana/spl-token";
    config.externals["@solana/web3.js"] = "commonjs @solana/web3.js";
    return config;
  },
};

export default nextConfig;
