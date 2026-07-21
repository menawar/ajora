/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    // Suppress the non-fatal "Critical dependency: the request of a dependency
    // is an expression" warning from viem's ox/tempo virtualMasterPool module.
    // This warning does not affect runtime behaviour.
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      { module: /virtualMasterPool/ },
    ];
    return config;
  },
};

export default nextConfig;

