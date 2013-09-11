(function() {

  'use strict';

  var Promise = function() {
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];
    this.linkedPromises = [];
    this.pending = true;
  };

  var isPromise = function(promise) {
    return promise && promise.constructor === Promise;
  }

  var isPseudoPromise = function(promise) {
    return promise && promise.constructor !== Promise && typeof promise.then == 'function';
  }

  var castPseudoPromise = function(pseudoPromise) {
    var promise = new Promise();
    promise.pseudo = true;
    promise.then = function(onFulfilledArg, onRejectedArg) {
      var onFulfilled = function() {
        return pseudoPromise.then(onFulfilledArg);
      };
      var onRejected = function() {
        return pseudoPromise.then(null, onRejectedArg);
      };
      this.prototype.then.apply(this, onFulfilled, onRejected);
    };
    return promise;
  }

  Promise.prototype.resolve = function(nextPromise, onFulfilled, onRejected) {
    var currentPromise = this;
    return function() {
      var returnValue;
      var callback;
      var value;
      try {
        if(currentPromise.fulfilled) {
          callback = onFulfilled;
          value = currentPromise.value;
        }
        if (currentPromise.rejected) {
          callback = onRejected;
          value = currentPromise.reason;
        }
        if (callback && typeof callback === 'function') {
          returnValue = callback.apply(undefined, value || arguments);
        } else {
          returnValue = currentPromise;
        }
        currentPromise.resolvePromise(nextPromise, returnValue, onFulfilled, onRejected);
      }
      catch(err) {
        nextPromise.reject(err);
        return;
      }
    };
  };

  Promise.prototype.resolvePromise = function(promise, value, onFulfilled, onRejected) {
    if (promise === value) {
      throw new TypeError('resolve: arguments cannot be the same object')
    }
    if(isPromise(value)) {
      if (value.pending) {
        value.linkedPromises.push(promise);
        return;
      }
      if(value.fulfilled) {
        promise.fulfil.apply(promise, value.value);
        return;
      }
      if(value.rejected) {
        promise.reject.apply(promise, value.reason);
        return;
      }
    } else if (isPseudoPromise(value)) {
      this.pseudo = value.then;
    } else {
      promise.fulfil(value);
    }

  };

  Promise.prototype.then = function(onFulfilled, onRejected) {
    var nextPromise = new Promise();
    nextPromise.new = true;
    var value;
    var reason;
    if (this.fulfilled || this.rejected) {
      setTimeout(this.resolve(nextPromise, onFulfilled, onRejected),0);
    } else {
      this.onFulfilledCallbacks.push(this.resolve(nextPromise, onFulfilled, onRejected));
      this.onRejectedCallbacks.push(this.resolve(nextPromise, onFulfilled, onRejected));
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