import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {watchEvents, unWatchEvents} from './actions'
import { isEqual, differenceBy } from 'lodash'

const defaultEvent = {
    path: '',
    type: 'value',
    isListenOnlyOnDelta: false,
    setFunc: undefined,
    isAggregation: false,
    isSkipClean: false
}

const fixPath = (path) =>  ((path.substring(0,1) == '/') ? '': '/') + path

const ensureCallable = maybeFn =>
    typeof maybeFn === 'function' ? maybeFn : _ => maybeFn

const flatMap = arr => (arr && arr.length) ? arr.reduce((a, b) => a.concat(b)) : []

const createEvents = ({type, path, isSkipClean=false, isListenOnlyOnDelta=false, isAggregation=false, setFunc=undefined}) => {
    switch (type) {

        case 'value':
            return [{name: 'value', path, isSkipClean, setFunc }]

        case 'once':
            return [{name: 'once', path, isSkipClean, setFunc}]

        case 'all':
            return [
                //{name: 'first_child', path},
                {name: 'child_added', path, isSkipClean, isListenOnlyOnDelta, isAggregation, setFunc},
                {name: 'child_removed', path, isSkipClean, isListenOnlyOnDelta, isAggregation, setFunc},
                {name: 'child_moved', path, isSkipClean, isListenOnlyOnDelta, isAggregation, setFunc},
                {name: 'child_changed', path, isSkipClean, isListenOnlyOnDelta, isAggregation, setFunc}
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
                return createEvents(transformEvent({ path: path.path, isSkipClean:!!path.isSkipClean, setFunc:path.setFunc }))

            case 'once':
                return createEvents(transformEvent({ type: 'once', path: path.path, isSkipClean:!!path.isSkipClean, setFunc:path.setFunc }))

            case 'array':
            case 'all':
                return createEvents(transformEvent({ type: 'all', path: path.path, isSkipClean:!!path.isSkipClean, isListenOnlyOnDelta:!!path.isListenOnlyOnDelta, isAggregation:!!path.isAggregation, setFunc:path.setFunc }))
        }
    }

    return []
}))

const cleanPaths = def => {
    return def.filter(path => {
        return !(path === undefined ||
            ((typeof path === 'array' || path instanceof Array) && (path[0] === undefined)) ||
            ((typeof path === 'object' || path instanceof Object) && (path.path === undefined))
        )
    })
}

const __guid = () => {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
};

export default (dataOrFn = []) => WrappedComponent => {
    class FirebaseConnect extends Component {

        constructor (props, context) {
            super(props, context)
            this._firebaseEvents = []
            this._pathsToListen = undefined;
            this._id = __guid();
            this.firebase = null
        }

        static contextTypes = {
            store: PropTypes.object.isRequired
        };

        componentWillMount () {
            const {firebase, dispatch} = this.context.store

            const linkFn = ensureCallable(dataOrFn)
            this._pathsToListen = cleanPaths(linkFn(this.props, firebase))

            const {ref, helpers, storage, database, auth} = firebase
            this.firebase = {ref, storage, database, auth, ...helpers}

            this._firebaseEvents = getEventsFromDefinition(this._pathsToListen)

            if (this._firebaseEvents.length > 0) {
                if (!!firebase.auth().currentUser) {
                    watchEvents(firebase, dispatch, this._firebaseEvents, this._id)
                } else {
                    if (!firebase._.firebasePendingEvents) {
                        firebase._.firebasePendingEvents = {}
                    }

                    firebase._.firebasePendingEvents[this._id] = this._firebaseEvents;
                }
            }
        }

        componentWillReceiveProps(nextProps) {
            const {firebase, dispatch} = this.context.store

            const linkFn = ensureCallable(dataOrFn)
            const newPathsToListen = cleanPaths(linkFn(nextProps, firebase))

            if (!isEqual(newPathsToListen, this._pathsToListen)) {
                let oldPaths = differenceBy(this._pathsToListen, newPathsToListen, (a)=>{
                    let ret = a;
                    if (typeof a === 'object') {
                        ret = a.path + a.type + a.isListenOnlyOnDelta + a.isAggregation + a.isSkipClean
                    }

                    return ret
                });
                let newPaths = differenceBy(newPathsToListen, this._pathsToListen, (a)=>{
                    let ret = a;
                    if (typeof a === 'object') {
                        ret = a.path + a.type + a.isListenOnlyOnDelta + a.isAggregation + a.isSkipClean
                    }

                    return ret
                });

                let oldFirebaseEvents = getEventsFromDefinition(oldPaths)
                let newFirebaseEvents = getEventsFromDefinition(newPaths)

                const events = getEventsFromDefinition(newPathsToListen);

                if (!!firebase.auth().currentUser) {
                    const isUnmount = oldFirebaseEvents.length > 0 && newFirebaseEvents.length===0;

                    if (oldFirebaseEvents.length > 0) {
                        unWatchEvents(firebase, dispatch, oldFirebaseEvents, this._id, isUnmount);
                    }

                    if (newFirebaseEvents.length>0) {
                        watchEvents(firebase, dispatch, newFirebaseEvents, this._id);
                    }
                } else if (events.length > 0){
                    if (!firebase._.firebasePendingEvents) {
                        firebase._.firebasePendingEvents = {}
                    }

                    firebase._.firebasePendingEvents[this._id] = events;
                }

                this._pathsToListen = newPathsToListen;
                this._firebaseEvents = events;
            }
        }

        componentWillUnmount () {
            const {firebase, dispatch} = this.context.store;

            unWatchEvents(firebase, dispatch, this._firebaseEvents, this._id, true)
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
