Markdown feat. React loader
==

Loader, which not only converts markdown to the [React](https://reactjs.org/), but can run javascript from code blocks.

Look at here: [examples/index.md](examples/index.md)

And try it:
`npm run example`

Usage
--

Use code block with language
` ```js{eval} `
to eval some script at the beginning of the document.

Use code block with language
` ```js{render} `
to inline render React component.
