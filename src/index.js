const unified = require(`unified`)
const parse = require(`remark-parse`)
const astToMarkdown = require(`remark-stringify`)
const babel = require(`babel-core`)
const loaderUtils = require(`loader-utils`)
const beautify = require('js-beautify').js

const cutUseStrict = require(`./cutUseStrict`)
const extractImages = require('./extractImages')
const renderExtractedImages = require('./renderExtractedImages')
const replaceByHashMap = require('./replaceByHashMap')

const emptyModule = require.resolve(`./empty`)

function defaultReplace(code) {
  return code;
}

/* Babel repl */
const repl = (code) => babel.transform(code, {
  presets: [
    [require.resolve(`babel-preset-env`), {
      targets: {
        ie: 10,
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
  sourceType: `module`
})

function isArray(a) {
  return a && typeof a === 'object' && a instanceof Array;
}

function flatArray(arr) {
  return arr.reduce(function(nextArra, next) {
    return nextArra.concat(isArray(next) ? next : [next]);
  }, [])
}

const PACAKGE_NAME = `react-feat-markdown-loader`

const parser = unified().use(parse, { commonmark: true })

const tagNameRegex = /^<([^\s/>]+)/
const ReactElementNameRegEx = /^[A-Z]{1}[\w\d]?/
const RENDER_JSX_LANG_MASK = /^(jsx?){(\+)?render(\+)?}/
const INJECT_REACT_COMPONENT_LANG = `inject:eval:chunk`

function defaultRenderer(ast) {
  const contentCode = new astToMarkdown.Compiler(ast, `anonym.md`).compile()
  return `module.exports = function MarkdownReact(props) { return (
    React.createElement(
      __REACT_IN_MARKDOWN__API.Markdown,
      {
        source: ${JSON.stringify(contentCode)},
        userProps: props,
        externalElements: __REACT_IN_MARKDOWN__API.externalElements,
      }
    )
  ); }`
}

module.exports = function markdownFeatReact(content) {
    const evalChunks = []
    const codechunks = []

    const query = Object.assign({
      config  : ``,
      renderer: defaultRenderer,
    }, loaderUtils.getOptions(this) || {})

    const {
      renderer,
      debug,
      walkAst
    } = query

    const replace = query.replace || defaultReplace
    const aliases = query.aliases || {};

    if (typeof replace !== 'function') {
      throw new Error('options.replace should be a function')
    }

    if (typeof aliases !== 'object') {
      throw new Error('options.aliases should be an object')
    }

    /* Extract JSX Component (should start with `<`) */
    function extractJsxComponent(item) {
      if (item.type === `code` && RENDER_JSX_LANG_MASK.test(item.lang)) {
          // Detect the plus (+) character
          const match = item.lang.match(RENDER_JSX_LANG_MASK);
          const lang = match[1];
          const plus = !!(match[2] || match[3]);
          const code = item.value.trim();
          const transplied = item.value.trim()

          if (lang === 'jsx') {
            codechunks.push(`__REACT_IN_MARKDOWN__API.reactMarkdownConfig.renderers.render(function(props) { return (${cutUseStrict(transplied)}); }, ${JSON.stringify(code)})`)
          } else if (lang === 'js') {
            codechunks.push(`__REACT_IN_MARKDOWN__API.reactMarkdownConfig.renderers.render((function() {
              const module = {
                exports: {}
              };

              const exports = module.exports;

              ${replace(cutUseStrict(repl(code).code))}

              var Component = module.exports.__esModule === true
                ? module.exports.default
                : module.exports;

              return function(props) {
                if (typeof Component === 'function') {
                  return React.createElement(
                    module.exports.default,
                    props,
                  );
                } else {
                  return Component;
                }
              }
            })())`);
          }
          /* And ast element converts to the code with lang `chunk` */
          const codeChunk = {
            ...item,
            type : `code`,
            lang : INJECT_REACT_COMPONENT_LANG,
            value: `${codechunks.length - 1}`,
          };
          if (plus) {
            return match[1]
              ? [
                codeChunk,
                item
              ]
              : [
                item,
                codeChunk
              ]
          }
          return codeChunk;
        // }
      }

      if (item.children && typeof item.children === `object` && item.children instanceof Array) {
        item.children = flatArray(item.children.map(extractJsxComponent));
      }
      return item
    }

    // Prepare API
    function extractCodeChunk(item) {
      if (item.type === `code` && item.lang === `js{eval}`) {
        evalChunks.push(replace(item.value.trim()))
        return false
      } else if (item.children && typeof item.children === `object` && item.children instanceof Array) {
        item.children = item.children.map(extractCodeChunk).filter(Boolean)
      }
      return item
    }

    const meta = {};

    const nativeAst = parser.parse(content)
    const ast = typeof walkAst === 'function'
      ? (walkAst(nativeAst, meta) || nativeAst)
      : nativeAst;

    /* Hunt for React components. Every html element with PascalCase name will be transplied in to the
     * special code chunk, called `codechunks`. */
    ast.children = flatArray(ast.children.map(extractJsxComponent));

    /* Hunt eval code chunks */
    ast.children = ast.children.map(extractCodeChunk).filter(Boolean)

    /* Render js code */
    let code = renderer(ast, evalChunks, defaultRenderer, meta)

    let imagesHashMap = {};
    if (query.importImages) {
      /* Extract images to the variables */
      imagesHashMap = extractImages(ast.children);
      /* Replace all image hashes in the code */
      code = replaceByHashMap(imagesHashMap, code)
    }

    const header = `
      "use strict";

      var React = require('${require.resolve(`react`)}');
      ${evalChunks.join(`\n`)}

      ${renderExtractedImages(imagesHashMap)}

      var __REACT_IN_MARKDOWN__API = {};

      __REACT_IN_MARKDOWN__API.ReactMarkdown = require(${JSON.stringify(require.resolve('react-markdown'))});

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
            {
              render: function(Component) {
                return function MarkdownRender(props) {
                  return React.createElement(
                    Component,
                    props
                  );
                };
              },
            },
            __REACT_IN_MARKDOWN__API.customReactMarkdownConfig.renderers,
            {
              code: __REACT_IN_MARKDOWN__API.customReactMarkdownConfig.renderers && __REACT_IN_MARKDOWN__API.customReactMarkdownConfig.renderers.code || __REACT_IN_MARKDOWN__API.ReactMarkdown.renderers.code
            }
          )
        }
      )

      __REACT_IN_MARKDOWN__API.createMarkdownInjectableCode = (function() {
        function renderExternalElement(Element, props) {
          if (typeof Element === 'function') {
            Element = React.createElement(Element, props);
          }

          if (__REACT_IN_MARKDOWN__API.reactMarkdownConfig.renderers.chunk) {
            return React.createElement(
              __REACT_IN_MARKDOWN__API.reactMarkdownConfig.renderers.chunk,
              props,
              Element
            )
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

        return function reCreateMarkdownInjectableCode(mainComponent) {
          return function MarkdownInjectableCode(props) {
            const {
              externalElements,
              userProps
            } = mainComponent.props;

            if (props.language === ${JSON.stringify(INJECT_REACT_COMPONENT_LANG)}) {
              if (!externalElements) {
                return renderError("No props.externalElements provided");
              }

              const Element = externalElements[props.value.trim()];

              if (!Element) {
                return renderError("External element in undefined at externalElements["+props.value.trim()+"]");
              }

              return renderExternalElement(Element, userProps);
            }
            if (!props.value) {
              return React.createElement('code', props);
            }
            return React.createElement(
              __REACT_IN_MARKDOWN__API.reactMarkdownConfig.renderers.code,
              props,
              props.children
            )
          }
        }
      })()

      __REACT_IN_MARKDOWN__API.externalElements = [${codechunks.join(`,\n`)}];

      class StateFulMarkdown extends React.Component {
        constructor(...args) {
          super(...args);
          this.codeRenderer = __REACT_IN_MARKDOWN__API.createMarkdownInjectableCode(this)
        }
        render() {
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
                    code: this.codeRenderer,
                  }
                )
              },
              this.props,
            )
          )
        }
      }

      __REACT_IN_MARKDOWN__API.Markdown = StateFulMarkdown;
    `

    const source = `${header}
  ${code}

  if (typeof module.exports === 'object' || typeof module.exports === 'function') {
    module.exports.meta = ${JSON.stringify(meta)}
  }
  `;

  if (debug) {
    console.log(debug);
  }

  const result = beautify(repl(source).code, { indent_size: 2, space_in_empty_paren: true });

  return result
}
