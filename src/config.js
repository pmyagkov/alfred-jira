var path = require('flavored-path');
var fs = require('fs');
var formatter = require('./formatter');
var _ = require('lodash');

var CONFIG_FILE = path.get('~/.config/alfred-jira/alfred-jira');

module.exports = {
  read: function readConfig() {
    if (!fs.existsSync(CONFIG_FILE)) {
      return formatter.error('Config file ' + CONFIG_FILE + ' is not found');
    }

    var configFile = fs.readFileSync(CONFIG_FILE, 'utf8');
    var configStrings = _.compact(configFile.split(/\r?\n/));
    if (configStrings.length < 3 || configStrings.length > 4) {
      return formatter.error(
        'Config file has invalid format'
      );
    }

    var url = configStrings[0];
    if (url[url.length - 1] === '/') {
      url =  url.substr(0, url.length - 1);
    }

    return {
      baseUrl: url,
      user: configStrings[1],
      pass: configStrings[2],
      defaultProject: configStrings[3]
    };
  }
};
