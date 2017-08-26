var log4js = require('log4js');

log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file('logs/api.log'), 'api-log');


var logger = log4js.getLogger('api-log');
logger.setLevel('DEBUG');

module.exports = logger;