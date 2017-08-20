'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.isEmpty = exports.isLoaded = exports.snapshotToJS = exports.dataToJS = exports.customToJS = exports.pathToJS = exports.toJS = undefined;

var _lodash = require('lodash');

var fixPath = function fixPath(path) {
    return (path.substring(0, 1) === '/' ? '' : '/') + path;
};

var toJS = exports.toJS = function toJS(data) {
    if (data && data.toJS) {
        return data.toJS();
    }

    return data;
};

var pathToJS = exports.pathToJS = function pathToJS(data, path, notSetValue) {
    if (!data || !path) {
        return notSetValue;
    }

    var pathArr = fixPath(path).split(/\//).slice(1);

    if (data.getIn) {
        return toJS(data.getIn(pathArr, notSetValue));
    }

    return data;
};

var customToJS = exports.customToJS = function customToJS(data, path, custom) {
    var notSetValue = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : undefined;
    var takeRaw = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;

    if (!(data && data.getIn) || !path) {
        return notSetValue;
    }

    var customPath = '/' + custom + fixPath(path);

    var pathArr = customPath.split(/\//).slice(1);

    if (data.getIn) {
        var retVal = toJS(data.getIn(pathArr, notSetValue));

        if (retVal) {
            retVal = takeRaw ? retVal : retVal[custom];
        }

        return retVal;
    }

    return data;
};

var dataToJS = exports.dataToJS = function dataToJS(data, path, notSetValue) {
    if (!(data && data.getIn) || !path) {
        return notSetValue;
    }

    var dataPath = '/data' + fixPath(path);

    var pathArr = dataPath.split(/\//).slice(1);

    if (data.getIn) {
        var retVal = toJS(data.getIn(pathArr, notSetValue));

        if (retVal) {
            retVal = retVal['data'];
        }

        return retVal;
    }

    return data;
};

var snapshotToJS = exports.snapshotToJS = function snapshotToJS(snapshot, path, notSetValue) {
    if (!(snapshot && snapshot.getIn) || !path) {
        return notSetValue;
    }

    var snapshotPath = '/snapshot' + fixPath(path);

    var pathArr = snapshotPath.split(/\//).slice(1);

    if (snapshot.getIn) {
        var retVal = toJS(snapshot.getIn(pathArr, notSetValue));

        if (retVal) {
            retVal = retVal['snapshot'];
        }

        return retVal;
    }

    return snapshot;
};

var isLoaded = exports.isLoaded = function isLoaded() {
    if (!arguments || !arguments.length) {
        return true;
    }

    return (0, _lodash.map)(arguments, function (a) {
        return a !== undefined;
    }).reduce(function (a, b) {
        return a && b;
    });
};

var isEmpty = exports.isEmpty = function isEmpty(data) {
    return !(data && (0, _lodash.size)(data));
};

exports.default = { pathToJS: pathToJS, dataToJS: dataToJS, snapshotToJS: snapshotToJS, isLoaded: isLoaded, isEmpty: isEmpty, customToJS: customToJS };