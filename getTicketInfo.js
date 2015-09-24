var argv = require('minimist')(process.argv.slice(2));
var request = require('request');
var alfredo = require('alfredo');
var fs = require('fs');
var path = require('flavored-path');
var _ = require('lodash');

if (!argv['_'].length) {
  return new alfredo.Item({
    title: 'No ticket number passed'
  }).feedback();
}

var ticketNumber = argv['_'][0];
var COMMENTS_COUNT = 20;
var CONFIG_FILE = path.get('~/.config/alfred-jira/alfred-jira');

function formatError(title, subtitle) {
  return {
    error: true,
    title: title,
    subtitle: subtitle ? subtitle : ''
  };
}

function formatUrl(url, ticketNumber) {
  return (url[url.length - 1] === '/' ? url.substr(0, url.length - 1) : url) +
    '/rest/api/2/issue/' + ticketNumber;
}

function readCreds() {
  if (!fs.existsSync(CONFIG_FILE)) {
    return formatError('Config file ' + CONFIG_FILE + ' is not found');
  }

  var configFile = fs.readFileSync(CONFIG_FILE, 'utf8');
  var configStrings = _.compact(configFile.split(/\r?\n/));
  if (configStrings.length !== 3) {
    return formatError(
      'Config file has invalid format'
    );
  }

  return {
    url: configStrings[0],
    user: configStrings[1],
    pass: configStrings[2]
  };
}

function outputTicketInfo(ticketJSON) {
  var ticket = ticketJSON;

  var item = new alfredo.Item({
    title: ticket.fields.summary,
    subtitle: ticket.fields.assignee.displayName + ' — ' + ticket.fields.status.name,
    arg: ticketNumber
  });

  var items = [item];

  var comments = ticket.fields.comment.comments;
  var i = 1, comment;
  while (i <= COMMENTS_COUNT && comments.length - i > 0) {
    comment = comments[comments.length - i];
    items.push(new alfredo.Item({
      title: comment.body,
      subtitle: comment.author.displayName + ' (' + comment.author.emailAddress + ')',
      icon: 'comment.png',
      arg: ticketNumber
    }));
    i++;
  }

  item.feedback(items);
}

function makeRequest(configObj) {
  request({
    method: 'GET',
    uri: formatUrl(configObj.url, ticketNumber),
    headers: {
      'Content-type': 'application/json'
    },
    auth: {
      'user': configObj.user,
      'pass': configObj.pass
    }

  }, function (error, response, body) {
    if (error) {
      if (error.message.indexOf('auth()') > -1) {
        return new alfredo.Item({
          title: 'Provided username of password is invalid'
        }).feedback();
      }
    }

    if (typeof body === 'string') {
      body = JSON.parse(body)
    }

    switch (response.statusCode) {
      case 404:
        return new alfredo.Item({
          title: 'Ticket not found'
        }).feedback();

      case 200:
        return outputTicketInfo(body);

      default:
        return new alfredo.Item({
          title: 'Not expected response status: ' + response.statusCode,
          subtitle: body.errorMessages.join('; ')
        }).feedback();
    }
  });
}

var configObj = readCreds();
if (configObj.error) {
  var item = new alfredo.Item({
    title: configObj.title,
    subtitle: configObj.subtitle
  });
  item.feedback();

} else {
  makeRequest(configObj);
}
