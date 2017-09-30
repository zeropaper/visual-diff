const VisualDiff = require('./../../index');
const isSync = browser.options.sync === true;

describe('wdio sync testing', () => {
  let vd;

  before(() => {
    vd = new VisualDiff(browser);
    browser.url('/');
    browser.pause(1000);
  });

  it('is running in sync mode', function() {
    if (!isSync) throw new Error('Not running in sync');
  });

  it('diffs all resolutions', () => {
    const now = Date.now();
    const minTimeNeeded = 500 * Object.keys(vd.resolutions).length;
    vd.shootAll('sync', 500);
    const timeUsed = Date.now() - now;
    console.info('timeUsed, minTimeNeeded', timeUsed, minTimeNeeded);
    if (timeUsed < minTimeNeeded) throw new Error(`Took only ${timeUsed}ms (on ${minTimeNeeded}ms)`);
  });
});