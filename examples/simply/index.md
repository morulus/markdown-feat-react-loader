Awesome example
==

```js{eval}
import Simply from './Simply'
import Wrapper from './Wrapper'
```

```js{render}
<h1>{props.packageJson.name}</h1>
```

```js{render}
<h2>{props.runtimeProp}</h2>
```
I have written awesome component, called Simply. Look at him.

```js{render}
<Simply />
```

And after element, we will continue to write story.

```js{render}
<Wrapper>
  # Title 1
  # Title 2

  But keep in the **mind**, that wrapped text by JSX *will* not be parsed by markdown
</Wrapper>
```


```js
Native code
```

`Inline code`

## How to use render and display code simultaneously

```js{render}
<pre><code>
  {`\`\`\`js{+render}
  <Simply />
\`\`\``}
</code></pre>
```


```js{+render}
<Simply />
```

## How to use props

```js{render}
<div>
  Current version: {props.packageJson.version}
</div>
```

## Where the props come?

*react-markdown.config.js*
```js
import React from 'react'
import packageJson from './package.json'

module.exports = {
  renderers: {
    render: function(Component) {
      return function(props) {
        return (
          <div>
            <Component packageJson={packageJson} />
          </div>
        )
      }
    }
  }
}

```

## Import images

There are few situation when I need to use images in the markdown

**Relative:**
![Demo](./demo.png)

**Absolute:**
![We loves google](https://www.google.ru/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png)
