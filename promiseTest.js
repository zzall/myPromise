

const promise = new Promise((resolve, reject) => {
  resolve('aaa')
})
  // .then(() => { clg() }, () => { console.log('then-catch') })
  // .then(() => { cl2g() }, () => { console.log('then2-catch') })
  .then(() => { console.log() }, () => { console.log('then3-catch') })
  .then(() => { clg() }, () => { console.log('then-catch') })
  .then(() => { console.log() })
  .then(() => { console.log() })
  .then(() => { console.log(), () => { console.log('then33-catch') } })
  .catch((err) => console.log('catch', err), (err) => console.log('cathc的err'))
  .catch((err) => console.log('catch2', err), (err) => console.log('cathc的err2'))
  // .then(() => console.log('catch之后的then'), err => console.log('catch after catch'))
  .finally(() => console.log('finaly-then'))
  .then(res => console.log('final-after-then'), err => console.log('final-after-catch'))

console.log(promise)