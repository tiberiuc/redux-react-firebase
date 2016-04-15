'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.changePassword = exports.resetPassword = exports.createUser = exports.logout = exports.init = exports.login = exports.unWatchEvents = exports.watchEvents = exports.unWatchEvent = exports.watchEvent = undefined;

var _constants = require('./constants');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var getWatchPath = function getWatchPath(event, path) {
  return event + ':' + (path.substring(0, 1) == '/' ? '' : '/') + path;
};

var setWatcher = function setWatcher(firebase, event, path) {
  var queryId = arguments.length <= 3 || arguments[3] === undefined ? undefined : arguments[3];

  var id = queryId || getWatchPath(event, path);

  if (firebase._.watchers[id]) {
    firebase._.watchers[id]++;
  } else {
    firebase._.watchers[id] = 1;
  }

  return firebase._.watchers[id];
};

var getWatcherCount = function getWatcherCount(firebase, event, path) {
  var queryId = arguments.length <= 3 || arguments[3] === undefined ? undefined : arguments[3];

  var id = queryId || getWatchPath(event, path);
  return firebase._.watchers[id];
};

var getQueryIdFromPath = function getQueryIdFromPath(path) {
  var pathSplitted = path.split('#');
  path = pathSplitted[0];

  var isQuery = pathSplitted.length > 1 ? true : false;
  var queryParams = isQuery ? pathSplitted[1].split('&') : [];
  var queryId = isQuery ? queryParams.map(function (param) {
    var splittedParam = param.split('=');
    if (splittedParam[0] === 'queryId') {
      return splittedParam[1];
    }
  }) : undefined;

  return queryId && queryId.length > 0 ? queryId[0] : undefined;
};

var unsetWatcher = function unsetWatcher(firebase, event, path) {
  var queryId = arguments.length <= 3 || arguments[3] === undefined ? undefined : arguments[3];

  var id = queryId || getQueryIdFromPath(path);
  path = path.split('#')[0];

  if (!id) {
    id = getWatchPath(event, path);
  }

  if (firebase._.watchers[id] <= 1) {
    delete firebase._.watchers[id];
    if (event !== 'first_child') {
      firebase.ref.child(path).off(event);
    }
  } else if (firebase._.watchers[id]) {
    firebase._.watchers[id]--;
  }
};

var watchEvent = exports.watchEvent = function watchEvent(firebase, dispatch, event, path, dest) {
  var isQuery = false;
  var queryParams = [];
  var queryId = getQueryIdFromPath(path);

  if (queryId) {
    var pathSplitted = path.split('#');
    path = pathSplitted[0];
    isQuery = true;
    queryParams = pathSplitted[1].split('&');
  }

  var watchPath = !dest ? path : path + '@' + dest;
  var counter = getWatcherCount(firebase, event, watchPath, queryId);

  if (counter > 0) {
    // listen only to last query on same path
    if (queryId) {
      unsetWatcher(firebase, event, path, queryId);
    } else {
      return;
    }
  }

  setWatcher(firebase, event, watchPath, queryId);

  if (event == 'first_child') {
    return firebase.ref.child(path).orderByKey().limitToFirst(1).once('value', function (snapshot) {
      if (snapshot.val() === null) {
        dispatch({
          type: _constants.NO_VALUE,
          path: path
        });
      }
    });
  }

  var query = firebase.ref.child(path);

  if (isQuery) {
    (function () {

      var doNotParse = false;

      queryParams.forEach(function (param) {
        param = param.split('=');
        switch (param[0]) {
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
          case 'startAt':
            var startAtParam = !doNotParse ? parseInt(param[1]) || param[1] : param[1];
            startAtParam = startAtParam == 'null' ? null : startAtParam;
            query = param.length == 3 ? query.startAt(startAtParam, param[2]) : query.startAt(startAtParam);
            break;
          case 'endAt':
            var endAtParam = !doNotParse ? parseInt(param[1]) || param[1] : param[1];
            endAtParam = endAtParam == 'null' ? null : endAtParam;
            query = param.length == 3 ? query.endAt(endAtParam, param[2]) : query.endAt(endAtParam);
            break;
            break;
          default:
            break;
        }
      });
    })();
  }

  query.on(event, function (snapshot) {
    var data = event === 'child_removed' ? undefined : snapshot.val();
    var resultPath = dest ? dest : event === 'value' ? path : path + '/' + snapshot.key();
    if (dest && event != 'child_removed') {
      data = {
        _id: snapshot.key(),
        val: snapshot.val()
      };
    }
    dispatch({
      type: _constants.SET,
      path: resultPath,
      data: data,
      snapshot: snapshot
    });
  });
};

var unWatchEvent = exports.unWatchEvent = function unWatchEvent(firebase, event, path) {
  var queryId = arguments.length <= 3 || arguments[3] === undefined ? undefined : arguments[3];
  return unsetWatcher(firebase, event, path, queryId);
};

var watchEvents = exports.watchEvents = function watchEvents(firebase, dispatch, events) {
  return events.forEach(function (event) {
    return watchEvent(firebase, dispatch, event.name, event.path);
  });
};

var unWatchEvents = exports.unWatchEvents = function unWatchEvents(firebase, events) {
  return events.forEach(function (event) {
    return unWatchEvent(firebase, event.name, event.path);
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
    firebase.ref.child(userProfile + '/' + authUid).off('value', firebase._.profileWatch);
    firebase._.profileWatch = null;
  }
};

var watchUserProfile = function watchUserProfile(dispatch, firebase) {
  var authUid = firebase._.authUid;
  var userProfile = firebase._.config.userProfile;
  unWatchUserProfile(firebase);
  if (firebase._.config.userProfile) {
    firebase._.profileWatch = firebase.ref.child(userProfile + '/' + authUid).on('value', function (snap) {
      dispatch({
        type: _constants.SET_PROFILE,
        profile: snap.val()
      });
    });
  }
};

var login = exports.login = function login(dispatch, firebase, credentials) {
  return new _bluebird2.default(function (resolve, reject) {
    var ref = firebase.ref;

    dispatchLoginError(dispatch, null);

    var handler = function handler(err, authData) {
      if (err) {
        dispatchLoginError(dispatch, err);
        return reject(err);
      }
      resolve(authData);
    };

    var token = credentials.token;
    var provider = credentials.provider;
    var type = credentials.type;

    if (provider) {

      if (credentials.token) {
        return ref.authWithOAuthToken(provider, token, handler);
      }

      var auth = type === 'popup' ? ref.authWithOAuthPopup : ref.authWithOAuthRedirect;

      return auth(provider, handler);
    }

    if (token) {
      return ref.authWithCustomToken(token, handler);
    }

    ref.authWithPassword(credentials, handler);
  });
};

var init = exports.init = function init(dispatch, firebase) {
  var ref = firebase.ref;

  ref.onAuth(function (authData) {
    if (!authData) {
      return dispatch({ type: _constants.LOGOUT });
    }

    firebase._.authUid = authData.uid;
    watchUserProfile(dispatch, firebase);

    dispatchLogin(dispatch, authData);
  });

  ref.getAuth();
};

var logout = exports.logout = function logout(dispatch, firebase) {
  var ref = firebase.ref;

  ref.unauth();
  dispatch({ type: _constants.LOGOUT });
  firebase._.authUid = null;
  unWatchUserProfile(firebase);
};

var createUser = exports.createUser = function createUser(dispatch, firebase, credentials, profile) {
  var ref = firebase.ref;

  return new _bluebird2.default(function (resolve, reject) {
    dispatchLoginError(dispatch, null);
    ref.createUser(credentials, function (err, userData) {
      if (err) {
        dispatchLoginError(dispatch, err);
        return reject(err);
      }

      if (profile && firebase._.config.userProfile) {
        ref.child(firebase._.config.userProfile + '/' + userData.uid).set(profile);
      }

      login(dispatch, firebase, credentials).then(function () {
        resolve(userData.uid);
      }).catch(function (err) {
        reject(err);
      });
    });
  });
};

var resetPassword = exports.resetPassword = function resetPassword(dispatch, firebase, credentials) {
  var ref = firebase.ref;

  dispatchLoginError(dispatch, null);
  ref.resetPassword(credentials, function (err) {
    if (err) {
      switch (err.code) {
        case "INVALID_USER":
          dispatchLoginError(dispatch, new Error('The specified user account does not exist.'));
          break;
        default:
          dispatchLoginError(dispatch, err);
      }
      return;
    }

    return dispatchLoginError(dispatch, new Error('Password reset email sent successfully!'));
  });
};

var changePassword = exports.changePassword = function changePassword(dispatch, firebase, credentials) {
  var ref = firebase.ref;

  dispatchLoginError(dispatch, null);
  ref.changePassword(credentials, function (err) {
    if (err) {
      switch (err.code) {
        case "INVALID_PASSWORD":
          dispatchLoginError(dispatch, new Error('The specified user account password is incorrect.'));
          break;
        case "INVALID_USER":
          dispatchLoginError(dispatch, new Error('The specified user account does not exist.'));
          break;
        default:
          dispatchLoginError(dispatch, err);
      }
      return;
    }

    return dispatchLoginError(dispatch, new Error('User password changed successfully!'));
  });
};