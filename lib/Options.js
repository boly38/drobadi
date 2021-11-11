class Options {
  constructor(options) {
    const opt = options ? options : {};
    this.dropboxToken = "dropboxToken" in opt ? opt.dropboxToken : (process.env.DBD_DROPBOX_TOKEN  || null);
    this.path         = "path"         in opt ? opt.path         : (process.env.DBD_PATH           || 'backup');     // target backup
  }
  getPath() {
    return ('path' in this) ? this.path : 'backup';
  }
  getDropboxPath() {
    return '/' + this.getPath();
  }
}

module.exports = Options;