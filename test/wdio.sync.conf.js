const wdioConf = require('./wdio.baseconf');
wdioConf.config.sync = true;
wdioConf.config.specs = [
  './test/sync/**/*.js'
];
wdioConf.config.baseUrl = 'http://localhost:9999';
wdioConf.config.staticServerPort = 9999;
module.exports = wdioConf;