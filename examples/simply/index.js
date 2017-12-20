import doc from './index.md'
import docRaw from '!raw-loader!./index.md'
import Demo from './Demo';
import React from 'react'
import ReactDom from 'react-dom'

ReactDom.render(
  <Demo source={docRaw}>{doc}</Demo>,
  document.getElementById('root')
)
