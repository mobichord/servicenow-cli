var program = require('commander');
var request = require('superagent');
var async = require('async');
var _ = require('lodash');

function compare(host, user, pass) {
    var filter = 'sys_scope=58458eaa4f5a7100b722a5017310c7f2^sys_class_name!=sys_metadata_delete^ORsys_class_name=NULL';
    
console.log(user);

    var sourceFiles;
    var targetFiles;
    async.waterfall([
        function requestSource(callback) {
            console.log(`Retrieving application files form source: ${program.host}`);

            request
                .get(`https://${program.host}/api/now/table/sys_metadata?sysparm_query=${filter}`)
                .auth(program.user, program.pass)
                .set('Accept', 'application/json')
                .end(function(err, res){
                    if (err) {
                        return callback(err);
                    }

                    sourceFiles = res.body.result;
                    console.log(`${sourceFiles.length} entries found`);
                    callback(null);
                });
        },
        function requestTarget(callback) {
            console.log(`Retrieving application files form target: ${host}`);

            request
                .get(`https://${host}/api/now/table/sys_metadata?sysparm_query=${filter}`)
                .auth(user, pass)
                .set('Accept', 'application/json')
                .end(function(err, res){
                    if (err) {
                        return callback(err);
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

            var newEntries = [];
            var newEntriesCount = 0;
            var changedEntriesCount = 0;
            _.each(source, function(entry, key) {
                if (!target[key]) {
                    console.log('NEW',entry.sys_class_name, entry.sys_name , ' (' + key + ')');
                    newEntriesCount++;
                    newEntries.push(entry);
                } else {
                    if (entry.sys_updated_on !== target[key].sys_updated_on) {
                        console.log('CHANGED',entry.sys_class_name, entry.sys_name , ' (' + key + ')');
                        changedEntriesCount++;
                        newEntries.push(entry);
                    }
                }
            });

            console.log(`New entries ${newEntriesCount}`);
            console.log(`Changed entries ${changedEntriesCount}`);
        }
    );
}

module.exports = compare;