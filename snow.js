var program = require('commander');
var commands = require('./commands');

program
  .version('0.0.1')
  .option('--host <host>', 'ServiceNow instance (i.e. dev0000.servicenow.com)')
  .option('--user <user>', 'user name')
  .option('--password <password>', 'password')
  .option('--output <output>', 'output format (json, csv)');

program.parse(process.argv);

if (!program.host) {
  console.log('\n error: missing required argument \'host\' \n');
  process.exit(1);
}

if (!program.user) {
  console.log('\n error: missing required argument \'user\' \n');
  process.exit(1);
}

if (!program.password) {
  console.log('\n error: missing required argument \'password\' \n');
  process.exit(1);
}

if (program.output && program.output !== 'json' && program.output !== 'csv') {
  console.log('\n error: unkown output format \n');
  process.exit(1);
}