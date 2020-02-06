var AlfredError = require('./AlfredError');
var argv = require('minimist')(process.argv.slice(2));

if (!argv['_'].length) {
  console.log(JSON.stringify({
    title: 'No query passed'
  }));
}

var configObj = require('./config').read();

if (configObj instanceof AlfredError) {
  console.log(JSON.stringify(configObj));
} else {

  require('./getTicketInfo')(argv['_'][0], configObj)
    .then((result) => {
      console.log(JSON.stringify(result))
    })
    .catch((error) => {
      console.log(JSON.stringify({
        title: error.text,
      }))
    });
}
