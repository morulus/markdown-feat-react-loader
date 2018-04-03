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
            importImages: true,
            walkAst: (ast, meta) => {
              const headingKey = ast.children.findIndex(item => {
                if (item.type === `heading` && item.depth === 1) {
                  return true;
                }
              });

              if (headingKey >= 0) {
                meta.heading = ast.children[headingKey].children[0]
                  && ast.children[headingKey].children[0].value;
                ast.children.splice(headingKey, 1)
              } else {
                meta.heading = false;
              }

              return ast;
            }
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
