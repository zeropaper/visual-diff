const fs = require('fs');
const path = require('path');
const resemble = require('node-resemble-v2');
const saveReference = !!process.env.TEST_SAVE_BASELINE;
const mkdirp = require('mkdirp');
const asyncMap = require('async').map;


const readFile = fs.readFileSync;
function writeFile(destination, data) {
  try {
    fs.unlinkSync(destination);
  } catch(up) {/* vale ist ne dreck sau */}

  mkdirp.sync(path.dirname(destination));
  fs.writeFileSync(destination, data);
}


module.exports = class VisualDiff {
  constructor(driver, shotsPath = 'shots', referencesPath = 'references', tolerance = 5) {
    this.driver = driver;
    this.referencesPath = referencesPath;
    this.shotsPath = shotsPath;
    this.tolerance = tolerance;
    this.resolutions = {
      'ipad-p': [768, 1024],
      'ipad-l': [1024, 768],
      'galaxy-s5-p': [360, 640],
      'galaxy-s5-l': [640, 360],
      'iphone-6-p': [375, 667],
      'iphone-6-l': [667, 375]
    };

    mkdirp.sync(this.referencesPath);
    mkdirp.sync(this.shotsPath);
  }

  get syncMode() {
    return this.driver.options.sync;
  }

  get browserName() {
    return this.driver.desiredCapabilities.browserName.toLowerCase();
  }

  getReference(testName, resolution) {
    const refPath = this.referenceFilepath(testName, resolution);
    let ref;
    try {
      ref  = readFile(refPath);
    } catch(up) {/*  */}
    return ref;
  }

  shotFilename(testName, resolution) {
    return `${testName}--${this.browserName}--${resolution}.png`;
  }

  shotFilepath(testName, resolution) {
    return path.join(this.shotsPath, this.shotFilename(testName, resolution));
  }

  diffFilepath(testName, resolution) {
    return path.join(this.shotsPath, 'diff-' +this.shotFilename(testName, resolution));
  }

  baselineFilepath(testName, resolution) {
    return path.join(this.shotsPath, 'bl-' +this.shotFilename(testName, resolution));
  }

  referenceFilepath(testName, resolution) {
    return path.join(this.referencesPath, this.shotFilename(testName, resolution));
  }

  addHTML(testName) {
    if (!this.shotsPath) return;

    const images = Object.keys(this.resolutions)
      .map(r => this.shotFilename(testName, r));
    const htmlFile = readFile(path.join(__dirname, 'src', 'index.html')).toString()
      .split('var images = [];')
      .join('var images = ' + JSON.stringify(images) + ';');

    writeFile(path.join(this.shotsPath, `${testName}--${this.driverName}.html`), htmlFile);
  }

  shootAll(testName, timeout = 0) {
    this.addHTML(testName);
    const resolutions = this.resolutions;

    return Promise.all(Object.keys(this.resolutions)
            .map(resolution => this.shoot(testName, resolution, timeout)));
  }

  async asyncShoot(testName, resolution, timeout = 0) {
    const referenceFilepath = this.referenceFilepath(testName, resolution);
    const baselineFilepath = this.baselineFilepath(testName, resolution);
    const shotFilepath = this.shotFilepath(testName, resolution);
    const size = {
      width: this.resolutions[resolution][0],
      height: this.resolutions[resolution][1]
    };
    const reference = this.getReference(testName, resolution);

    await this.driver.windowHandleSize(size);

    await this.driver.pause(timeout);

    if (!reference) {
      return this.driver.saveScreenshot(referenceFilepath);
    }

    writeFile(baselineFilepath, reference);

    const screenshot = await this.driver.saveScreenshot(shotFilepath);

    return this.compare(testName, resolution, screenshot, reference);
  }

  shoot(testName, resolution, timeout = 0) {
    if (!this.syncMode) {
      return this.asyncShoot(testName, resolution, timeout);
    }

    const referenceFilepath = this.referenceFilepath(testName, resolution);
    const baselineFilepath = this.baselineFilepath(testName, resolution);
    const shotFilepath = this.shotFilepath(testName, resolution);
    const size = {
      width: this.resolutions[resolution][0],
      height: this.resolutions[resolution][1]
    };
    const reference = this.getReference(testName, resolution);

    this.driver.windowHandleSize(size);

    this.driver.pause(timeout);

    if (!reference) {
      return this.driver.saveScreenshot(referenceFilepath);
    }

    writeFile(baselineFilepath, reference);

    const screenshot = this.driver.saveScreenshot(shotFilepath);

    return this.compare(testName, resolution, screenshot, reference);
  }

  compare(testName, resolution, screenshot, reference) {
    const tolerance = this.tolerance;
    const shotFilename = this.shotFilename;
    const diffFilepath = this.diffFilepath(testName, resolution);

    return new Promise((resolve, reject) => {
      resemble(screenshot)
        .compareTo(reference)
        .onComplete((data) => {
          if (data.rawMisMatchPercentage > tolerance) {
            console.info('BAAAAAMMMM', testName, resolution, data.rawMisMatchPercentage);
            fs.writeFile(diffFilepath, data.getBuffer(), err => {
              if (err) return reject(err);
              reject(new Error(`The ${data.misMatchPercentage}% mismatching exceeds the ${tolerance}% tolerance for ${testName} (${resolution})`));
            });
          }
          else {
            resolve();
          }
        });
    });
  }
};