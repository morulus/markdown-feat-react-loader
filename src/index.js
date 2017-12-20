const unified = require(`unified`)
const parse = require(`remark-parse`)
const astToMarkdown = require(`remark-stringify`)
const babel = require(`babel-core`)
const loaderUtils = require(`loader-utils`)
const cutUseStrict = require(`./cutUseStrict`)

const emptyModule = require.resolve(`./empty`)

/* Babel repl */
const repl = (code) => babel.transform(code, {
  presets: [
    [require.resolve(`babel-preset-env`), {
      targets: {
        browsers: [`last 2 versions`],
      },
    }],
  ],
  plugins: [
    require.resolve(`babel-plugin-transform-react-jsx`),
  ],
  ast       : false,
  babelrc   : false,
  comments  : false,
  compact   : true,
  filename  : `md.chunk.js`,
  sourceType: `module`,
})

const PACAKGE_NAME = `react-in-markdown-loader`

const parser = unified().use(parse, { commonmark: true })

const tagNameRegex = /^<([^\s/>]+)/
const ReactElementNameRegEx = /^[A-Z]{1}[\w\d]?/

const evalChunks = []
const codechunks = []

const INJECT_REACT_COMPONENT_LANG = `inject:eval:chunk`

function defaultRenderer(ast) {
  const contentCode = new astToMarkdown.Compiler(ast, `anonym.md`).compile()
  return `module.exports = (
    React.createElement(
      __REACT_IN_MARKDOWN__API.Markdown,
      {
        source: ${JSON.stringify(contentCode)},
        externalElements: __REACT_IN_MARKDOWN__API.externalElements,
      }
    )
  )`
}

function extractJsxComponent(item) {
  if (item.type === `code` && item.lang === `js{render}`) {
    // const tagNameMatch = item.value.trim().match(tagNameRegex)
    // if (tagNameMatch && ReactElementNameRegEx.test(tagNameMatch[1])) {
      /* If tag has name, which seems like React element, we just move its
       * code to the code chunks. */
      const transplied = item.value.trim()
      codechunks.push(`function() { return (${cutUseStrict(transplied)})}`)
      /* And ast element converts to the code with lang `chunk` */
      return {
        ...item,
        type : `code`,
        lang : INJECT_REACT_COMPONENT_LANG,
        value: `${codechunks.length - 1}`,
      }
    // }
  }

  if (item.children && typeof item.children === `object` && item.children instanceof Array) {
    item.children = item.children.map(extractJsxComponent)
  }
  return item
}

function extractCodeChunk(item) {
  if (item.type === `code` && item.lang === `js{eval}`) {
    evalChunks.push(item.value.trim())
    return false
  } else if (item.children && typeof item.children === `object` && item.children instanceof Array) {
    item.children = item.children.map(extractCodeChunk).filter(Boolean)
  }
  return item
}

module.exports = function markdownReactStory(content) {
  const query = Object.assign({
    config  : ``,
    renderer: defaultRenderer,
  }, loaderUtils.getOptions(this) || {})

  const { renderer } = query

  const ast = parser.parse(content)

  /* Hunt for React components. Every html element with PascalCase name will be transplied in to the
   * special code chunk, called `codechunks`. */
  ast.children = ast.children.map(extractJsxComponent)

  /* Hunt eval code chunks */
  ast.children = ast.children.map(extractCodeChunk).filter(Boolean)

  /* Render js code */
  const code = renderer(ast, evalChunks)

  const header = `
    "use strict";

    var React = require('${require.resolve(`react`)}');
    ${evalChunks.join(`\n`)}

    var __REACT_IN_MARKDOWN__API = {
      ReactMarkdown: require('react-markdown'),
      createMarkdownInjectableCode: (function() {
        function renderExternalElement(Element) {
          if (typeof Element === 'function') {
            return React.createElement(Element);
          }
          return Element;
        }

        function renderError(message) {
          return React.createElement(
            'pre',
            null,
            React.createElement('code', {
              style: {
                backgroundColor: "red",
                color: "black",
              },
              message
            })
          )
        }

        return function reCreateMarkdownInjectableCode(externalElements) {
          return function MarkdownInjectableCode(props) {
            if (props.language === ${JSON.stringify(INJECT_REACT_COMPONENT_LANG)}) {
              if (!externalElements) {
                return renderError("No props.externalElements provided");
              }

              const Element = externalElements[props.value.trim()];

              if (!Element) {
                return renderError("External element in undefined at props.externalElements["+props.value.trim()+"]");
              }

              return renderExternalElement(Element);
            }
            return React.createElement(
              'pre',
              null,
              React.createElement(
                'code',
                null,
                props.value || "",
              )
            )
          }
        }
      })()
    }

    __REACT_IN_MARKDOWN__API.externalElements = [${codechunks.join(`,\n`)}];

    __REACT_IN_MARKDOWN__API.customReactMarkdownConfig = {
      renderers: {}
    };

    try {
      __REACT_IN_MARKDOWN__API.customReactMarkdownConfig = require(${query.config ? JSON.stringify(query.config) : JSON.stringify(emptyModule)});
    } catch(e) {
      // Nothing
    }

    if (typeof __REACT_IN_MARKDOWN__API.customReactMarkdownConfig !== "object") {
      throw new Error("${PACAKGE_NAME}: expects config to be an object, "+(
        typeof __REACT_IN_MARKDOWN__API.customReactMarkdownConfig
      )+" given");
    }

    __REACT_IN_MARKDOWN__API.reactMarkdownConfig = Object.assign(
      {},
      __REACT_IN_MARKDOWN__API.customReactMarkdownConfig,
      {
        renderers: Object.assign(
          {},
          __REACT_IN_MARKDOWN__API.customReactMarkdownConfig.renderers,
          {
            code: __REACT_IN_MARKDOWN__API.customReactMarkdownConfig.renderers && __REACT_IN_MARKDOWN__API.customReactMarkdownConfig.renderers.code || __REACT_IN_MARKDOWN__API.ReactMarkdown.renderers.code
          }
        )
      }
    )

    __REACT_IN_MARKDOWN__API.Markdown = function(props) {
      const externalElements = props.externalElements;
      return React.createElement(
        __REACT_IN_MARKDOWN__API.ReactMarkdown,
        Object.assign(
          {},
          __REACT_IN_MARKDOWN__API.reactMarkdownConfig,
          {
            renderers: Object.assign(
              {},
              __REACT_IN_MARKDOWN__API.reactMarkdownConfig.renderers,
              {
                code: __REACT_IN_MARKDOWN__API.createMarkdownInjectableCode(externalElements),
              }
            )
          },
          props,
        )
      )
    }
  `
  const source = `${header}
${code}`;
  const result = repl(source).code;

  return result
}
