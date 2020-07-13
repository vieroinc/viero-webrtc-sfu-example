"use strict";

const path = require("path");
const webpack = require("webpack");

module.exports = {
  mode: 'development',
  entry: {
    // "multicfg/index": path.resolve(__dirname, "./multicfg/index.js"),
    "simple/index": path.resolve(__dirname, "./simple/index.js"),
  },
  output: {
    path: path.resolve(__dirname, ""),
    filename: "[name].bundle.js",
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
  ],
  devtool: "source-map",
  devServer: {
    disableHostCheck: true,
    inline: true,
    host: '0.0.0.0',
    port: 8080,
  },
  stats: {
    colors: true,
  },
};
