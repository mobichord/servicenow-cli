var program = require('commander');
var compare = require('./modules/compare');
var list = require('./modules/list');

program
  .version('0.0.1')
  .option('-H, --host <host>', 'ServiceNow host (i.e. dev0000.servicenow.com)')
  .option('-u, --user <user>', 'user name')
  .option('-p, --pass <pass>', 'password');

program
  .command('compare <host> <user> <pass>')
  .description('Compare two ServiceNow instances')
  .action(compare);

program
  .command('list <table>')
  .description('Compare two ServiceNow instances')
  .option('--top <top>', 'Return <top> records only. Default - 10')
  .action(list);

  program.parse(process.argv);
