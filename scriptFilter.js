var AlfredError = require('./AlfredError');
var argv = require('minimist')(process.argv.slice(2));
var alfredo = require('alfredo');

if (!argv['_'].length) {
  return new alfredo.Item({
    title: 'No query passed'
  }).feedback();
}

var configObj = require('./config').read();

if (configObj instanceof AlfredError) {
  return configObj.toItem().feedback();
} else {

  require('./getTicketInfo')(argv['_'][0], configObj);
}
