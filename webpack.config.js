const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: './examples/simply/index.js',
  output: {
    path: path.resolve(__dirname, 'examples/simply/dist'),
    filename: 'simply.bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.md$/,
        exclude: /node_modules/,
        use: {
          loader :  path.join(__dirname, 'lib/index.js'),
          options: {
            config  : require.resolve(`./react-markdown.config.js`),
            loadImages: true,
          },
        }
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.png$/,
        exclude: /node_modules/,
        use: 'file-loader'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      template: path.join(__dirname, 'examples/simply/index.html')
    })
  ]
};
