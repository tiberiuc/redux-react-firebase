'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _differenceBy2 = require('lodash/differenceBy');

var _differenceBy3 = _interopRequireDefault(_differenceBy2);

var _isEqual2 = require('lodash/isEqual');

var _isEqual3 = _interopRequireDefault(_isEqual2);

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _actions = require('./actions');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var defaultEvent = {
    path: '',
    type: 'value',
    isListenOnlyOnDelta: false,
    setFunc: undefined,
    setOptions: undefined,
    isAggregation: false,
    isSkipClean: false,
    isSkipCleanOnUnmount: false
};

var fixPath = function fixPath(path) {
    return (path.substring(0, 1) == '/' ? '' : '/') + path;
};

var ensureCallable = function ensureCallable(maybeFn) {
    return typeof maybeFn === 'function' ? maybeFn : function (_) {
        return maybeFn;
    };
};

var flatMap = function flatMap(arr) {
    return arr && arr.length ? arr.reduce(function (a, b) {
        return a.concat(b);
    }) : [];
};

var createEvents = function createEvents(_ref) {
    var type = _ref.type,
        path = _ref.path,
        _ref$isSkipClean = _ref.isSkipClean,
        isSkipClean = _ref$isSkipClean === undefined ? false : _ref$isSkipClean,
        _ref$isSkipCleanOnUnm = _ref.isSkipCleanOnUnmount,
        isSkipCleanOnUnmount = _ref$isSkipCleanOnUnm === undefined ? false : _ref$isSkipCleanOnUnm,
        _ref$isListenOnlyOnDe = _ref.isListenOnlyOnDelta,
        isListenOnlyOnDelta = _ref$isListenOnlyOnDe === undefined ? false : _ref$isListenOnlyOnDe,
        _ref$isAggregation = _ref.isAggregation,
        isAggregation = _ref$isAggregation === undefined ? false : _ref$isAggregation,
        _ref$setFunc = _ref.setFunc,
        setFunc = _ref$setFunc === undefined ? undefined : _ref$setFunc,
        _ref$setOptions = _ref.setOptions,
        setOptions = _ref$setOptions === undefined ? undefined : _ref$setOptions;

    switch (type) {

        case 'value':
            return [{ name: 'value', path: path, isSkipClean: isSkipClean, isSkipCleanOnUnmount: isSkipCleanOnUnmount, setFunc: setFunc, setOptions: setOptions }];

        case 'once':
            return [{ name: 'once', path: path, isSkipClean: isSkipClean, isSkipCleanOnUnmount: isSkipCleanOnUnmount, setFunc: setFunc, setOptions: setOptions }];

        case 'all':
            return [
            //{name: 'first_child', path},
            { name: 'child_added', path: path, isSkipClean: isSkipClean, isSkipCleanOnUnmount: isSkipCleanOnUnmount, isListenOnlyOnDelta: isListenOnlyOnDelta, isAggregation: isAggregation, setFunc: setFunc, setOptions: setOptions }, { name: 'child_removed', path: path, isSkipClean: isSkipClean, isSkipCleanOnUnmount: isSkipCleanOnUnmount, isListenOnlyOnDelta: isListenOnlyOnDelta, isAggregation: isAggregation, setFunc: setFunc, setOptions: setOptions }, { name: 'child_moved', path: path, isSkipClean: isSkipClean, isSkipCleanOnUnmount: isSkipCleanOnUnmount, isListenOnlyOnDelta: isListenOnlyOnDelta, isAggregation: isAggregation, setFunc: setFunc, setOptions: setOptions }, { name: 'child_changed', path: path, isSkipClean: isSkipClean, isSkipCleanOnUnmount: isSkipCleanOnUnmount, isListenOnlyOnDelta: isListenOnlyOnDelta, isAggregation: isAggregation, setFunc: setFunc, setOptions: setOptions }];

        default:
            return [];
    }
};

var transformEvent = function transformEvent(event) {
    return Object.assign({}, defaultEvent, event);
};

var getEventsFromDefinition = function getEventsFromDefinition(def) {
    return flatMap(def.map(function (path) {
        if (typeof path === 'string' || path instanceof String) {
            return createEvents(transformEvent({ path: path }));
        }

        if (typeof path === 'array' || path instanceof Array) {
            // eslint-disable-line
            return createEvents(transformEvent({ type: 'all', path: path[0] }));
        }

        if ((typeof path === 'undefined' ? 'undefined' : _typeof(path)) === 'object' || path instanceof Object) {
            var type = path.type || 'value';
            switch (type) {
                case 'value':
                    return createEvents(transformEvent({ path: path.path, isSkipClean: !!path.isSkipClean, isSkipCleanOnUnmount: !!path.isSkipCleanOnUnmount, setFunc: path.setFunc, setOptions: path.setOptions }));

                case 'once':
                    return createEvents(transformEvent({ type: 'once', path: path.path, isSkipClean: !!path.isSkipClean, isSkipCleanOnUnmount: !!path.isSkipCleanOnUnmount, setFunc: path.setFunc, setOptions: path.setOptions }));

                case 'array':
                case 'all':
                    return createEvents(transformEvent({ type: 'all', path: path.path, isSkipClean: !!path.isSkipClean,
                        isSkipCleanOnUnmount: !!path.isSkipCleanOnUnmount, isListenOnlyOnDelta: !!path.isListenOnlyOnDelta,
                        isAggregation: !!path.isAggregation, setFunc: path.setFunc, setOptions: path.setOptions }));
            }
        }

        return [];
    }));
};

var cleanPaths = function cleanPaths(def) {
    return def.filter(function (path) {
        return !(path === undefined || (typeof path === 'array' || path instanceof Array) && path[0] === undefined || ((typeof path === 'undefined' ? 'undefined' : _typeof(path)) === 'object' || path instanceof Object) && path.path === undefined);
    });
};

var __guid = function __guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};

exports.default = function () {
    var dataOrFn = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    return function (WrappedComponent) {
        var _class, _temp;

        var FirebaseConnect = (_temp = _class = function (_Component) {
            _inherits(FirebaseConnect, _Component);

            function FirebaseConnect(props, context) {
                _classCallCheck(this, FirebaseConnect);

                var _this = _possibleConstructorReturn(this, (FirebaseConnect.__proto__ || Object.getPrototypeOf(FirebaseConnect)).call(this, props, context));

                _this._firebaseEvents = [];
                _this._pathsToListen = undefined;
                _this._id = __guid();
                _this.firebase = null;
                return _this;
            }

            _createClass(FirebaseConnect, [{
                key: 'componentWillMount',
                value: function componentWillMount() {
                    var _context$store = this.context.store,
                        firebase = _context$store.firebase,
                        dispatch = _context$store.dispatch;


                    var linkFn = ensureCallable(dataOrFn);
                    this._pathsToListen = cleanPaths(linkFn(this.props, firebase));

                    var ref = firebase.ref,
                        helpers = firebase.helpers,
                        storage = firebase.storage,
                        database = firebase.database,
                        auth = firebase.auth;

                    this.firebase = _extends({ ref: ref, storage: storage, database: database, auth: auth }, helpers);

                    this._firebaseEvents = getEventsFromDefinition(this._pathsToListen);

                    if (this._firebaseEvents.length > 0) {
                        if (!!firebase.auth().currentUser) {
                            (0, _actions.watchEvents)(firebase, dispatch, this._firebaseEvents, this._id);
                        } else {
                            if (!firebase._.firebasePendingEvents) {
                                firebase._.firebasePendingEvents = {};
                            }

                            firebase._.firebasePendingEvents[this._id] = this._firebaseEvents;
                        }
                    }
                }
            }, {
                key: 'componentWillReceiveProps',
                value: function componentWillReceiveProps(nextProps) {
                    var _context$store2 = this.context.store,
                        firebase = _context$store2.firebase,
                        dispatch = _context$store2.dispatch;


                    var linkFn = ensureCallable(dataOrFn);
                    var newPathsToListen = cleanPaths(linkFn(nextProps, firebase));

                    if (!(0, _isEqual3.default)(newPathsToListen, this._pathsToListen)) {
                        var oldPaths = (0, _differenceBy3.default)(this._pathsToListen, newPathsToListen, function (a) {
                            var ret = a;
                            if ((typeof a === 'undefined' ? 'undefined' : _typeof(a)) === 'object') {
                                ret = a.path + a.type + a.isListenOnlyOnDelta + a.isAggregation + a.isSkipClean + a.isSkipCleanOnUnmount;
                            }

                            return ret;
                        });
                        var newPaths = (0, _differenceBy3.default)(newPathsToListen, this._pathsToListen, function (a) {
                            var ret = a;
                            if ((typeof a === 'undefined' ? 'undefined' : _typeof(a)) === 'object') {
                                ret = a.path + a.type + a.isListenOnlyOnDelta + a.isAggregation + a.isSkipClean + a.isSkipCleanOnUnmount;
                            }

                            return ret;
                        });

                        var oldFirebaseEvents = getEventsFromDefinition(oldPaths);
                        var newFirebaseEvents = getEventsFromDefinition(newPaths);

                        var events = getEventsFromDefinition(newPathsToListen);

                        if (!!firebase.auth().currentUser) {
                            var isUnmount = oldFirebaseEvents.length > 0 && newFirebaseEvents.length === 0;

                            if (oldFirebaseEvents.length > 0) {
                                (0, _actions.unWatchEvents)(firebase, dispatch, oldFirebaseEvents, this._id, isUnmount);
                            }

                            if (newFirebaseEvents.length > 0) {
                                (0, _actions.watchEvents)(firebase, dispatch, newFirebaseEvents, this._id);
                            }
                        } else if (events.length > 0) {
                            if (!firebase._.firebasePendingEvents) {
                                firebase._.firebasePendingEvents = {};
                            }

                            firebase._.firebasePendingEvents[this._id] = events;
                        }

                        this._pathsToListen = newPathsToListen;
                        this._firebaseEvents = events;
                    }
                }
            }, {
                key: 'componentWillUnmount',
                value: function componentWillUnmount() {
                    var _context$store3 = this.context.store,
                        firebase = _context$store3.firebase,
                        dispatch = _context$store3.dispatch;


                    (0, _actions.unWatchEvents)(firebase, dispatch, this._firebaseEvents, this._id, true);
                }
            }, {
                key: 'render',
                value: function render() {
                    return _react2.default.createElement(WrappedComponent, _extends({}, this.props, this.state, {
                        firebase: this.firebase
                    }));
                }
            }]);

            return FirebaseConnect;
        }(_react.Component), _class.WrappedComponent = WrappedComponent, _class.contextTypes = {
            store: _propTypes2.default.object.isRequired
        }, _temp);

        return FirebaseConnect;
    };
};