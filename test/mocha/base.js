const assert = require('assert');
const fs = require('fs');
const util = require('util');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');
const VisualDiff = require('./../../index');
const testDirectory = __dirname + '/test-dir';
const imageData = fs.readFileSync(__dirname + '/image.png')

const mockRefs = (vd, testName) => {
  Object.keys(vd.resolutions).map((resolution) => {
    return fs.writeFileSync(`${vd.referencesPath}/${testName}--${vd.browserName}--${resolution}.png`, imageData);
  });
};
const makeTestDir = (directory, callback) => {
  rimraf(directory, (err) => {
    if (err) return callback(err);
    mkdirp(directory, callback);
    // mkdirp(directory, () => {
    //   if (err) return callback(err);
    //   fs.writeFile(directory + '/empty.txt', '', callback);
    // });
  });
};
const asyncMakeTestDir = util.promisify(makeTestDir);

const pause = (time) => {
  return new Promise((resolve/*, reject*/) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};

const saveScreenshot = (destination) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      fs.writeFile(destination, imageData, (err) => {
        // if (err) return reject(err);
        resolve(imageData);
      });
    }, 50);
  });
};

const windowHandleSize = (size) => {
  return new Promise((resolve/*, reject*/) => {
    setTimeout(() => {
      resolve();
    }, 50);
  });
};

const asyncBrowserMock = {
  options: {
    sync: false
  },
  desiredCapabilities: {
    browserName: 'asyncMock'
  },
  pause,
  saveScreenshot,
  windowHandleSize
};

const syncBrowserMock = {
  options: {
    sync: true
  },
  desiredCapabilities: {
    browserName: 'syncMock'
  },
  pause,
  saveScreenshot,
  windowHandleSize
};


describe('VisualDiff class', () => {

  describe('async', function() {
    const testDir = testDirectory + '-async';
    let vd;

    before((done) => {
      vd = new VisualDiff(asyncBrowserMock, testDir + '/shots', testDir + '/refs');
      asyncMakeTestDir(vd.referencesPath)
        .then(() => {
          mockRefs(vd, 'async');
          done();
        })
        .catch(done);
    });

    it('has a browserName property', () => {
      assert.equal(vd.browserName, 'asyncmock');
    });

    it('works', function(done) {
      this.slow(2000);
      this.timeout(4000);

      vd.shootAll('async', 100)
        .then(() => { done(); })
        .catch(done);
    });
  });


  describe('sync', function() {
    const testDir = testDirectory + '-sync';
    let vd;

    before((done) => {
      vd = new VisualDiff(syncBrowserMock, testDir + '/shots', testDir + '/refs');
      asyncMakeTestDir(vd.referencesPath)
        .then(() => {
          mockRefs(vd, 'sync');
          done();
        })
        .catch(done);
    });

    it('has a browserName property', () => {
      assert.equal(vd.browserName, 'syncmock');
    });

    it('works', function(done) {
      this.slow(2000);
      this.timeout(4000);

      vd.shootAll('sync', 100)
        .then(() => { done(); })
        .catch(done);
    });
  });
});
