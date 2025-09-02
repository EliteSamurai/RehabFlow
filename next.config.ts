import type { NextConfig } from "next";
import webpack from "webpack";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // 1) Ignore importing the vitest runtime into the Next bundle
    config.plugins.push(
      new webpack.IgnorePlugin({ resourceRegExp: /(^|\/)vitest(\/|$)/ })
    );

    // 2) Ignore any imports that live in tests / __tests__ folders (including tests.off)
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /(\/|\\)(tests(\.off)?|__tests__|\.off)(\/|\\)/,
      })
    );

    // 3) Ignore direct imports of *.test.* or *.spec.* files
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /\.(test|spec)\.[tj]sx?$/i,
      })
    );

    // 4) Ignore the specific problematic file
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /cron\.analytics\.test/,
      })
    );

    return config;
  },
};

export default nextConfig;
