const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')
const htmlPlugin = new HtmlWebpackPlugin({
  template: './dev.html',
  filename: 'index.html',
})

module.exports = {
  entry: './src/main.ts',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [htmlPlugin],
  resolve: {
    extensions: ['.ts', '.js'],
  },
}
