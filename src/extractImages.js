const md5 = require('md5');
const isUrl = require('is-url');

module.exports = function extractImages(children) {
  const images = {};
  for (let i = 0; i < children.length; i++) {
    const item = children[i];

    if (item.type === 'image') {
      if (!isUrl(item.url)) {
        const url = item.url;
        const hash = `IMAGE${md5(item.url)}`;
        item.url = hash;
        images[hash] = url;
      }
    }


    // Go deeper
    if (item.children && typeof item.children === `object` && item.children instanceof Array) {
      Object.assign(
        images,
        extractImages(item.children)
      )
    }
  }

  return images;
}
