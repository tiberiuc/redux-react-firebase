import Firebase from 'firebase'
import * as Actions from './actions'

export default (config) => {
    return next => (reducer, initialState, middleware) => {
        const defaultConfig = {
            userProfile: null
        }
        const store = next(reducer, initialState, middleware)

        const {dispatch} = store

        try {
            Firebase.initializeApp(config)
        } catch (err) {
            console.warn('Firebase error:', err)
        }

        const ref = Firebase.database().ref()

        const configs = Object.assign({}, defaultConfig, config)

        const firebase = Object.defineProperty(Firebase, '_', {
            value: {
                watchers: {},
                timeouts: {},
                aggregatedData: {},
                aggregatedSnapshot: {},
                config: configs,
                authUid: null
            },
            writable: true,
            enumerable: true,
            configurable: true
        })

        const set = (path, value, onComplete) => ref.child(path).set(value, onComplete)
        const push = (path, value, onComplete) => ref.child(path).push(value, onComplete)
        const remove = (path, onComplete) => ref.child(path).remove(onComplete)
        const update = (path, value, onComplete) => ref.child(path).update(value, onComplete)
        const watchEvent = (eventName, eventPath, isListenOnlyOnDelta, isAggregation) => Actions.watchEvent(firebase, dispatch, eventName, eventPath, isListenOnlyOnDelta, isAggregation)
        const unWatchEvent = (eventName, eventPath, isSkipClean=false) => Actions.unWatchEvent(firebase, dispatch, eventName, eventPath, isSkipClean)
        const login = credentials => Actions.login(dispatch, firebase, credentials)
        const logout = (preserve = [], remove = []) => Actions.logout(dispatch, firebase, preserve, remove)
        const createUser = (credentials, profile) => Actions.createUser(dispatch, firebase, credentials, profile)
        const resetPassword = (credentials) => Actions.resetPassword(dispatch, firebase, credentials)
        const changePassword = (credentials) => Actions.changePassword(dispatch, firebase, credentials)

        firebase.helpers = {
            set, push, remove, update,
            createUser,
            login, logout,
            resetPassword, changePassword,
            watchEvent, unWatchEvent
        }

        Actions.init(dispatch, firebase)

        store.firebase = firebase

        return store
    }
}
