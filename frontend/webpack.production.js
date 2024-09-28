const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { merge } = require("webpack-merge");
const common = require("./webpack.common")

module.exports = merge(common, {
    mode: "production",
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "dist")
    },
});