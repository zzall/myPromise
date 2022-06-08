# myPromise


## catch

* catch是捕获之前then中的错误
* 如果之前每一个then中都传入了reject方法，则永远不会进入到catch
* 如果then1的resolve中有错误，则then1的reject不会执行，但是会执行then2的reject
* 但凡then有错误，都会被下一个then的reject中捕获到，如果下一个then没有定义reject，则会进入到catch
* catch也会返回一个promise
* catch返回的promise状态永远是成功状态fulfilled