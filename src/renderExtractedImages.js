module.exports = function renderExtractedImages(images) {
  const keys = Object.keys(images);

  const code = [];

  for (let i = 0; i < keys.length; i++) {
    code.push(`const ${keys[i]} = require(${JSON.stringify(images[keys[i]])});`)
  }

  return code.join("\n");
}
