'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isEmpty = exports.isLoaded = exports.snapshotToJS = exports.dataToJS = exports.pathToJS = exports.toJS = undefined;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fixPath = function fixPath(path) {
  return (path.substring(0, 1) == '/' ? '' : '/') + path;
};

var toJS = exports.toJS = function toJS(data) {

  if (data && data.toJS) {
    return data.toJS();
  }

  return data;
};

var pathToJS = exports.pathToJS = function pathToJS(data, path, notSetValue) {
  if (!data) {
    return notSetValue;
  }

  var pathArr = fixPath(path).split(/\//).slice(1);

  if (data.getIn) {
    return toJS(data.getIn(pathArr, notSetValue));
  }

  return data;
};

var dataToJS = exports.dataToJS = function dataToJS(data, path, notSetValue) {
  if (!(data && data.getIn)) {
    return notSetValue;
  }

  var dataPath = '/data' + fixPath(path);

  var pathArr = dataPath.split(/\//).slice(1);

  if (data.getIn) {
    return toJS(data.getIn(pathArr, notSetValue));
  }

  return data;
};

var snapshotToJS = exports.snapshotToJS = function snapshotToJS(snapshot, path, notSetValue) {
  if (!(snapshot && snapshot.getIn)) {
    return notSetValue;
  }

  var snapshotPath = '/snapshot' + fixPath(path);

  var pathArr = snapshotPath.split(/\//).slice(1);

  if (snapshot.getIn) {
    return toJS(snapshot.getIn(pathArr, notSetValue));
  }

  return snapshot;
};

var isLoaded = exports.isLoaded = function isLoaded() {
  if (!arguments || !arguments.length) {
    return true;
  }

  return (0, _lodash2.default)(arguments).map(function (a) {
    return a === undefined ? false : true;
  }).reduce(function (a, b) {
    return a && b;
  });
};

var isEmpty = exports.isEmpty = function isEmpty(data) {
  return !(data && _lodash2.default.size(data));
};