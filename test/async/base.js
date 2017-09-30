const VisualDiff = require('./../../index');
const isAsync = browser.options.sync === false;

describe('wdio async testing', () => {
  let vd;

  before(async function(){
    vd = new VisualDiff(browser);
    await browser.url('/');
    await browser.pause(1000);
  });

  it('is running in async mode', function() {
    if (!isAsync) throw new Error('Not running in async');
  });

  xit('diffs all resolutions', function() {
    const now = Date.now();
    const minTimeNeeded = 500 * Object.keys(vd.resolutions).length;
    return vd.shootAll('async', 500)
      .then(() => {
        const timeUsed = Date.now() - now;
        console.info('timeUsed, minTimeNeeded', timeUsed, minTimeNeeded);
        if (timeUsed < minTimeNeeded) throw new Error(`Took only ${timeUsed}ms (on ${minTimeNeeded}ms)`);
      })/*
      .catch((err) => { throw err; })*/;
  });
});