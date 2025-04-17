module.exports = {
  webpack: {
    configure: {
      ignoreWarnings: [
        // Ignore warnings about size limits
        function ignoreSourcemapsloaderWarnings(warning) {
          return (
            warning.module &&
            warning.module.resource.includes('node_modules') &&
            warning.details &&
            warning.details.includes('source-map-loader')
          );
        },
      ],
      resolve: {
        fallback: {
          "path": require.resolve("path-browserify"),
          "os": require.resolve("os-browserify/browser"),
          "crypto": require.resolve("crypto-browserify"),
          "stream": require.resolve("stream-browserify"),
          "buffer": require.resolve("buffer/")
        }
      }
    },
  },
  // Override PostCSS configuration to use newer versions
  style: {
    postcss: {
      mode: 'extends',
      loaderOptions: (postcssLoaderOptions) => {
        return {
          ...postcssLoaderOptions,
          implementation: require('postcss'),
          postcssOptions: {
            plugins: [
              require('autoprefixer'),
              require('postcss-flexbugs-fixes'),
              require('postcss-preset-env')({
                autoprefixer: {
                  flexbox: 'no-2009'
                },
                stage: 3
              })
            ]
          }
        };
      },
    },
  },
}; 