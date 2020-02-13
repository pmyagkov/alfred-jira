function AlfredError(title, subtitle) {
  this.title = title;
  if (subtitle instanceof Array) {
    this.subtitle = subtitle.length ? subtitle.join('; ') : '';
  } else {
    this.subtitle = subtitle ? subtitle : '';
  }
}

module.exports = AlfredError;