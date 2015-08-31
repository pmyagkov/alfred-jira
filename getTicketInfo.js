var argv = require('minimist')(process.argv.slice(2));
var request = require('request');
var alfredo = require('alfredo');

if (!argv['_'].length) {
  return 'No ticket number passed!';
}

var ticketNumber = argv['_'][0];

request({
  method: 'GET',
  uri: 'https://jira.mail.ru/rest/api/2/issue/' + ticketNumber,
  headers: {
    'Content-type': 'application/json'
  },
  auth: {
    'user': 'p.myagkov@mail.msk',
    'pass': 'Make@Deardeer',
  }

}, function (error, response, body) {
  if (response.statusCode === 200){
    var ticket = body;

    if (typeof body === 'string') {
      ticket = JSON.parse(body);
    }

    var item = new alfredo.Item({
      title: ticket.fields.summary,
      arg: ticketNumber
    });

    var items = [item];

    var comments = ticket.fields.comment.comments;
    var i = 1, comment;
    while (i <= 20 && comments.length - i > 0) {
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
