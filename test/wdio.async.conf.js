const wdioConf = require('./wdio.baseconf');
wdioConf.config.sync = false;
wdioConf.config.specs = [
  './test/async/**/*.js'
];
wdioConf.config.baseUrl = 'http://localhost:8888';
wdioConf.config.staticServerPort = 8888;
module.exports = wdioConf;