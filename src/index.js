// @flow
const Linkify = require('linkify-it');

const linkifier = new Linkify(undefined, {
  fuzzyEmail: false,
});

linkifier.tlds(['chat'], true);

/**
 * Don't linkify urls that are already markdown
 */
Object.keys(linkifier.__compiled__).forEach(schema => {
  if (linkifier.__compiled__[schema].validate) {
    const oldValidate = linkifier.__compiled__[schema].validate;

    linkifier.__compiled__[schema].validate = (text, pos, self) => {
      const tail = text.slice(text.slice(0, pos).lastIndexOf('['));

      let startIndex;
      let curr = pos;

      // Walk backward in the string to find '(' in the markdown link
      while (text[curr] && text[curr--] !== ' ') {
        if (text[curr] === '(') {
          startIndex = curr;
          break;
        }
      }

      if (!self.re.markdownLink) {
        self.re.markdownLink = new RegExp(
          /[!&]?\[([!&]?\[.*?\)|[^\]]*?)]\((.*?)( .*?)?\)/
        );
      }

      if (self.re.markdownLink.test(tail) && startIndex) {
        return false;
      }

      return oldValidate(text, pos, self);
    };
  }
});

/**
 * Replace URLs in text with markdown links
 * (this is used in a migration script so it has to be Node-compat ES6 only)
 */
const linkify = (text /*: string*/ /*: string*/) => {
  const matches = linkifier.match(text);
  // No match, return the text
  if (!matches) return text;

  let last = 0;
  let result = [];
  // Build up the result
  matches.forEach(match => {
    // If there is text between the last match and this one add it to the result now
    if (last < match.index) {
      result.push(text.slice(last, match.index));
    }
    // Add the current link
    result.push(`[${match.text}](${match.url})`);
    // Set the index of this match for the next round
    last = match.lastIndex;
  });
  // If there is text after the last match add it at the ned
  if (last < text.length) {
    result.push(text.slice(last));
  }
  // Turn the array into a string again
  return result.join('');
};

module.exports = linkify;
