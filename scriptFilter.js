var AlfredError = require('./AlfredError');
var argv = require('minimist')(process.argv.slice(2));

(() => {
  var configObj = require('./config').read();
  let query

  if (!argv['_'].length) {
    return Promise.resolve({
      title: 'No query passed'
    });
  }

  query = argv['_'][0]

  return new Promise((resolve, reject) => {
    if (!argv['_'].length) {
      resolve({
        title: 'No query passed'
      });
    }

    if (configObj instanceof AlfredError) {
      resolve({
        response: configObj,
      });
    } else {
      return require('./getTicketInfo')(query, configObj)
        .then(resolve)
    }
  }).then((result) => {
    const { response, issue_key, issue_text } = result
    // console.log('5', result)
    if (!query) {
      return
    }

    let payload = {
      items: response,
    }

    if (issue_key) {
      payload = {
        ...payload,
        variables: {
          issue_link: `${ configObj.baseUrl }/browse/${ issue_key }`,
          issue_key,
          issue_text,
        },
      }
    }

    console.log(JSON.stringify(payload))
  })
})()


