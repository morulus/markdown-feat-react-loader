module.exports = function cutUseStrict(code) {
  return code.replace(`"use strict";`, ``)
}
