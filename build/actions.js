'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.resetPassword = exports.createUser = exports.logout = exports.init = exports.login = exports.unWatchEvents = exports.watchEvents = exports.unWatchEvent = exports.watchEvent = exports.isWatchPath = undefined;

var _has2 = require('lodash/has');

var _has3 = _interopRequireDefault(_has2);

var _isString2 = require('lodash/isString');

var _isString3 = _interopRequireDefault(_isString2);

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _constants = require('./constants');

var _es6Promise = require('es6-promise');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var getWatchPath = function getWatchPath(event, path) {
    return event + ':' + (getCleanPath(path).substring(0, 1) === '/' ? '' : '/') + getCleanPath(path);
};

var setWatcher = function setWatcher(firebase, event, path) {
    var ConnectId = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'Manual';

    var id = getWatchPath(event, path);

    firebase._.watchers[id] = firebase._.watchers[id] || {};

    if (Object.keys(firebase._.watchers[id]).includes(ConnectId)) {
        firebase._.watchers[id][ConnectId]++;
    } else {
        firebase._.watchers[id][ConnectId] = 1;
    }

    return firebase._.watchers[id];
};

var cleanOnceWatcher = function cleanOnceWatcher(firebase, dispatch, event, path, ConnectId) {
    var id = getWatchPath(event, path);

    if (firebase._.watchers[id]) {
        if (firebase._.watchers[id][ConnectId] <= 1) {
            delete firebase._.watchers[id][ConnectId];

            if (Object.keys(firebase._.watchers[id]).length === 0) {
                delete firebase._.watchers[id];
            }
        } else if (firebase._.watchers[id][ConnectId]) {
            firebase._.watchers[id][ConnectId]--;
        }
    }

    if (firebase._.shouldClearAfterOnce[id]) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = firebase._.shouldClearAfterOnce[id][Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var clean = _step.value;

                firebase.database().ref().child(clean.path).off(clean.event);
                if (!clean.isSkipClean) {
                    dispatch({
                        type: _constants.INIT_BY_PATH,
                        path: clean.path
                    });
                }
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        delete firebase._.shouldClearAfterOnce[id];
    }

    return firebase._.watchers[id];
};

var getWatcherCount = function getWatcherCount(firebase, event, path) {
    var id = getWatchPath(event, path);
    var watchers = firebase._.watchers[id];

    return watchers && Object.keys(watchers).length;
};

var getCleanPath = function getCleanPath(path) {
    var pathSplitted = path.split('#');
    return pathSplitted[0];
};

var unsetWatcher = function unsetWatcher(firebase, dispatch, event, path) {
    var ConnectId = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 'Manual';
    var isSkipClean = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;
    var isNewQuery = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : false;

    var id = getWatchPath(event, path);
    var onceEvent = getWatchPath('once', path);
    path = path.split('#')[0];

    if (firebase._.watchers[id] && firebase._.watchers[id][ConnectId] <= 1 || isNewQuery || ConnectId === 'CleanAll') {
        var aggregationId = getWatchPath('child_aggregation', path);

        if (firebase._.timeouts && firebase._.timeouts[aggregationId]) {
            clearTimeout(firebase._.timeouts[aggregationId]);
            firebase._.timeouts[aggregationId] = undefined;
        }

        ConnectId !== 'CleanAll' && delete firebase._.watchers[id][ConnectId];

        var countWatchers = ConnectId !== 'CleanAll' ? Object.keys(firebase._.watchers[id]).length : 0;

        if (countWatchers === 0 || isNewQuery) {
            countWatchers === 0 && delete firebase._.watchers[id];

            if (event != 'once') {
                if (!firebase._.watchers[onceEvent]) {
                    event !== 'all' && firebase.database().ref().child(path).off(event);
                    if (!isSkipClean) {
                        dispatch({
                            type: _constants.INIT_BY_PATH,
                            path: path
                        });
                    }
                } else {
                    firebase._.shouldClearAfterOnce[onceEvent] = firebase._.shouldClearAfterOnce[onceEvent] || [];
                    firebase._.shouldClearAfterOnce[onceEvent].push({ path: path, event: event, isSkipClean: isSkipClean });
                }
            }
        }
    } else if (firebase._.watchers[id] && firebase._.watchers[id][ConnectId]) {
        firebase._.watchers[id][ConnectId]--;
    }
};

var isWatchPath = exports.isWatchPath = function isWatchPath(firebase, dispatch, event, path) {
    var id = getWatchPath(event, path);
    var isWatch = false;

    if (firebase._.watchers[id] > 0) {
        isWatch = true;
    }

    return isWatch;
};

function isNumeric(n) {
    return !isNaN(n - parseFloat(n));
}

var watchEvent = exports.watchEvent = function watchEvent(firebase, dispatch, event, path) {
    var ConnectId = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 'Manual';
    var isListenOnlyOnDelta = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;
    var isAggregation = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : false;
    var setFunc = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : undefined;
    var setOptions = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : undefined;


    if (path) {
        var _ret = function () {

            var isNewQuery = path.includes('#');
            var isNewSet = setOptions !== undefined;
            var queryParams = [];

            if (isNewQuery) {
                var pathSplitted = path.split('#');
                path = pathSplitted[0];
                queryParams = pathSplitted[1].split('&');
            }

            var watchPath = path;
            var counter = getWatcherCount(firebase, event, watchPath);

            if (counter > 0) {
                if (isNewQuery || isNewSet) {
                    unsetWatcher(firebase, dispatch, event, path, ConnectId, false, isNewQuery || isNewSet);
                } else {
                    setWatcher(firebase, event, watchPath, ConnectId);
                    return {
                        v: void 0
                    };
                }
            }

            setWatcher(firebase, event, watchPath, ConnectId);

            var query = firebase.database().ref().child(path);

            if (isNewQuery) {
                (function () {
                    var doNotParse = false;

                    queryParams.forEach(function (param) {
                        param = param.split('=');
                        switch (param[0]) {
                            case 'doNotParse':
                                doNotParse = true;
                                break;
                            case 'orderByValue':
                                query = query.orderByValue();
                                doNotParse = true;
                                break;
                            case 'orderByPriority':
                                query = query.orderByPriority();
                                doNotParse = true;
                                break;
                            case 'orderByKey':
                                query = query.orderByKey();
                                doNotParse = true;
                                break;
                            case 'orderByChild':
                                query = query.orderByChild(param[1]);
                                break;
                            case 'limitToFirst':
                                query = query.limitToFirst(parseInt(param[1]));
                                break;
                            case 'limitToLast':
                                query = query.limitToLast(parseInt(param[1]));
                                break;
                            case 'equalTo':
                                var equalToParam = !doNotParse && isNumeric(param[1]) ? parseFloat(param[1]) || (param[1] === '0' ? 0 : param[1]) : param[1];
                                equalToParam = equalToParam === 'null' ? null : equalToParam;
                                query = param.length === 3 ? query.equalTo(equalToParam, param[2]) : query.equalTo(equalToParam);
                                break;
                            case 'startAt':
                                var startAtParam = !doNotParse && isNumeric(param[1]) ? parseFloat(param[1]) || (param[1] === '0' ? 0 : param[1]) : param[1];
                                startAtParam = startAtParam === 'null' ? null : startAtParam;
                                query = param.length === 3 ? query.startAt(startAtParam, param[2]) : query.startAt(startAtParam);
                                break;
                            case 'endAt':
                                var endAtParam = !doNotParse && isNumeric(param[1]) ? parseFloat(param[1]) || (param[1] === '0' ? 0 : param[1]) : param[1];
                                endAtParam = endAtParam === 'null' ? null : endAtParam;
                                query = param.length === 3 ? query.endAt(endAtParam, param[2]) : query.endAt(endAtParam);
                                break;
                            default:
                                break;
                        }
                    });
                })();
            }

            var runQuery = function runQuery(q, e, p) {
                dispatch({
                    type: _constants.START,
                    timestamp: Date.now(),
                    requesting: true,
                    requested: false,
                    path: path
                });

                var aggregationId = getWatchPath('child_aggregation', path);

                if (e === 'once') {
                    q.once('value').then(function (snapshot) {
                        cleanOnceWatcher(firebase, dispatch, event, watchPath, ConnectId);
                        if (snapshot.val() !== null) {
                            if (setFunc) {
                                setFunc(snapshot, 'value', dispatch, setOptions);
                                dispatch({
                                    type: _constants.SET_REQUESTED,
                                    path: p,
                                    key: snapshot.key,
                                    timestamp: Date.now(),
                                    requesting: false,
                                    requested: true
                                });
                            } else {
                                dispatch({
                                    type: _constants.SET,
                                    path: p,
                                    data: snapshot.val(),
                                    snapshot: Object.assign(snapshot, { _event: 'value' }),
                                    key: snapshot.key,
                                    timestamp: Date.now(),
                                    requesting: false,
                                    requested: true,
                                    isChild: false,
                                    isMixSnapshot: false,
                                    isMergeDeep: false
                                });
                            }
                        }
                    }, dispatchPermissionDeniedError);
                } else if (e === 'child_added' && isListenOnlyOnDelta) {
                    (function () {
                        var newItems = false;

                        q.on(e, function (snapshot) {
                            if (!newItems) return;

                            var tempSnapshot = Object.assign(snapshot, { _event: e });

                            if (isAggregation) {
                                if (!firebase._.timeouts[aggregationId]) {
                                    firebase._.aggregatedData[aggregationId] = {};
                                    firebase._.aggregatedSnapshot[aggregationId] = {};
                                    firebase._.timeouts[aggregationId] = setTimeout(function () {
                                        dispatchBulk(p, aggregationId);
                                    }, 1000);
                                }

                                firebase._.aggregatedData[aggregationId][snapshot.key] = snapshot.val();
                                firebase._.aggregatedSnapshot[aggregationId][snapshot.key] = tempSnapshot;
                            } else {
                                if (setFunc) {
                                    setFunc(snapshot, 'child_added', dispatch, setOptions);
                                    dispatch({
                                        type: _constants.SET_REQUESTED,
                                        path: p,
                                        key: snapshot.key,
                                        timestamp: Date.now(),
                                        requesting: false,
                                        requested: true
                                    });
                                } else {
                                    dispatch({
                                        type: _constants.SET,
                                        path: p,
                                        data: snapshot.val(),
                                        snapshot: tempSnapshot,
                                        key: snapshot.key,
                                        timestamp: Date.now(),
                                        requesting: false,
                                        requested: true,
                                        isChild: true,
                                        isMixSnapshot: true,
                                        isMergeDeep: false
                                    });
                                }
                            }
                        }, dispatchPermissionDeniedError);

                        q.once('value').then(function (snapshot) {
                            newItems = true;
                            if (snapshot.val() !== null) {
                                if (setFunc) {
                                    setFunc(snapshot, 'value', dispatch, setOptions);
                                    dispatch({
                                        type: _constants.SET_REQUESTED,
                                        path: p,
                                        key: snapshot.key,
                                        timestamp: Date.now(),
                                        requesting: false,
                                        requested: true
                                    });
                                } else {
                                    dispatch({
                                        type: _constants.SET,
                                        path: p,
                                        data: snapshot.val(),
                                        snapshot: Object.assign(snapshot, { _event: 'value' }),
                                        key: snapshot.key,
                                        timestamp: Date.now(),
                                        requesting: false,
                                        requested: true,
                                        isChild: false,
                                        isMixSnapshot: true,
                                        isMergeDeep: false
                                    });
                                }
                            }
                        }, dispatchPermissionDeniedError);
                    })();
                } else {
                    q.on(e, function (snapshot) {
                        var data = e === 'child_removed' ? '_child_removed' : snapshot.val();
                        var tempSnapshot = Object.assign(snapshot, { _event: e });

                        if (e !== 'value' && isAggregation) {
                            if (!firebase._.timeouts[aggregationId]) {
                                firebase._.aggregatedData[aggregationId] = {};
                                firebase._.aggregatedSnapshot[aggregationId] = {};
                                firebase._.timeouts[aggregationId] = setTimeout(function () {
                                    dispatchBulk(p, aggregationId);
                                }, 1000);
                            }

                            firebase._.aggregatedData[aggregationId][snapshot.key] = data;
                            firebase._.aggregatedSnapshot[aggregationId][snapshot.key] = tempSnapshot;
                        } else {
                            if (setFunc) {
                                setFunc(tempSnapshot, e, dispatch, setOptions);
                            } else {
                                dispatch({
                                    type: _constants.SET,
                                    path: p,
                                    data: data,
                                    snapshot: tempSnapshot,
                                    key: snapshot.key,
                                    timestamp: Date.now(),
                                    requesting: false,
                                    requested: true,
                                    isChild: e !== 'value',
                                    isMixSnapshot: isListenOnlyOnDelta,
                                    isMergeDeep: false
                                });
                            }
                        }
                    }, function (permError) {
                        return dispatchPermissionDeniedError(permError, p);
                    });
                }
            };

            var dispatchBulk = function dispatchBulk(p, aggregationId) {
                if (setFunc) {
                    setFunc(firebase._.aggregatedSnapshot[aggregationId], 'aggregated', dispatch, setOptions);
                    dispatch({
                        type: _constants.SET_REQUESTED,
                        path: p,
                        key: '_NONE',
                        timestamp: Date.now(),
                        requesting: false,
                        requested: true
                    });
                } else {
                    dispatch({
                        type: _constants.SET,
                        path: p,
                        data: firebase._.aggregatedData[aggregationId],
                        snapshot: firebase._.aggregatedSnapshot[aggregationId],
                        key: '_NONE',
                        timestamp: Date.now(),
                        requesting: false,
                        requested: true,
                        isChild: false,
                        isMixSnapshot: true,
                        isMergeDeep: true
                    });
                }

                firebase._.timeouts[aggregationId] = undefined;
            };

            var dispatchPermissionDeniedError = function dispatchPermissionDeniedError(permError, p) {
                if (permError && permError.code === 'PERMISSION_DENIED' && permError.message && !permError.message.includes('undefined')) {

                    dispatch({
                        type: _constants.PERMISSION_DENIED_ERROR,
                        data: undefined,
                        snapshot: { val: function val() {
                                return undefined;
                            } },
                        path: p,
                        timestamp: Date.now(),
                        requesting: false,
                        requested: true,
                        permError: permError
                    });
                }

                throw permError;
            };

            runQuery(query, event, path);
        }();

        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
    }
};

var unWatchEvent = exports.unWatchEvent = function unWatchEvent(firebase, dispatch, event, path, ConnectId) {
    var isSkipClean = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;

    unsetWatcher(firebase, dispatch, event, path, ConnectId, isSkipClean);
};

var watchEvents = exports.watchEvents = function watchEvents(firebase, dispatch, events) {
    var ConnectId = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'Manual';
    return events.forEach(function (event) {
        return watchEvent(firebase, dispatch, event.name, event.path, ConnectId, event.isListenOnlyOnDelta, event.isAggregation, event.setFunc, event.setOptions);
    });
};

var unWatchEvents = exports.unWatchEvents = function unWatchEvents(firebase, dispatch, events) {
    var ConnectId = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'Manual';
    var isUnmount = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
    return events.forEach(function (event) {
        return unWatchEvent(firebase, dispatch, event.name, event.path, ConnectId, isUnmount ? !!event.isSkipCleanOnUnmount : event.isSkipClean);
    });
};

var dispatchLoginError = function dispatchLoginError(dispatch, authError) {
    return dispatch({
        type: _constants.LOGIN_ERROR,
        authError: authError
    });
};

var dispatchLogin = function dispatchLogin(dispatch, auth) {
    return dispatch({
        type: _constants.LOGIN,
        auth: auth,
        authError: null
    });
};

var unWatchUserProfile = function unWatchUserProfile(firebase) {
    var authUid = firebase._.authUid;
    var userProfile = firebase._.config.userProfile;
    if (firebase._.profileWatch) {
        firebase.database().ref().child(userProfile + '/' + authUid).off('value', firebase._.profileWatch);
        firebase._.profileWatch = null;
    }
};

var watchUserProfile = function watchUserProfile(dispatch, firebase) {
    var authUid = firebase._.authUid;
    var userProfile = firebase._.config.userProfile;
    unWatchUserProfile(firebase);
    if (firebase._.config.userProfile) {
        firebase._.profileWatch = firebase.database().ref().child(userProfile + '/' + authUid).on('value', function (snap) {
            dispatch({
                type: _constants.SET_PROFILE,
                profile: snap.val()
            });
        });
    }
};

var createLoginPromise = function createLoginPromise(firebase, credentials) {
    var auth = firebase.auth();
    if ((0, _isString3.default)(credentials)) {
        return auth.signInWithCustomToken(credentials);
    } else if ((0, _has3.default)(credentials, "email") && (0, _has3.default)(credentials, "password")) {
        return auth.signInWithEmailAndPassword(email, password);
    } else {
        return _es6Promise.Promise.reject(new Error('Malformed credentials or unsupported way of logging in: ' + credentials));
    }
};

var login = exports.login = function login(dispatch, firebase, credentials) {
    return new _es6Promise.Promise(function (resolve, reject) {
        dispatchLoginError(dispatch, null);

        createLoginPromise(firebase, credentials).then(resolve).catch(function (err) {
            dispatchLoginError(dispatch, err);
            reject(err);
        });
    });
};

var init = exports.init = function init(dispatch, firebase) {
    firebase.auth().onAuthStateChanged(function (authData) {
        if (!authData) {
            return dispatch({ type: _constants.LOGOUT });
        }

        firebase._.authUid = authData.uid;
        watchUserProfile(dispatch, firebase);

        if (!!firebase._.firebasePendingEvents) {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = Object.keys(firebase._.firebasePendingEvents)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var key = _step2.value;

                    watchEvents(firebase, dispatch, firebase._.firebasePendingEvents[key], key);
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            firebase._.firebasePendingEvents = undefined;
        }

        dispatchLogin(dispatch, authData);
    });

    // Run onAuthStateChanged if it exists in config
    if (firebase._.config.onAuthStateChanged) {
        firebase._.config.onAuthStateChanged(authData, firebase);
    }
};

var logout = exports.logout = function logout(dispatch, firebase) {
    var preserve = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
    var remove = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];

    firebase.auth().signOut();
    dispatch({ type: _constants.LOGOUT, preserve: preserve, remove: remove });
    firebase._.authUid = null;
    unWatchUserProfile(firebase);
};

var createUser = exports.createUser = function createUser(dispatch, firebase, credentials, profile) {
    return new _es6Promise.Promise(function (resolve, reject) {
        dispatchLoginError(dispatch, null);
        firebase.auth().createUserWithEmailAndPassword(credentials.email, credentials.password).then(function (userData) {
            if (profile && firebase._.config.userProfile) {
                firebase.database().ref().child(firebase._.config.userProfile + '/' + userData.uid).set(profile);
            }

            login(dispatch, firebase, credentials).then(function () {
                return resolve(userData.uid);
            }).catch(function (err) {
                return reject(err);
            });
        }).catch(function (err) {
            dispatchLoginError(dispatch, err);
            return reject(err);
        });
    });
};

var resetPassword = exports.resetPassword = function resetPassword(dispatch, firebase, email) {
    dispatchLoginError(dispatch, null);
    return firebase.auth().sendPasswordResetEmail(email).catch(function (err) {
        if (err) {
            switch (err.code) {
                case 'INVALID_USER':
                    dispatchLoginError(dispatch, new Error('The specified user account does not exist.'));
                    break;
                default:
                    dispatchLoginError(dispatch, err);
            }
            return;
        }
    });
};

exports.default = { watchEvents: watchEvents, unWatchEvents: unWatchEvents, init: init, logout: logout, createUser: createUser, resetPassword: resetPassword, isWatchPath: isWatchPath };