var Promise = require("../promise.js").Promise;

(function() {

  'use strict';

  var fullfiled = function(value) {
    var promise = new Promise();
    promise.fulfill(value);
    return promise;
  };

  var rejected = function(reason) {
    var promise = new Promise();
    promise.reject(reason);
    return promise;
  };

  var pending = function() {
    var promise = new Promise();
    return {
      "promise" : promise,
      "fulfill" : function(value) { promise.fulfil(value); },
      "reject" : function(reason) { promise.reject(reason); }
    };
  };

  exports.fullfiled = fullfiled;
  exports.rejected = rejected;
  exports.pending = pending;

}).call(this);