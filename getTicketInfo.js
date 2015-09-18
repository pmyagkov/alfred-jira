var argv = require('minimist')(process.argv.slice(2));
var request = require('request');
var alfredo = require('alfredo');
var fs = require('fs');
var path = require('flavored-path');
var _ = require('lodash');

if (!argv['_'].length) {
  return 'No ticket number passed!';
}

var ticketNumber = argv['_'][0];
var COMMENTS_COUNT = 20;
var CONFIG_FILE_NAME = '.alfred-jira';
var CONFIG_FILE_PATH = path.get('~/' + CONFIG_FILE_NAME);

function formatError(title, subtitle) {
  return {
    error: true,
    title: title,
    subtitle: subtitle ? subtitle : ''
  };
}

function readCreds() {
  if (!fs.existsSync(CONFIG_FILE_PATH)) {
    return formatError('Config file ~/.alfred-jira not found!');
  }

  var configFile = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
  var configStrings = _.compact(configFile.split('\n'));
  if (configStrings.length !== 2) {
    return formatError(
      'Config file has invalid format!',
      'Please create it using the following format: username\npassword'
    );
  }

  return {
    user: configStrings[0],
    pass: configStrings[1]
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

var credsObj = readCreds();
if (credsObj.error) {
  var item = new alfredo.Item({
    title: credsObj.title,
    subtitle: credsObj.subtitle
  });
  item.feedback();

} else {
  makeRequest(credsObj);
}

function makeRequest(credsObj) {
  request({
    method: 'GET',
    uri: 'https://jira.mail.ru/rest/api/2/issue/' + ticketNumber,
    headers: {
      'Content-type': 'application/json'
    },
    auth: {
      'user': credsObj.user,
      'pass': credsObj.pass
    }

  }, function (error, response, body) {
    if (error) {
      if (error.message.indexOf('auth()') > -1) {
        return new alfredo.Item({
          title: 'Provided username of password is invalid!'
        }).feedback();
      }
    }

    if (typeof body === 'string') {
      body = JSON.parse(body)
    }

    switch (response.statusCode) {
      case 404:
        return new alfredo.Item({
          title: 'Ticket not found!'
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

