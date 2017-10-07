const assert = require('assert');
const fs = require('fs');
const util = require('util');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');
const VisualDiff = require('./../../index');
const testDirectory = __dirname + '/test-dir';
const imageData = fs.readFileSync(__dirname + '/image.png')
const wrongImageData = fs.readFileSync(__dirname + '/wrong.png')

const mockRefs = (vd, testName) => {
  Object.keys(vd.resolutions).map((resolution) => {
    return fs.writeFileSync(`${vd.referencesPath}/${testName}--${vd.browserName}--${resolution}.png`, imageData);
  });
};
const makeTestDir = (directory, callback) => {
  rimraf(directory, (err) => {
    if (err) return callback(err);
    mkdirp(directory, callback);
  });
};
const asyncMakeTestDir = util.promisify(makeTestDir);

const pause = (time) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};

const saveScreenshot = (destination) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      fs.writeFile(destination, imageData, (err) => {
        resolve(imageData);
      });
    }, 50);
  });
};

const windowHandleSize = (size) => {
  return new Promise((resolve) => {
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


describe('VisualDiff class', function() {
  this.slow(2000);
  this.timeout(4000);

  describe('async', () => {
    const testDir = testDirectory + '-async';
    let vd;

    before((done) => {
      vd = new VisualDiff(asyncBrowserMock, testDir + '/shots', testDir + '/refs');
      vd.resolutions = {
        landscape: {width: 320, height: 240},
        portrait: {width: 240, height: 320}
      };

      asyncMakeTestDir(vd.referencesPath)
        .then(() => {
          mockRefs(vd, 'async');
          done();
        })
        .catch(done);
    });

    it('has the given resolutions', () => {
      assert.ok(vd.resolutions.landscape, 'landscape is present');
      assert.ok(vd.resolutions.portrait, 'portrait is present');
    });

    it('has a browserName property', () => {
      assert.equal(vd.browserName, 'asyncmock');
    });

    it('can compare 2 images', (done) => {
      vd.compare('async', 'arbitrary', imageData, wrongImageData)
        .then(() => {
          done(new Error('Should have fail'));
        })
        .catch(() => {
          vd.compare('async', 'arbitrary', imageData, imageData)
            .then(() => { done(); })
            .catch(done);
        });
    });

    it('compares all resolutions', (done) => {
      vd.shootAll('async')
        .then(() => { done(); })
        .catch(done);
    });
  });


  describe('sync', () => {
    const testDir = testDirectory + '-sync';
    let vd;

    before((done) => {
      vd = new VisualDiff(syncBrowserMock, testDir + '/shots', testDir + '/refs');
      vd.resolutions = {
        landscape: {width: 320, height: 240},
        portrait: {width: 240, height: 320}
      };

      asyncMakeTestDir(vd.referencesPath)
        .then(() => {
          mockRefs(vd, 'sync');
          done();
        })
        .catch(done);
    });

    it('has the given resolutions', () => {
      assert.ok(vd.resolutions.landscape, 'landscape is present');
      assert.ok(vd.resolutions.portrait, 'portrait is present');
    });

    it('has a browserName property', () => {
      assert.equal(vd.browserName, 'syncmock');
    });

    it('can compare 2 images', () => {
      vd.compare('sync', 'arbitrary', imageData, wrongImageData);
    });

    xit('compares all resolutions', () => {
      vd.shootAll('sync');
    });
  });
});
