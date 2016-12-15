var program = require('commander');
var request = require('superagent');

function list(table, options) {
    var top = options.top || 10;
    request
        .get(`https://${program.host}/api/now/table/${table}?sysparm_limit=${top}`)
        .auth(program.user, program.pass)
        .set('Accept', 'application/json')
        .end(showResults);
}

function showResults(err, res) {
    if (err) {
        return console.log(err);
    }
    console.log(JSON.stringify(res.body, null, 2));
}

module.exports = list;