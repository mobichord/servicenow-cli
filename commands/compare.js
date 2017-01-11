var program = require('commander');
var request = require('superagent');
var async = require('async');
var _ = require('lodash');
var csv = require('csv');

program
  .command('compare')
  .description('Compare two ServiceNow instances')
  .option('--target-host <targetHost>', 'ServiceNow instance to compare to  (i.e. dev0000.servicenow.com)')
  .option('--target-user <targetUser>', 'user name for the instance to compare to')
  .option('--target-password <targetPassword>', 'password for the instance to compare to')
  .option('--scope [scope]', 'application scope to compare')
  .action(compare);

function compare(options) {
    if (!options.targetHost) {
        console.log('\n error: missing required argument \'target-host\' \n');
        process.exit(1);
    }
    if (!options.targetUser) {
        console.log('\n error: missing required argument \'target-user\' \n');
        process.exit(1);
    }
    if (!options.targetPassword) {
        console.log('\n error: missing required argument \'target-password\' \n');
        process.exit(1);
    }

console.log(options.targetPassword);
    var filter = `sys_scope.scope=${options.scope}^sys_class_name!=sys_metadata_delete^ORsys_class_name=NULL`;

    var sourceFiles;
    var targetFiles;
    async.waterfall([
        function requestSource(callback) {
            console.log(`Retrieving application files form source: ${program.host}`);

            request
                .get(`https://${program.host}/api/now/table/sys_metadata?sysparm_query=${filter}`)
                .auth(program.user, program.password)
                .set('Accept', 'application/json')
                .end(function(err, res){
                    if (err || !res.ok) {
                        var error = (res.body.error) ? res.body.error.message : `error occured. status: ${res.status}`
                        return callback(res.body.error.message);
                    }

                    sourceFiles = res.body.result;
                    console.log(`${sourceFiles.length} entries found`);
                    callback(null);
                });
        },
        function requestTarget(callback) {
            console.log(`Retrieving application files form target: ${options.targetHost}`);

            request
                .get(`https://${options.targetHost}/api/now/table/sys_metadata?sysparm_query=${filter}`)
                .auth(options.targetUser, options.targetPassword)
                .set('Accept', 'application/json')
                .end(function(err, res){
                    if (err || !res.ok) {
                        var error = (res.body.error) ? res.body.error.message : `error occured. status: ${res.status}`
                        return callback(res.body.error.message);
                    }

                    targetFiles = res.body.result;
                    console.log(`${targetFiles.length} entries found`);
                    callback(null);
                });
        }],
        function result(err) {
            if (err) {
                return console.log(err);
            }
    
            var source = _.chain(sourceFiles)
                .sortBy('sys_class_name')
                .keyBy('sys_update_name')
                .value();
            var target = _.chain(targetFiles)
                .sortBy('sys_class_name')
                .keyBy('sys_update_name')
                .value();

            var entries = [];
            var newEntries = 0;
            var changedEntries = 0;
            var deletedEntries = 0;

            _.each(source, function(entry, key) {
                if (!target[key]) {
                    deletedEntries++;

                    entries.push({
                        status: 'missing',
                        table: entry.sys_class_name,
                        name: entry.sys_name,
                        id: entry.sys_id,
                        update: key
                    });
                } else if (entry.sys_updated_on !== target[key].sys_updated_on) {
                    changedEntries++;

                    entries.push({
                        status: 'changed',
                        table: entry.sys_class_name,
                        name: entry.sys_name,
                        id: entry.sys_id,
                        update: key
                    });
                }
            });

            _.each(target, function(entry, key) {
                if (!source[key]) {
                    newEntries++;

                    entries.push({
                        status: 'new',
                        table: entry.sys_class_name,
                        name: entry.sys_name,
                        id: entry.sys_id,
                        update: key
                    });
                }
            });

            if (program.output === 'csv') {
                csv.stringify(entries, function(err, data){
                    process.stdout.write(data);
                });
            }
            else {
                console.log(JSON.stringify(entries, null, 2));
            }

            console.log(`New entries ${newEntries}`);
            console.log(`Changed entries ${changedEntries}`);
            console.log(`Deleted entries ${deletedEntries}`);
        }
    );
}

module.exports = compare;