'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _actions = require('./actions');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var defaultEvent = {
  path: '',
  type: 'value'
};

var fixPath = function fixPath(path) {
  return (path.substring(0, 1) == '/' ? '' : '/') + path;
};

var isEqualArrays = function isEqualArrays(a, b) {
  return a.length == b.length && a.every(function (v, i) {
    return v === b[i];
  });
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
  var type = _ref.type;
  var path = _ref.path;

  switch (type) {

    case 'value':
      return [{ name: 'value', path: path }];

    case 'all':
      return [{ name: 'first_child', path: path }, { name: 'child_added', path: path }, { name: 'child_removed', path: path }, { name: 'child_moved', path: path }, { name: 'child_changed', path: path }];

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
          return createEvents(transformEvent({ path: path.path }));

        case 'array':
          return createEvents(transformEvent({ type: 'all', path: path.path }));
      }
    }

    return [];
  }));
};

exports.default = function () {
  var dataOrFn = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
  return function (WrappedComponent) {
    var FirebaseConnect = function (_React$Component) {
      _inherits(FirebaseConnect, _React$Component);

      function FirebaseConnect(props, context) {
        _classCallCheck(this, FirebaseConnect);

        var _this = _possibleConstructorReturn(this, (FirebaseConnect.__proto__ || Object.getPrototypeOf(FirebaseConnect)).call(this, props, context));

        _this._firebaseEvents = [];
        _this._pathsToListen = undefined;
        _this.firebase = null;
        return _this;
      }

      // static contextTypes = {
      //   store: PropTypes.object
      // };

      _createClass(FirebaseConnect, [{
        key: 'componentWillMount',
        value: function componentWillMount() {
          var _context$store = this.context.store;
          var firebase = _context$store.firebase;
          var dispatch = _context$store.dispatch;


          var linkFn = ensureCallable(dataOrFn);
          this._pathsToListen = linkFn(this.props, firebase);

          var ref = firebase.ref;
          var helpers = firebase.helpers;

          this.firebase = _extends({ ref: ref }, helpers);

          this._firebaseEvents = getEventsFromDefinition(this._pathsToListen);
          (0, _actions.watchEvents)(firebase, dispatch, this._firebaseEvents);
        }
      }, {
        key: 'componentWillReceiveProps',
        value: function componentWillReceiveProps(nextProps) {
          var _context$store2 = this.context.store;
          var firebase = _context$store2.firebase;
          var dispatch = _context$store2.dispatch;


          var linkFn = ensureCallable(dataOrFn);
          var newPathsToListen = linkFn(nextProps, firebase);

          if (isEqualArrays(newPathsToListen, this._pathsToListen)) {
            return;
          }

          this._pathsToListen = newPathsToListen;

          (0, _actions.unWatchEvents)(firebase, this._firebaseEvents);

          this._firebaseEvents = getEventsFromDefinition(this._pathsToListen);
          (0, _actions.watchEvents)(firebase, dispatch, this._firebaseEvents);
        }
      }, {
        key: 'componentWillUnmount',
        value: function componentWillUnmount() {
          var firebase = this.context.store.firebase;

          (0, _actions.unWatchEvents)(firebase, this._firebaseEvents);
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
    }(_react2.default.Component);

    FirebaseConnect.contextTypes = {
      store: function store() {
        return _react.PropTypes.object.isRequired;
      }
    };
    return FirebaseConnect;
  };
};