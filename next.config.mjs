import { createVanillaExtractPlugin } from "@vanilla-extract/next-plugin";

const withVanillaExtract = createVanillaExtractPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  webpack: (config) => {
    config.module.rules.forEach((rule) => {
      if (!rule.oneOf) return;

      rule.oneOf.forEach((oneOfRule) => {
        if (
          oneOfRule.test &&
          oneOfRule.test instanceof RegExp &&
          (oneOfRule.test.test("test.tsx") || oneOfRule.test.test("test.ts"))
        ) {
          const existingExclude = oneOfRule.exclude;

          oneOfRule.exclude = (path) => {
            if (/\.css\.ts$/.test(path)) return true;
            if (typeof existingExclude === "function")
              return existingExclude(path);
            if (existingExclude instanceof RegExp)
              return existingExclude.test(path);
            return false;
          };
        }
      });
    });

    return config;
  },
};

export default withVanillaExtract(nextConfig);
