const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  output: {
    filename: 'main.js'
  },
  devtool: process.env.NODE_ENV === 'production' ? false : 'cheap-eval-source-map',
  module: {
    rules: [
      { test: /\.html$/, use: [ 'html-loader' ] },
      { test: /\.(jpg|png)$/, use: [ 'file-loader?name=/images/[name].[ext]' ] }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      qrcode: 'qrcode-generator'
    }),
    new CopyWebpackPlugin([{ from: 'assets/**/*', to: '.' }]),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/views/index.html'
    })
  ]
}
