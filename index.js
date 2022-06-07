

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
  }
  initBind() {
    this.resolve = this.resolve.bind(this)
    this.reject = this.reject.bind(this)
    this.then = this.then.bind(this)
  }
  resolve(res) {
    if (this.promiseStatus !== 'pending') return;
    this.promiseResult = res;
    this.promiseStatus = 'fulfilled'
    while (this.fulfilledCallbacks.length) {
      this.fulfilledCallbacks.shift()(this.promiseResult)
    }
  }
  reject(err) {
    if (this.promiseStatus !== 'pending') return;
    this.promiseResult = err;
    this.promiseStatus = 'rejected'
    while (this.rejectedCallbacks.length) {
      // (this.promiseResult)
      this.rejectedCallbacks.shift()(this.promiseResult)
    }
  }
  then(resolve, reject) {
    // 这里的this是外层promise的this，无需多言
    // 这个resolve是本次then的resolve
    const resolveCallback = resolve;
    // 这个promise里的resolve是本次then之后返回的promise里的resolve
    // 也就是是本次then之后then的callback
    const thenPromise = new myPromise((_resolve, _reject) => {
      // 这里的this依然是外层promise的this，因为箭头函数自动绑定this
      // 或者写成 (function(_resolve,_reject){}).bind(this)
      const resolvePromise = (cb) => {
        // 这里的this依然还是是外层promise的this，因为箭头函数自动定义函数时外部的this，针对执行resolvePromise时this变化的情况
        try {
          const t = cb(this.promiseResult)
          if (t instanceof myPromise) {
            // 说明返回的是myPromise
            t.then(_resolve, _reject)
          } else {
            _resolve(t)
          }
        } catch (err) {
          // 如果then中传入的resolve方法体中有报错，则先执行本次then的reject
          reject(err)
          // 然后再触发下一个then的catch
          _reject(err)
          // throw new Error(err)
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
        this.fulfilledCallbacks.push(resolvePromise.bind(this, resolveCallback))


        // this.rejectedCallbacks.push(resolvePromise.bind(this, reject))
        // this.rejectedCallbacks.push(pushFn)
        this.rejectedCallbacks.push(function () { resolvePromise(reject) })
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
  .then(
    function (res) {
      console.log('第二个then的打印', res)
      // return 2
      // throw ('第二个then的throw')
      return new myPromise((resolve, reject) => {
        // reject('错误')
        setTimeout(() => {
          resolve('我是第二个then的promiseResult')
        }, 1000);
      })
    },
    err => console.log('我是第二个then的catch', err)
  )
  .then(
    function (res) {
      console.log('我是第三个then的打印', res)
      reject('错误')
    },
    err => console.log('我是第三个then的catch', err)
  )
  .then(
    res => {
      console.log('我是第四个then的打印', res)
    },
    err => console.log('我是第四个catch', err)
  )
// console.log(test)
console.log('22')


