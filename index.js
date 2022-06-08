

class myPromise {
  constructor(executor) {
    this.initValue()
    this.initBind()
    try {
      executor(this.resolve, this.reject)
      // executor.call(this, this.resolve, this.reject)
    } catch (err) {
      this.reject(err)
    }
  }
  initValue() {
    this.promiseResult = null;
    this.promiseStatus = 'pending';
    this.fulfilledCallbacks = [];
    this.rejectedCallbacks = [];
    this.finallyCallbacks = [];
    this.catchCallbacks = [];
  }
  initBind() {
    this.resolve = this.resolve.bind(this)
    this.reject = this.reject.bind(this)
    this.then = this.then.bind(this)
    this.finally = this.finally.bind(this)
    this.catch = this.catch.bind(this)
  }
  finally(finallyCallback) {
    finallyCallback = typeof finallyCallback === 'function' ? finallyCallback : (() => this.promiseResult);
    const finallyPromise = new myPromise((_resolve, _reject) => {
      // catch是无论内部是否有错误，返回的promise状态都是成功的
      const resolvePromise = (cb) => {
        try {
          const t = cb(this.promiseResult)
          if (t instanceof myPromise) {
            t.then(_resolve, _reject)
          } else {
            _resolve(t)
          }
        } catch (err) {
          _reject(err)
        }
      }
      if (this.promiseStatus === 'rejected' || this.promiseStatus === 'fulfilled') {
        resolvePromise(finallyCallback)
      } else {
        this.finallyCallbacks.push(function () { resolvePromise(finallyCallback) })
      }
    })
    return finallyPromise;
  }
  static catchGlobaCallbacks = []
  catch(catchCallback) {
    catchCallback = typeof catchCallback === 'function' ? catchCallback : (() => this.promiseResult);
    this.catchCallbacks.push(function () { resolvePromise(catchCallback) })
    const catchPromise = new myPromise((_resolve, _reject) => {
      // catch是无论内部是否有错误，返回的promise状态都是成功的
      const resolvePromise = (cb) => {
        try {
          // 如果是pending表示catch不是正常执行到的，而是跨then执行，也就是上一个then中的promise还没有被执行
          // 这个时候应该直接抛出保存的全局catch错误
          const t = cb(this.promiseStatus === 'pending' ? myPromise.catchGlobalError : this.promiseResult)
          console.log('t', t, this.promiseResult);
          if (t instanceof myPromise) {
            t.then(_resolve, _reject)
          } else {
            _resolve(t)
          }
        } catch (err) {
          _reject(err)
        }
      }
      if (this.promiseStatus === 'fulfilled') {
        return;
      } else if (this.promiseStatus === 'rejected') {
        resolvePromise(catchCallback)
      } else {
        console.log('进行catch',);
        myPromise.catchGlobalProp = [resolvePromise.bind(this, catchCallback)]
        // myPromise.catchGlobalProp.push(function () { resolvePromise(catchCallback) })
      }
    })
    return catchPromise;
  }
  resolve(res) {
    if (this.promiseStatus !== 'pending') return;
    this.promiseResult = res;
    this.promiseStatus = 'fulfilled'
    while (this.fulfilledCallbacks.length) {
      this.fulfilledCallbacks.shift()(this.promiseResult)
    }
    // 如果没有fulfilledCallbacks里的数组被执行完且存在finally的时候触发
    if (!this.fulfilledCallbacks.length && this.finallyCallbacks.length) {
      return this.finallyCallbacks.shift()(this.promiseResult)
    }
  }
  reject(err) {
    if (this.promiseStatus !== 'pending') return;
    this.promiseResult = err;
    this.promiseStatus = 'rejected'
    while (this.rejectedCallbacks.length) {
      this.rejectedCallbacks.shift()(this.promiseResult)
    }
    console.log('myPromise.catchGlobalProp', `|${myPromise.catchGlobalProp}|`);
    if (!this.rejectedCallbacks.length && myPromise.catchGlobalProp.length) {
      return myPromise.catchGlobalProp.shift()(this.promiseResult)
    }
    if (!this.rejectedCallbacks.length && this.finallyCallbacks.length) {
      return this.finallyCallbacks.shift()(this.promiseResult)
    }
  }
  then(resolve, reject) {
    const self = this;

    // 这里的this是外层promise的this，无需多言
    // 这个resolve是本次then的resolve
    const resolveCallback = resolve;
    // 这个promise里的resolve是本次then之后返回的promise里的resolve
    // 也就是是本次then之后then的callback
    const thenPromise = new myPromise((_resolve, _reject) => {
      const self = this;
      // 这里的this依然是外层promise的this，因为箭头函数自动绑定this
      // 或者写成 (function(_resolve,_reject){}).bind(this)
      const resolvePromise = (cb) => {
        // cb = typeof cb === 'function' ? cb : (() => this.promiseResult);
        let _cb = typeof cb === 'function' ? cb : (() => cb);
        // 这里的this依然还是是外层promise的this，因为箭头函数自动定义函数时外部的this，针对执行resolvePromise时this变化的情况
        try {
          const t = _cb(this.promiseResult)
          if (t instanceof myPromise) {
            // 说明返回的是myPromise
            t.then(_resolve, _reject)
          } else {
            // 如果是非promise默认成功，直接执行到下一个then的resolve
            _resolve(t)
          }
        } catch (err) {
          if (thenPromise.rejectedCallbacks.length) {
            _reject(err)
          } else if (!thenPromise.rejectedCallbacks.length && myPromise.catchGlobalProp.length) {
            myPromise.catchGlobalError = err;
            thenPromise.reject(err)
            // return myPromise.catchGlobalProp.shift()(err)
          }
        }
      }

      if (this.promiseStatus === 'fulfilled') {
        resolvePromise(resolveCallback)
      } else if (this.promiseStatus === 'rejected') {
        resolvePromise(reject)
      } else {
        // 这里的关键不是bind this（当然，前提是前面resolvePromise要是箭头函数，或者已经手动绑定过this了），而是既要将resolveCallback或reject传入resovlePromise，又要不执行
        // 我们尝试了以下三种写法，都是没问题的，我们随便用一种写法
        // 思考以下，为什么不bind this的情况下，this依然可以指到外层promise？
        // 因为resolvePromise(xx)被传入到数组中，真正执行时依然是在外层promise的resolve中，所以这个时候this依然执行外层promise
        // this.fulfilledCallbacks.push(function () { resolvePromise(resolveCallback) })
        // this.fulfilledCallbacks.push(() => resolvePromise(resolveCallback))
        resolveCallback && this.fulfilledCallbacks.push(resolvePromise.bind(this, resolveCallback))


        reject && this.rejectedCallbacks.push(resolvePromise.bind(this, reject))
        // this.rejectedCallbacks.push(pushFn)
        // this.rejectedCallbacks.push(function () { resolvePromise(reject) })
      }
    })
    return thenPromise;
  }
}

console.log('11')
const test = new myPromise((resolve, reject) => {
  setTimeout(() => {
    resolve('是是是')
  }, 1000)
})
  .then((res) => {
    console.log('第一个then的打印', res)
    // throw('sdd')
    // return {}
    return 1
  })
  // .then(
  //   function (res) {
  //     console.log('第二个then的打印', res)
  //     // return 2
  //     // throw ('第二个then的throw')
  //     return new myPromise((resolve, reject) => {
  //       // reject('错误')
  //       setTimeout(() => {
  //         resolve('我是第二个then的promiseResult')
  //       }, 1000);
  //     })
  //   },
  //   err => console.log('我是第二个then的catch', err)
  // )
  .then(
    function (res) {
      console.log('我是第三个then的打印', res)
      // throw('错误')
      console.log('1',);
    },
    err => console.log('我是第三个then的catch', err)
  )
  .then(
    res => {
      console.log('我是第四个then的打印', res)
    },
    // err => console.log('我是第四个catch', err)
  )
  .catch(err => console.log('我是catch', err))
  .then(res => console.log('catch之后的then', res), err => console.log('catch之后的catch', err))
  .finally(() => console.log('finaly-then'))
  .then(res => console.log('final-after-then'), err => console.log('final-after-catch'))

// console.log(test)
console.log('22')
