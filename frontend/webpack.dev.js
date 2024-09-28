const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { merge } = require("webpack-merge");
const common = require("./webpack.common")

module.exports = merge(common, {
    mode: "development",
    devtool: 'inline-source-map',
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "dist")
    },
    devServer: {
        compress: true,
        port: 8080,
        historyApiFallback: true,
    }
});