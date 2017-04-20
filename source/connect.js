import React, {Component} from 'react'
import PropTypes from 'prop-types';
import {watchEvents, unWatchEvents} from './actions'
import { isEqual } from 'lodash'

const defaultEvent = {
    path: '',
    type: 'value',
    isListenOnlyOnDelta: false,
    isAggregation: false,
    isSkipClean: false
}

const fixPath = (path) =>  ((path.substring(0,1) == '/') ? '': '/') + path

const ensureCallable = maybeFn =>
    typeof maybeFn === 'function' ? maybeFn : _ => maybeFn

const flatMap = arr => (arr && arr.length) ? arr.reduce((a, b) => a.concat(b)) : []

const createEvents = ({type, path, isSkipClean=false, isListenOnlyOnDelta=false, isAggregation=false}) => {
    switch (type) {

        case 'value':
            return [{name: 'value', path, isSkipClean }]

        case 'once':
            return [{name: 'once', path, isSkipClean}]

        case 'all':
            return [
                //{name: 'first_child', path},
                {name: 'child_added', path, isSkipClean, isListenOnlyOnDelta, isAggregation},
                {name: 'child_removed', path, isSkipClean, isListenOnlyOnDelta, isAggregation},
                {name: 'child_moved', path, isSkipClean, isListenOnlyOnDelta, isAggregation},
                {name: 'child_changed', path, isSkipClean, isListenOnlyOnDelta, isAggregation}
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
                return createEvents(transformEvent({ path: path.path, isSkipClean:!!path.isSkipClean }))

            case 'once':
                return createEvents(transformEvent({ type: 'once', path: path.path, isSkipClean:!!path.isSkipClean }))

            case 'array':
            case 'all':
                return createEvents(transformEvent({ type: 'all', path: path.path, isSkipClean:!!path.isSkipClean, isListenOnlyOnDelta:!!path.isListenOnlyOnDelta, isAggregation:!!path.isAggregation }))
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

                unWatchEvents(firebase, dispatch, this._firebaseEvents);

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
