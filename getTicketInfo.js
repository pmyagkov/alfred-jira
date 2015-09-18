var argv = require('minimist')(process.argv.slice(2));
var request = require('request');
var alfredo = require('alfredo');

if (!argv['_'].length) {
  return 'No ticket number passed!';
}

var ticketNumber = argv['_'][0];
var COMMENTS_COUNT = 20;

request({
  method: 'GET',
  uri: 'https://jira.mail.ru/rest/api/2/issue/' + ticketNumber,
  headers: {
    'Content-type': 'application/json'
  },
  auth: {
    'user': 'get-things-done',
    'pass': 'SZbGPOD~dK-0NDOms@ZI4AQpnBGA~=GU'
  }

}, function (error, response, body) {
  if (response.statusCode === 200){
    var ticket = body;

    if (typeof body === 'string') {
      ticket = JSON.parse(body);
    }

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
  } else {
    console.log('error: '+ response.statusCode);
    console.log(body);
  }
});
