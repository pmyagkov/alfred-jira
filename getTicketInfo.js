var argv = require('minimist')(process.argv.slice(2));
var request = require('request');
var alfredo = require('alfredo');
var fs = require('fs');
var path = require('flavored-path');
var _ = require('lodash');

var COMMENTS_TAIL = 5;
var CONFIG_FILE = path.get('~/.config/alfred-jira/alfred-jira');

if (!argv['_'].length) {
  return new alfredo.Item({
    title: 'No query passed'
  }).feedback();
}

var inputQuery = argv['_'][0];
var isSearch = false;

function formatError(title, subtitle) {
  return {
    error: true,
    title: title,
    subtitle: subtitle ? subtitle : ''
  };
}

function formatUrl(url, query, defaultProject) {
  if (isSearch) {
    var jql = encodeURIComponent('project=' + defaultProject + ' and text ~ "' + query + '"');
    var fields = ['summary', 'assignee', 'status'];
    return url + '/rest/api/2/search?jql=' + jql + '&fields=' + fields.join(',');

  } else {
    var fields = ['summary', 'assignee', 'status', 'subtasks', 'issuelinks', 'comment'];
    return url + '/rest/api/2/issue/' + query + '?fields=' + fields.join(',');
  }
}

function formatIssue(issue) {
  var assignee = issue.fields.assignee ? issue.fields.assignee.displayName : 'Unassigned';
  return {
    title: issue.key + ' ' + issue.fields.summary,
    subtitle: '[' + issue.fields.status.name + '] ' + assignee,
    arg: issue.key
  }
}

function formatSubtask(subtask, issueKey) {
  return {
    title: subtask.key + ' ' + subtask.fields.summary,
    subtitle: '[' + subtask.fields.status.name + '] сабтаск для ' + issueKey,
    arg: subtask.key
  }
}

function formatLink(link, issueKey) {
  if (link.outwardIssue !== undefined) {
    return {
      title: link.outwardIssue.key + ' ' + link.outwardIssue.fields.summary,
      subtitle: '[' + link.outwardIssue.fields.status.name + '] ' + link.type.inward + ' ' + issueKey,
      arg: link.outwardIssue.key
    }
  } else if (link.inwardIssue !== undefined) {
    return {
      title: link.inwardIssue.key + ' ' + link.inwardIssue.fields.summary,
      subtitle: '[' + link.inwardIssue.fields.status.name + '] ' + link.type.outward + ' ' + issueKey,
      arg: link.inwardIssue.key
    }
  }
}

function formatComment(comment, issueKey) {
  var commentBody = comment.body.replace(/\r?\n/g, ' ');
  if (commentBody.length > 120) {
    commentBody = commentBody.substr(0, 50) + ' … ' + commentBody.substr(commentBody.length - 50);
  }
  return {
    title: commentBody,
    subtitle: comment.author.displayName + ' <' + comment.author.emailAddress + '>',
    icon: 'comment.png',
    arg: issueKey
  }
}

function outputIssueInfo(data) {
  var items = [new alfredo.Item(formatIssue(data))];

  var subtasks = data.fields.subtasks;
  for (var i = 0; i < subtasks.length; i++) {
    items.push(new alfredo.Item(formatSubtask(subtasks[i], data.key)));
  }

  var links = data.fields.issuelinks;
  for (var i = 0; i < links.length; i++) {
    items.push(new alfredo.Item(formatLink(links[i], data.key)));
  }

  var comments = data.fields.comment.comments;
  var commentsCount = Math.min(comments.length, COMMENTS_TAIL);
  for (var i = comments.length - commentsCount;i < commentsCount; i++) {
    items.push(new alfredo.Item(formatComment(comments[i], data.key)));
  }

  items[0].feedback(items);
}

function outputSearchResults(data) {
  var items = []

  for (var i = 0, issue; i < data.issues.length; i++) {
    items.push(new alfredo.Item(formatIssue(data.issues[i])));
  }

  if (items.length) {
    items[0].feedback(items);
  } else {
    return new alfredo.Item({
      title: 'No issues found'
    }).feedback();
  }
}

function makeRequest(configObj) {
  request({
    method: 'GET',
    uri: formatUrl(configObj.url, inputQuery, configObj.defaultProject),
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
          title: 'No issues found'
        }).feedback();

      case 200:
        if (isSearch) {
          return outputSearchResults(body);
        } else {
          return outputIssueInfo(body);
        }

      default:
        return new alfredo.Item({
          title: 'Unexpected Jira response status: ' + response.statusCode,
          subtitle: body.errorMessages.join('; ')
        }).feedback();
    }
  });
}

function readConfig() {
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

  var url = configStrings[0];
  if (url[url.length - 1] === '/') {
    url =  url.substr(0, url.length - 1);
  }

  return {
    url: url,
    user: configStrings[1],
    pass: configStrings[2],
    defaultProject: configStrings[3]
  };
}

var configObj = readConfig();

if (configObj.error) {
  return new alfredo.Item({
    title: configObj.title,
    subtitle: configObj.subtitle
  }).feedback();

} else {
  if (/^\d+$/.test(inputQuery) && configObj.defaultProject !== undefined) {
    inputQuery = configObj.defaultProject.toUpperCase() + '-' + inputQuery;

  } else if (/^[a-z]+-\d+$/i.test(inputQuery)) {
    inputQuery = inputQuery.toUpperCase()

  } else if (configObj.defaultProject !== undefined) {
    isSearch = true;

  } else {
    return new alfredo.Item({
      title: 'Please, define default project in config to turn on text search'
    }).feedback();
  }

  makeRequest(configObj);
}
