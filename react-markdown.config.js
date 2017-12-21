import React from 'react'
import packageJson from './package.json'

module.exports = {
  renderers: {
    render: function(Component) {
      return function(props) {
        return (
          <div>
            <Component packageJson={packageJson} {...props} />
          </div>
        )
      }
    }
  }
}
