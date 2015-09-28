var path = require('flavored-path');
var fs = require('fs');
var formatter = require('./formatter');
var _ = require('lodash');
var vow = require('vow');
var ini = require('ini');

var CONFIG_FILE = path.get('~/.config/alfred-jira/alfred-jira.ini');

module.exports = {
  read: function readConfig() {
    if (!fs.existsSync(CONFIG_FILE)) {
      return formatter.error('Config file ' + CONFIG_FILE + ' is not found');
    }

    var config = ini.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));

    if (!config.jira) {
      return formatter.error('No [jira] section found in ' + CONFIG_FILE + ' config file');
    }

    if (!config.jira.url) {
      return formatter.error('No JIRA url found in ' + CONFIG_FILE + ' config file');
    }

    return {
      baseUrl: config.jira.url,
      user: config.jira.user,
      defaultProject: config.jira.defaultProject
    };
  },

  write: function writeConfig(credsObj) {
    var config = ini.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    config.jira = _.extend(config.jira ? config.jira : {}, {
      user: credsObj.user
    });
  },

  requestCreds: function () {
    var exec = require('child_process').exec;

    var def = vow.defer();
    exec('./credsPrompt &2>1', function(error, stdout, stderr) {
      console.log(stderr);
      if (error) {
        return def.reject(formatter.error('Error occurred while requesting credentials', error));
      }

      // osascript по непонятным причинам пишет выход в stderr
      var output = _(stderr.split(/\r?\n/)).filter(function (str) {
        return str.indexOf('warning: failed to get scripting definition from /usr/bin/osascript; it may not be scriptable') === -1;
      }).compact().value();

      console.log('output', output.join(';'));

      if (output.length !== 2) {
        return def.reject(formatter.error('No valid JIRA credentials provided'));
      }

      def.resolve({ user: output[0], pass: output[1] });
    });

    return def.promise();
  }
};
