const path = require("path");
const webpack = require("webpack");

module.exports = (env, argv) => {
  // Determine the mode (development or production) from the CLI flag
  const isProd = argv.mode === "production";

  return {
    // 1) Your entry point (where Webpack starts)
    entry: {
      main: "./src/index.js",
    },

    // 2) Tell Webpack where to write the bundle:
    //    └─ this must match your Django app’s `frontend/static/frontend/` folder.
    output: {
      path: path.resolve(__dirname, "static", "frontend"),
      filename: "main.js",
      publicPath: "/static/frontend/",

      // If you ever do code splitting, chunks will be served from this URL:
      // e.g. /static/frontend/123.chunk.js
    },

    // 3) Loaders: instruct Webpack to use Babel for any `.js`/`.jsx` files
    module: {
      rules: [
        {
          test: /\.jsx?$/,           // both .js and .jsx
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            // Babel options can live in babel.config.json or .babelrc
          },
        },
      ],
    },

    // 4) Simplest optimization: only minify in production mode
    optimization: {
      minimize: isProd,
    },

    // 5) Plugins: remove the hard-coded `"production"` DefinePlugin.
    //    Instead, inject NODE_ENV based on the mode you actually ran.
    plugins: [
      new webpack.DefinePlugin({
        // This allows React (and any libraries) to see the correct environment
        "process.env.NODE_ENV": JSON.stringify(isProd ? "production" : "development"),
      }),
    ],

    // 6) Resolve these extensions automatically (so you can `import App from "./components/App";`)
    resolve: {
      extensions: [".js", ".jsx"],
    },
  };
};
