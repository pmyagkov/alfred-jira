var AlfredError = require('./AlfredError');

module.exports = {

  comment: function formatComment(comment, issueKey) {
    var commentBody = comment.body.replace(/\r?\n/g, ' ');
    if (commentBody.length > 120) {
      commentBody = commentBody.substr(0, 50) + ' … ' + commentBody.substr(commentBody.length - 50);
    }
    return {
      title: commentBody,
      subtitle: comment.author.displayName + ' <' + comment.author.emailAddress + '>',
      icon: 'images/comment.png',
      valid: false,
      arg: issueKey
    }
  },

  link: function formatLink(link, issueKey) {
    var issue;
    var linkType;

    if (link.outwardIssue !== undefined) {
      issue = link.outwardIssue;
      linkType = link.type.inward;
    } else if (link.inwardIssue !== undefined) {
      issue = link.inwardIssue;
      linkType = link.type.outward;
    }

    if (issue) {
      var commitMessage = issue.key + ' ' + issue.summary;
      return {
        title: commitMessage,
        subtitle: '[' + issue.fields.status.name + '] ' + linkType + ' ' + issueKey,
        icon: 'images/task.png',
        autocomplete: issue.key,
        arg: commitMessage
      }
    }
  },

  issue: function formatIssue(issue) {
    var assignee = issue.fields.assignee ? issue.fields.assignee.displayName : 'Unassigned';
    var commitMessage = issue.key + ' ' + issue.fields.summary;
    return {
      title: commitMessage,
      subtitle: '[' + issue.fields.status.name + '] ' + assignee,
      icon: 'images/task.png',
      autocomplete: issue.key,
      arg: commitMessage
    }
  },

  subtask: function formatSubtask(subtask, issueKey) {
    var commitMessage = subtask.key + ' ' + subtask.fields.summary;
    return {
      title: commitMessage,
      subtitle: '[' + subtask.fields.status.name + '] сабтаск для ' + issueKey,
      icon: 'images/task.png',
      autocomplete: subtask.key,
      arg: commitMessage
    }
  },

  url: function formatUrl(options) {
    var baseUrl, query, defaultProject, isSearch;
    if (!options.baseUrl || !options.query || typeof options.isSearch !== 'boolean') {
      console.warn('Params for url formatting are invalid', JSON.stringify(options, null, '  '));
      return null;
    }

    baseUrl = options.baseUrl;
    query = options.query;
    defaultProject = options.defaultProject;
    isSearch = options.isSearch;

    var fields;
    if (isSearch) {
      var jql = encodeURIComponent('project=' + defaultProject + ' and text ~ "' + query + '"');
      fields = ['summary', 'assignee', 'status'];
      return baseUrl + '/rest/api/2/search?jql=' + jql + '&fields=' + fields.join(',');

    } else {
      fields = ['summary', 'assignee', 'status', 'subtasks', 'issuelinks', 'comment'];
      return baseUrl + '/rest/api/2/issue/' + query + '?fields=' + fields.join(',');
    }
  },

  error: function formatError(title, subtitle) {
    return new AlfredError(title, subtitle);
  }
};
