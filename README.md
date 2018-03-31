Markdown feat. React loader
==

Loader, which not only converts markdown to the [React](https://reactjs.org/), but can run javascript from code blocks.

Look at example:
[https://morulus.github.io/markdown-feat-react-loader](https://morulus.github.io/markdown-feat-react-loader)

Look at example source: [examples/simply/index.md](https://github.com/morulus/markdown-feat-react-loader/blob/master/examples/simply/index.md)

And try it:
`npm run example`

Install loader:

```
npm install markdown-feat-react-loader --D
```

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

Usage in your markdown:
--

Loader enhances the markdown syntax. Like `code` lang extended property. Each time you use any of the next code chunks, you got render of the contained code.

- `js{eval}` To eval some script at the beginning of the document.

- `js{render}` To inline render React component from the code.

- `js{+render}` To display the code and render the code both

- `js{render+}` to render the code, and then display the code

## Import markdown

As the result, you will get high-grade React Component.

```js
import React from 'react';
import ReactDom from 'react-dom';
import Readme from './Readme.md';

ReactDom.render(
  <Readme />,
  document.getElementById('root')
)
```

As a normal React component, it can accept props.

```js
<Readme version="v1.0.0" />
```

And markdown inline-components can use this props.

```js
<Version>{props.version}</Version>
```

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

### Load images via your bundler

Set option `importImages` to load images with your bundler loader.

```js
{
  test: /\.md$/,
  exclude: /node_modules/,
  use: {
    loader : 'markdown-feat-react-loader',
    options: {
      importImages: true,
    },
  }
},
{
  test: /\.js$/,
  exclude: /node_modules/,
  use: 'babel-loader',
},
{
  test: /\.(png|jpg)$/,
  exclude: /node_modules/,
  use: 'file-loader'
}
```

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

### AST renderer

In super-advanced way you can add your custom logic to render AST to javascript. Also you can add some initial code to the evalChunks.

```js
{
  test: /\.md$/,
  exclude: /node_modules/,
  use: {
    loader: 'markdown-feat-react-loader',
    options: {
      renderer: function(ast, evalChunks, defaultRenderer) {
        // ast - Markdown ast

        // evalChunks - chunks of code, which will be injected to the top of javascript document
        evalChunks.push(`const lodash = require('lodash');`)

        return defaultRenderer(ast);
      },
    }
  }
}

```

You got the function `defaultRenderer` as the third argument, it provides you to render AST with the native logic, but you can manually convert AST to javascript code.

License
--

MIT, 2017
