var program = require('commander');
var request = require('superagent');
var csv = require('csv');

program
  .command('list')
  .description('Compare two ServiceNow instances')
  .option('--table <table>', 'table name')
  .option('--query [query]', 'query')
  .option('--fields [fields]', 'comma separated list of fields')
  .option('--top [top]', 'return <top> records only')
  .action(list);

function list(options) {
    if (!options.table) {
        console.log('\n error: missing required argument \'table\' \n');
        process.exit(1);
    }

    var url = `https://${program.host}/api/now/table/${options.table}?`;
    if (options.fields) {
        url += `sysparm_fields=${options.fields.split(',')}&`;
    }
    if (options.query) {
        url += `sysparm_query=${options.query}&`;
    }
    if (options.top) {
        url += `sysparm_limit=${options.top}&`;
    }

    request
        .get(url)
        .auth(program.user, program.password)
        .set('Accept', 'application/json')
        .end(showResults);
}

function showResults(err, res) {
    if (err || !res.ok) {
        var error = (res.body.error) ? res.body.error.message : `error occured. status: ${res.status}`
        return console.log(`error: ${res.body.error.message}`);
    }

    if (program.output === 'csv') {
        csv.stringify(res.body.result, function(err, data){
            process.stdout.write(data);
        });
    }
    else {
        console.log(JSON.stringify(res.body.result, null, 2));
    }
}

module.exports = list;