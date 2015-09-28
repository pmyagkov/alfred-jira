var argv = require('minimist')(process.argv.slice(2));
var request = require('request');
var alfredo = require('alfredo');
var _ = require('lodash');
var keychain = require('keychain');

var AlfredError = require('./AlfredError');
var config = require('./config');
var formatter = require('./formatter');

var SERVICE_NAME = 'alfred-jira';
var COMMENTS_TAIL = 5;
if (!argv['_'].length) {
  return new alfredo.Item({
    title: 'No query passed'
  }).feedback();
}

function outputIssueInfo(data) {

  var items = [new alfredo.Item(formatter.issue(data))];
  var subtasks = data.fields.subtasks;
  for (var i = 0; i < subtasks.length; i++) {
    items.push(new alfredo.Item(formatter.subtask(subtasks[i], data.key)));
  }

  var links = data.fields.issuelinks;
  for (var i = 0; i < links.length; i++) {
    items.push(new alfredo.Item(formatter.link(links[i], data.key)));
  }

  var comments = data.fields.comment.comments;
  var commentsCount = Math.min(comments.length, COMMENTS_TAIL);
  for (var i = comments.length - commentsCount;i < commentsCount; i++) {
    items.push(new alfredo.Item(formatter.comment(comments[i], data.key)));
  }

  items[0].feedback(items);
}

function outputSearchResults(data) {

  var items = data.issues.map(function (issue) {
    return new alfredo.Item(formatter.issue(issue));
  });
  if (items.length) {
    items[0].feedback(items);
  } else {
    return new alfredo.Item({
      title: 'No issues found'
    }).feedback();
  }
}

function makeRequest(queryConfigObj) {
  request({
    method: 'GET',
    uri: formatter.url(queryConfigObj),
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
        return formatter.error('Provided username of password is invalid')
          .toItem().feedback();
      }

      return formatter.error('Unexpected error', error.message)
        .toItem().feedback();
    }

    if (typeof body === 'string') {
      body = JSON.parse(body)
    }

    switch (response.statusCode) {
      case 404:
        return formatter.error('No issues found').toItem().feedback();

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
        ).toItem().feedback();
    }
  });
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

var configObj = config.read();
var queryObj;

if (configObj instanceof AlfredError) {
  return configObj.toItem().feedback();
} else {
  var promise;

  if (!configObj.user) {
    promise = config.requestCreds().then(function (credsObj) {
      var def = vow.defer();

      if (credsObj.user && credsObj.pass) {
        keychain.setPassword({ account: credsObj.user, service: SERVICE_NAME, password: credsObj.pass }, function(err) {
          def.resolve(credsObj);
        });
      } else {
        def.reject(formatter.error('No valid credentials provided'));
      }

      return def.promise();
    }).catch(function (errorObj) {
      if (errorObj instanceof AlfredError) {
        return errorObj.toItem().feedback();
      }
    }).then(function(credsObj) {
      config.write(_.pick(credsObj, 'user'));

      return vow.resolve(credsObj);
    });
  } else {
    promise = keychain.getPassword({account: configObj.user, service: SERVICE_NAME}, function (err, pass) {
      var def = vow.defer();
      if (err) {
        def.reject(formatter.error('Can not extract user password from the keychain'));
      } else {
        def.resolve(_.extend(configObj, {pass: pass}));
      }

      return def.promise();
    });

    promise.then(function (configObj) {
      queryObj = calculateQuery(argv['_'][0], configObj);
      if (queryObj instanceof AlfredError) {
        return queryObj.toItem().feedback();
      }

      makeRequest(_.extend(configObj, queryObj));
    });
  }
}






/*
var configObj = config.read();
var queryObj;

if (configObj instanceof AlfredError) {
  return configObj.toItem().feedback();
} else {

  queryObj = calculateQuery(argv['_'][0], configObj);
  if (queryObj instanceof AlfredError) {
    return queryObj.toItem().feedback();
  }

  makeRequest(_.extend(configObj, queryObj));
}
*/
