var argv = require('minimist')(process.argv.slice(2));
var request = require('request');
var alfredo = require('alfredo');
var fs = require('fs');
var path = require('flavored-path');
var _ = require('lodash');

var COMMENTS_COUNT = 20;
var CONFIG_FILE = path.get('~/.config/alfred-jira/alfred-jira');

if (!argv['_'].length) {
  return new alfredo.Item({
    title: 'No ticket number passed'
  }).feedback();
}

var ticketNumber = argv['_'][0];
var fullTicketNumber = true;

function formatError(title, subtitle) {
  return {
    error: true,
    title: title,
    subtitle: subtitle ? subtitle : ''
  };
}

function formatUrl(url, ticketNumber) {
  var fields = ['summary', 'assignee', 'status', 'comment'];
  return (url[url.length - 1] === '/' ? url.substr(0, url.length - 1) : url) +
    '/rest/api/2/issue/' + ticketNumber + '?' + fields.join(',');
}

function readCreds() {
  if (!fs.existsSync(CONFIG_FILE)) {
    return formatError('Config file ' + CONFIG_FILE + ' is not found');
  }

  var configFile = fs.readFileSync(CONFIG_FILE, 'utf8');
  var configStrings = _.compact(configFile.split(/\r?\n/));
  if (configStrings.length < 3 || configStrings.length > 4) {
    return formatError(
      'Config file has invalid format'
    );
  }

  return {
    url: configStrings[0],
    user: configStrings[1],
    pass: configStrings[2],
    defaultProject: configStrings[3]
  };
}

function outputTicketInfo(ticketJSON) {
  var ticket = ticketJSON;

  var title = ticket.fields.summary;
  if (!fullTicketNumber) {
    title = ticketNumber + ' ' + title;
  }

  var item = new alfredo.Item({
    title: title,
    subtitle: ticket.fields.assignee.displayName + ' — ' + ticket.fields.status.name,
    arg: ticketNumber
  });

  var items = [item];

  var comments = ticket.fields.comment.comments;
  var commentsCount = Math.min(comments.length, COMMENTS_COUNT);
  var i = comments.length - commentsCount;
  var comment, commentBody, commentBodyLength;
  for (;i < commentsCount; i++) {
    comment = comments[i];
    commentBody = comment.body.replace(/\r?\n/g, ' ');
    commentBodyLength = commentBody.length;
    if (commentBodyLength > 100) {
      commentBody = commentBody.substr(0, 50) + ' … ' + commentBody.substr(commentBody.length - 50);
    }
    items.push(new alfredo.Item({
      title: commentBody,
      subtitle: comment.author.displayName + ' (' + comment.author.emailAddress + ')',
      icon: 'comment.png',
      arg: ticketNumber
    }));
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

if (/^\d+$/.test(ticketNumber) && configObj.defaultProject !== undefined) {
  fullTicketNumber = false;
  ticketNumber = configObj.defaultProject.toUpperCase() + '-' + ticketNumber;

} else if (/^[a-z]+-\d+$/i.test(ticketNumber)) {
  ticketNumber = ticketNumber.toUpperCase()

} else {
  return new alfredo.Item({
    title: 'Bad ticket number'
  }).feedback();
}

if (configObj.error) {
  var item = new alfredo.Item({
    title: configObj.title,
    subtitle: configObj.subtitle
  });
  item.feedback();

} else {
  makeRequest(configObj);
}
