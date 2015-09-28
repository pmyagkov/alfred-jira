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
      arg: issueKey
    }
  },

  link: function formatLink(link, issueKey) {
    if (link.outwardIssue !== undefined) {
      return {
        title: link.outwardIssue.key + ' ' + link.outwardIssue.fields.summary,
        subtitle: '[' + link.outwardIssue.fields.status.name + '] ' + link.type.inward + ' ' + issueKey,
        icon: 'images/task.png',
        autocomplete: link.outwardIssue.key,
        arg: link.outwardIssue.key
      }
    } else if (link.inwardIssue !== undefined) {
      return {
        title: link.inwardIssue.key + ' ' + link.inwardIssue.fields.summary,
        subtitle: '[' + link.inwardIssue.fields.status.name + '] ' + link.type.outward + ' ' + issueKey,
        icon: 'images/task.png',
        autocomplete: link.inwardIssue.key,
        arg: link.inwardIssue.key
      }
    }
  },

  issue: function formatIssue(issue) {
    var assignee = issue.fields.assignee ? issue.fields.assignee.displayName : 'Unassigned';
    return {
      title: issue.key + ' ' + issue.fields.summary,
      subtitle: '[' + issue.fields.status.name + '] ' + assignee,
      icon: 'images/task.png',
      autocomplete: issue.key,
      arg: issue.key
    }
  },

  subtask: function formatSubtask(subtask, issueKey) {
    return {
      title: subtask.key + ' ' + subtask.fields.summary,
      subtitle: '[' + subtask.fields.status.name + '] сабтаск для ' + issueKey,
      icon: 'images/task.png',
      autocomplete: subtask.key,
      arg: subtask.key
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
