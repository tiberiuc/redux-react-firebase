'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _immutable = require('immutable');

var _constants = require('./constants');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var initialState = (0, _immutable.fromJS)({
    auth: undefined,
    authError: undefined,
    profile: undefined,
    data: {},
    snapshot: {},
    timestamp: {},
    requesting: {},
    requested: {}
});

var pathToArr = function pathToArr(path) {
    return path.split(/\//).filter(function (p) {
        return !!p;
    });
};

exports.default = function () {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : initialState;
    var action = arguments[1];
    var path = action.path,
        timestamp = action.timestamp,
        requesting = action.requesting,
        requested = action.requested;

    var pathArr = void 0;
    var rootPathArr = void 0;
    var retVal = void 0;

    var _ret = function () {
        switch (action.type) {

            case _constants.START:
                pathArr = pathToArr(path);

                pathArr.push('requesting');
                retVal = requesting !== undefined ? state.setIn(['requesting'].concat(_toConsumableArray(pathArr)), (0, _immutable.fromJS)(requesting)) : state.deleteIn(['requesting'].concat(_toConsumableArray(pathArr)));
                pathArr.pop();

                pathArr.push('requested');
                retVal = requested !== undefined ? retVal.setIn(['requested'].concat(_toConsumableArray(pathArr)), (0, _immutable.fromJS)(requested)) : retVal.deleteIn(['requested'].concat(_toConsumableArray(pathArr)));
                pathArr.pop();

                return {
                    v: retVal
                };

            case _constants.INIT_BY_PATH:
                pathArr = pathToArr(path);

                pathArr.push('data');
                retVal = state.deleteIn(['data'].concat(_toConsumableArray(pathArr)));
                pathArr.pop();

                pathArr.push('snapshot');
                retVal = retVal.deleteIn(['snapshot'].concat(_toConsumableArray(pathArr)));
                pathArr.pop();

                pathArr.push('timestamp');
                retVal = retVal.deleteIn(['timestamp'].concat(_toConsumableArray(pathArr)));
                pathArr.pop();

                pathArr.push('requesting');
                retVal = retVal.deleteIn(['requesting'].concat(_toConsumableArray(pathArr)));
                pathArr.pop();

                pathArr.push('requested');
                retVal = retVal.deleteIn(['requested'].concat(_toConsumableArray(pathArr)));
                pathArr.pop();

                return {
                    v: retVal
                };

            case _constants.SET:
                var data = action.data,
                    snapshot = action.snapshot,
                    rootPath = action.rootPath;

                pathArr = pathToArr(path);
                rootPathArr = pathToArr(rootPath);

                pathArr.push('data');
                retVal = data !== undefined ? state.setIn(['data'].concat(_toConsumableArray(pathArr)), (0, _immutable.fromJS)(data)) : state.deleteIn(['data'].concat(_toConsumableArray(pathArr)));
                pathArr.pop();

                pathArr.push('snapshot');
                retVal = snapshot !== undefined ? retVal.setIn(['snapshot'].concat(_toConsumableArray(pathArr)), (0, _immutable.fromJS)(snapshot)) : retVal.deleteIn(['snapshot'].concat(_toConsumableArray(pathArr)));
                pathArr.pop();

                rootPathArr.push('timestamp');
                retVal = timestamp !== undefined ? retVal.setIn(['timestamp'].concat(_toConsumableArray(rootPathArr)), (0, _immutable.fromJS)(timestamp)) : retVal.deleteIn(['timestamp'].concat(_toConsumableArray(rootPathArr)));
                rootPathArr.pop();

                rootPathArr.push('requesting');
                retVal = requesting !== undefined ? retVal.setIn(['requesting'].concat(_toConsumableArray(rootPathArr)), (0, _immutable.fromJS)(requesting)) : retVal.deleteIn(['requesting'].concat(_toConsumableArray(rootPathArr)));
                rootPathArr.pop();

                rootPathArr.push('requested');
                retVal = requested !== undefined ? retVal.setIn(['requested'].concat(_toConsumableArray(rootPathArr)), (0, _immutable.fromJS)(requested)) : retVal.deleteIn(['requested'].concat(_toConsumableArray(rootPathArr)));
                rootPathArr.pop();

                return {
                    v: retVal
                };

            // case NO_VALUE:
            //   pathArr = pathToArr(path)
            //   retVal = state.setIn(['data', ...pathArr], fromJS({}))
            //   retVal = retVal.setIn(['snapshot', ...pathArr], fromJS({}))
            //
            //   retVal = retVal.setIn(['timestamp', ...pathArr], fromJS({}))
            //   retVal = retVal.setIn(['requesting', ...pathArr], fromJS({}))
            //   retVal = retVal.setIn(['requested', ...pathArr], fromJS({}))
            //
            //   return retVal

            case _constants.SET_PROFILE:
                var profile = action.profile;

                return {
                    v: profile !== undefined ? state.setIn(['profile'], (0, _immutable.fromJS)(profile)) : state.deleteIn(['profile'])
                };

            case _constants.LOGOUT:
                var _action$preserve = action.preserve,
                    preserve = _action$preserve === undefined ? [] : _action$preserve,
                    _action$remove = action.remove,
                    remove = _action$remove === undefined ? [] : _action$remove;

                var preserved = (0, _immutable.fromJS)({ data: {}, snapshot: {}, timestamp: {}, requesting: {}, requested: {} });

                // preserving and removing must be applied to both the 'data' and 'snapshot' subtrees of the state
                ['data', 'snapshot', 'timestamp', 'requesting', 'requested'].map(function (type) {
                    // some predefined paths should not be removed after logout
                    preserve.map(function (path) {
                        return [type].concat(_toConsumableArray(pathToArr(path)));
                    }).map(function (pathArr) {
                        if (state.hasIn(pathArr)) {
                            preserved = preserved.setIn(pathArr, state.getIn(pathArr));
                        }
                    });

                    // but some sub-parts of this preserved state should be still removed
                    remove.map(function (path) {
                        return [type].concat(_toConsumableArray(pathToArr(path)));
                    }).map(function (pathArr) {
                        preserved = preserved.removeIn(pathArr);
                    });
                });

                return {
                    v: preserved.merge((0, _immutable.fromJS)({
                        auth: null,
                        authError: null,
                        profile: null
                    }))
                };

            case _constants.LOGIN:
                return {
                    v: state.setIn(['auth'], (0, _immutable.fromJS)(action.auth)).setIn(['authError'], null)
                };

            case _constants.LOGIN_ERROR:
                return {
                    v: state.setIn(['authError'], action.authError).setIn(['auth'], null).setIn(['profile'], null)
                };

            default:
                return {
                    v: state
                };

        }
    }();

    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
};