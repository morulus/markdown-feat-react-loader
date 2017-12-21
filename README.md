Markdown feat. React loader
==

Loader, which not only converts markdown to the [React](https://reactjs.org/), but can run javascript from code blocks.

Look at here: [examples/simply/index.md](https://github.com/morulus/markdown-feat-react-loader/blob/master/examples/simply/index.md)

And try it:
`npm run example`

Usage
--

Configurate webpack loader:

```js
rules: [
  {
    test: /\.md$/,
    exclude: /node_modules/,
    use: 'markdown-feat-react-loader'
  }
]
```

Use code block with language
` ```js{eval} `
to eval some script at the beginning of the document.

Use code block with language
` ```js{render} `
to inline render React component from the code.

Use code block with language
` ```js{+render}`
to display the code and render the code both

Use code block with language
` ```js{render+}`
to render the code, and then display the code

## Advanced configuration

Loader uses [react-markdown](https://github.com/rexxars/react-markdown) package to parse markdown at runtime. So it can be configurated in [the same way](https://github.com/rexxars/react-markdown#options) as react-markdown.

Custom configuration must be passed to options as path to the .js file, which exports plain object.

```js
{
  test: /\.md$/,
  exclude: /node_modules/,
  use: {
    loader: 'markdown-feat-react-loader',
    options: {
      config  : require.resolve(`./react-markdown.config.js`),
    },
  }
}
```

Example of `react-markdown.config.js`:

```js
module.exports = {
  renderers: {
    code: MyCustomCodeComponent
  }
}
```

See [react-markdown#node-types](https://github.com/rexxars/react-markdown#node-types) to read more abount renderers.

### Render HOC

Also you can specify the render HOC, which accepts component, which has been extracted from markdown code, and returns new component, which contain your custom logic.

For example, you can use it to pass props to the component, or with `recompose`, or in some another way.

```js
import { withProps } from 'recompose';

module.exports = {
  renderers: {
    render: withProps({
      version: 'v0.3.1'
    })
  }
}
```
