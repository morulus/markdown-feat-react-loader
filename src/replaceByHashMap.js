module.exports = function replaceByHashMap(values, text) {
  let nextText = text;
  Object.keys(values).forEach((key) => {
    nextText = nextText.replace(values[key], `"+${key}+"`);
  });

  return nextText;
}
