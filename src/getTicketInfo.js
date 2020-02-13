var AlfredError = require('./AlfredError');
var request = require('request');
var _ = require('lodash');

var formatter = require('./formatter');

var COMMENTS_TAIL = 5;

let issue_key
let issue_text
function outputIssueInfo(data) {
  issue_key = data.key
  issue_text = data.fields.summary
  var items = [formatter.issue(data)];

  var subtasks = data.fields.subtasks;
  for (var i = 0; i < subtasks.length; i++) {
    items.push(formatter.subtask(subtasks[i], data.key));
  }

  var links = data.fields.issuelinks;
  for (var i = 0; i < links.length; i++) {
    items.push(formatter.link(links[i], data.key));
  }

  var comments = data.fields.comment.comments;
  var commentsCount = Math.min(comments.length, COMMENTS_TAIL);
  for (var i = comments.length - commentsCount;i < commentsCount; i++) {
    items.push(formatter.comment(comments[i], data.key));
  }

  return items
}

function outputSearchResults(data) {
  var items = data.issues.map(function (issue) {
    return formatter.issue(issue);
  });

  if (items.length) {
    return items;
  } else {
    return {
      title: 'No issues found'
    };
  }
}

function makeRequest(queryConfigObj) {
  return new Promise((resolve, reject) => {
    request({
      method: 'GET',
      uri: formatter.url(queryConfigObj),
      headers: {
        'Content-type': 'application/json'
      },
      auth: {
        'user': queryConfigObj.user,
        'pass': queryConfigObj.pass
      }

    }, function (error, response, body) {
      const result = (() => {
        if (error) {
          if (error.message.indexOf('auth()') > -1) {
            return formatter.error('Provided username of password is invalid');
          }

          return formatter.error('Unexpected error', error.message);
        }

        if (typeof body === 'string') {
          body = JSON.parse(body)
        }

        switch (response.statusCode) {
          case 404:
            return formatter.error('No issues found');

          case 200:
            if (queryConfigObj.isSearch) {
              return outputSearchResults(body);
            } else {
              return outputIssueInfo(body);
            }

          default:
            return formatter.error(
              'Unexpected Jira response status: ' + response.statusCode,
              body.errorMessages
            );
        }
      })()

      // console.log('9', result)

      resolve(result)
    });
  })
}

function calculateQuery(inputQuery, configObj) {
  var query = inputQuery;
  var isSearch = false;

  if (/^\d+$/.test(inputQuery) && configObj.defaultProject !== undefined) {
    query = configObj.defaultProject.toUpperCase() + '-' + inputQuery;

  } else if (/^[a-z]+-\d+$/i.test(inputQuery)) {
    query = inputQuery.toUpperCase()

  } else if (configObj.defaultProject !== undefined) {
    isSearch = true;

  } else {
    return formatter.error('Please, define default project in config to turn on text search');
  }

  return {
    query: query,
    isSearch: isSearch
  };
}

var queryObj;
module.exports = function (query, configObj) {
  queryObj = calculateQuery(query, configObj);

  if (queryObj instanceof AlfredError) {
    return Promise.resolve({
      response: queryObj,
      issue_key,
      issue_text,
    })
  }

  return makeRequest({
    ...(_.extend(configObj, queryObj)),
  }).then((result) => {
    // console.log('10', result)
    return {
      response: result,
      issue_key,
      issue_text,
    }
  });
};
