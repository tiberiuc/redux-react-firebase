import React, {Component, PropTypes} from 'react'
import {watchEvents, unWatchEvents} from './actions'
import { isEqual } from 'lodash'

const defaultEvent = {
  path: '',
  type: 'value'
}

const fixPath = (path) =>  ((path.substring(0,1) == '/') ? '': '/') + path

const ensureCallable = maybeFn =>
  typeof maybeFn === 'function' ? maybeFn : _ => maybeFn

const flatMap = arr => (arr && arr.length) ? arr.reduce((a, b) => a.concat(b)) : []

const createEvents = ({type, path}) => {
  switch (type) {

    case 'value':
      return [{name: 'value', path}]

    case 'once':
      return [{name: 'once', path}]

    case 'all':
      return [
        //{name: 'first_child', path},
        {name: 'child_added', path},
        {name: 'child_removed', path},
        {name: 'child_moved', path},
        {name: 'child_changed', path}
      ]

    default:
      return []
  }
}

const transformEvent = event => Object.assign({}, defaultEvent, event)

const getEventsFromDefinition = def => flatMap(def.map(path => {
  if (typeof path === 'string' || path instanceof String) {
    return createEvents(transformEvent({ path }))
  }

  if (typeof path === 'array' || path instanceof Array) { // eslint-disable-line
    return createEvents(transformEvent({ type: 'all', path: path[0] }))
  }

  if (typeof path === 'object' || path instanceof Object) {
    const type = path.type || 'value'
    switch (type) {
      case 'value':
        return createEvents(transformEvent({ path: path.path }))

      case 'once':
        return createEvents(transformEvent({ type: 'once', path: path.path }))

      case 'array':
        return createEvents(transformEvent({ type: 'all', path: path.path }))
    }
  }

  return []
}))

export default (dataOrFn = []) => WrappedComponent => {
  class FirebaseConnect extends Component {

    constructor (props, context) {
      super(props, context)
      this._firebaseEvents = []
      this._pathsToListen = undefined;
      this.firebase = null
    }

    static contextTypes = {
      store: PropTypes.object.isRequired
    };

    componentWillMount () {
      const {firebase, dispatch} = this.context.store

      const linkFn = ensureCallable(dataOrFn)
      this._pathsToListen = linkFn(this.props, firebase)

      const {ref, helpers, storage, database, auth} = firebase
      this.firebase = {ref, storage, database, auth, ...helpers}

      this._firebaseEvents = getEventsFromDefinition(this._pathsToListen)
      watchEvents(firebase, dispatch, this._firebaseEvents)
    }

    componentWillReceiveProps(nextProps) {
      const {firebase, dispatch} = this.context.store

      const linkFn = ensureCallable(dataOrFn)
      const newPathsToListen = linkFn(nextProps, firebase)

      if (!isEqual(newPathsToListen, this._pathsToListen)) {
          this._pathsToListen = newPathsToListen;

          unWatchEvents(firebase, dispatch, this._firebaseEvents, false)

          this._firebaseEvents = getEventsFromDefinition(this._pathsToListen)
          watchEvents(firebase, dispatch, this._firebaseEvents)
      }
    }

    componentWillUnmount () {
      const {firebase, dispatch} = this.context.store
      unWatchEvents(firebase, dispatch, this._firebaseEvents, true)
    }

    render () {
      return (
        <WrappedComponent
          {...this.props}
          {...this.state}
          firebase={this.firebase}
        />
      )
    }
  }
  return FirebaseConnect
}
