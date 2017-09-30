const assert = require('assert');

const toResolve = (value) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(value);
    }, 20);
  });
};

const toReject = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      return reject(new Error('Reject by design'));
    }, 20);
  });
};


const asyncAllResolve = async (x = 1) => {
  return [
    await toResolve(1 * x),
    await toResolve(2 * x),
    await toResolve(3 * x),
  ];
};


describe('Promises hell', () => {
  describe('Promise.all()', () => {
    it('ends when all promises are resolved', (done) => {
      Promise.all([
        toResolve(1),
        toResolve(2),
        toResolve(3),
      ])
      .then((...args) => {
        // console.info('resolved values', ...args);
        done();
      })
      .catch(done);
    });


    it('fails when 1 promise is rejected', (done) => {
      Promise.all([
        toResolve(1),
        toResolve(2),
        toReject(),
      ])
      .then((...args) => {
        done(new Error('Should be rejected'));
      })
      .catch((err) => {
        assert(err);
        done();
      });
    });
  });


  describe('async function', () => {
    it('returns a promise', (done) => {
      const promise = asyncAllResolve();
      assert.equal(typeof promise.then, 'function', '.then is a function');
      assert.equal(typeof promise.catch, 'function', '.catch is a function');

      promise
      .then((...args) => {
        // console.info('resolved values', ...args);
        done();
      })
      .catch(done);
    });
  });


  describe('async function in Mocha', () => {
    it('can be used as callback for "it"', async function() {
      this.slow(2000);

      const started = Date.now();
      const result = await asyncAllResolve(2);
      const duration = Date.now() - started;
      // console.info('duration', duration);

      assert.ok(duration >= 60, 'time taken is longer or equal to 60ms');
      assert.equal(result[0], 2);
      assert.equal(result[1], 4);
      assert.equal(result[2], 6);
    });

    xit('fails when an error is thrown', async () => {
      const result = await asyncAllResolve(2);
      throw new Error(`Arbitrary error, ${result.join(', ')}`);
    });

    xit('can fail', toReject);
  });
});