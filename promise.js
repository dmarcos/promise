(function() {

  'use strict';

  var Promise = function() {
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];
    this.linkedPromises = [];
    this.pending = true;
  };

  var isPseudoPromise = function(promise) {
    return (promise && promise.constructor !== Promise && typeof promise.then === 'function');
  };

  var isPromise = function(promise) {
    // It's Promise or pseudo promise
    return (promise && promise.constructor === Promise);
  }

  Promise.prototype.resolve = function(nextPromise, callback, value) {
    var currentPromise = this;
    return function() {
      var returnValue = value;
      try {
        if (callback && typeof callback === 'function') {
          returnValue = callback.apply(undefined, value || arguments);
          if (isPromise(returnValue) || isPseudoPromise(returnValue)) {
            linkPromises(returnValue, nextPromise);
          }
          else {
            nextPromise.fulfil(returnValue);
          }
        } else {
          linkPromises(currentPromise, nextPromise);
        }
      }
      catch(err) {
        nextPromise.reject(err);
        return;
      }
    };
  };

  var linkPromises = function(promiseA, promiseB) {
    if (isPseudoPromise(promiseA)) {
      promiseB.then = promiseA.then;
      return;
    }

    if (promiseA.pending) {
      promiseA.linkedPromises.push(promiseB);
      return;
    }
    if(promiseA.fulfilled) {
      promiseB.fulfil.apply(promiseB, promiseA.value);
      return;
    }
    if(promiseA.rejected) {
      promiseB.reject.apply(promiseB, promiseA.reason);
      return;
    }
  };

  Promise.prototype.then = function(onFulfilled, onRejected) {
    var nextPromise = new Promise();
    var value;
    var reason;

    if (this.fulfilled) {
      setTimeout(this.resolve(nextPromise, onFulfilled, this.value),0);
    } else {
      this.onFulfilledCallbacks.push(this.resolve(nextPromise, onFulfilled));
    }

    if (this.rejected) {
      setTimeout(this.resolve(nextPromise, onRejected, this.reason),0);
    } else {
      this.onRejectedCallbacks.push(this.resolve(nextPromise, onRejected));
    }

    return nextPromise;
  };

  Promise.prototype.fulfil = function() {
    var i;
    var linkedPromise;
    if (this.rejected) {
      return;
    }
    this.fulfilled = true;
    this.pending = false;
    this.value = arguments;

    for (i = 0; i < this.onFulfilledCallbacks.length; ++i) {
      this.onFulfilledCallbacks[i].apply(this, arguments);
    }
    this.onFulfilledCallbacks = [];

    for (i=0; i < this.linkedPromises.length; ++i) {
      linkedPromise = this.linkedPromises[i];
      linkedPromise.fulfil.apply(linkedPromise, arguments);
    }
    this.linkedPromises = [];

  }

  Promise.prototype.reject = function() {
    var i;
    var linkedPromise;
    if (this.fulfilled) {
      return;
    }
    this.reason = arguments;
    this.rejected = true;
    this.pending = false;
    for (i = 0; i < this.onRejectedCallbacks.length; ++i) {
      this.onRejectedCallbacks[i].apply(this, arguments);
    }
    this.onRejectedCallbacks = [];

    for (i=0; i < this.linkedPromises.length; ++i) {
      linkedPromise = this.linkedPromises[i];
      linkedPromise.reject.apply(linkedPromise, arguments);
    }
    this.linkedPromises = [];

  }

  this.Promise = Promise;

}).call(this);