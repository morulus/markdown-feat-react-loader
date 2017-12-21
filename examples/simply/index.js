import Doc from './index.md'
import docRaw from '!raw-loader!./index.md'
import Demo from './Demo';
import React from 'react'
import ReactDom from 'react-dom'

ReactDom.render(
  <Demo source={docRaw} Doc={Doc} />,
  document.getElementById('root')
)
