'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _firebase = require('firebase');

var _firebase2 = _interopRequireDefault(_firebase);

var _actions = require('./actions');

var Actions = _interopRequireWildcard(_actions);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (config) {
    return function (next) {
        return function (reducer, initialState) {
            var defaultConfig = {
                userProfile: null
            };
            var store = next(reducer, initialState);

            var dispatch = store.dispatch;


            try {
                _firebase2.default.initializeApp(config);
            } catch (err) {
                console.warn('Firebase error:', err);
            }

            var ref = _firebase2.default.database().ref();

            var configs = Object.assign({}, defaultConfig, config);

            var firebase = Object.defineProperty(_firebase2.default, '_', {
                value: {
                    watchers: {},
                    shouldClearAfterOnce: {},
                    timeouts: {},
                    aggregatedData: {},
                    aggregatedSnapshot: {},
                    config: configs,
                    authUid: null
                },
                writable: true,
                enumerable: true,
                configurable: true
            });

            var set = function set(path, value, onComplete) {
                return ref.child(path).set(value, onComplete);
            };
            var push = function push(path, value, onComplete) {
                return ref.child(path).push(value, onComplete);
            };
            var remove = function remove(path, onComplete) {
                return ref.child(path).remove(onComplete);
            };
            var update = function update(path, value, onComplete) {
                return ref.child(path).update(value, onComplete);
            };
            var isWatchPath = function isWatchPath(eventName, eventPath) {
                return Actions.isWatchPath(firebase, dispatch, eventName, eventPath);
            };
            var watchEvent = function watchEvent(eventName, eventPath, isListenOnlyOnDelta, isAggregation, setFunc, setOptions) {
                return Actions.watchEvent(firebase, dispatch, eventName, eventPath, 'Manual', isListenOnlyOnDelta, isAggregation, setFunc, setOptions);
            };
            var unWatchEvent = function unWatchEvent(eventName, eventPath) {
                var isSkipClean = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
                return Actions.unWatchEvent(firebase, dispatch, eventName, eventPath, 'Manual', isSkipClean);
            };
            var login = function login(credentials) {
                return Actions.login(dispatch, firebase, credentials);
            };
            var logout = function logout() {
                var preserve = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
                var remove = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
                return Actions.logout(dispatch, firebase, preserve, remove);
            };
            var createUser = function createUser(credentials, profile) {
                return Actions.createUser(dispatch, firebase, credentials, profile);
            };
            var resetPassword = function resetPassword(credentials) {
                return Actions.resetPassword(dispatch, firebase, credentials);
            };
            var changePassword = function changePassword(credentials) {
                return Actions.changePassword(dispatch, firebase, credentials);
            };

            firebase.helpers = {
                set: set, push: push, remove: remove, update: update,
                createUser: createUser,
                login: login, logout: logout,
                resetPassword: resetPassword, changePassword: changePassword,
                watchEvent: watchEvent, unWatchEvent: unWatchEvent, isWatchPath: isWatchPath
            };

            Actions.init(dispatch, firebase);

            store.firebase = firebase;

            return store;
        };
    };
};