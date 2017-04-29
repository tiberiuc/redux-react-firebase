
import {
    SET,
    SET_PROFILE,
    LOGIN,
    LOGOUT,
    LOGIN_ERROR,
    START,
    INIT_BY_PATH
//    NO_VALUE
} from './constants'

import { Promise } from 'es6-promise'

const getWatchPath = (event, path) => event + ':' + ((path.substring(0, 1) === '/') ? '' : '/') + path

const setWatcher = (firebase, event, path, queryId = undefined) => {
    const id = queryId || getQueryIdFromPath(path,event) || getWatchPath(event, path)

    if (event!='once') {
        if (firebase._.watchers[id]) {
            firebase._.watchers[id]++
        } else {
            firebase._.watchers[id] = 1
        }
    }

    return firebase._.watchers[id]
}

const getWatcherCount = (firebase, event, path, queryId = undefined) => {
    const id = queryId || getQueryIdFromPath(path,event) || getWatchPath(event, path)
    return firebase._.watchers[id]
}

const getQueryIdFromPath = (path, event=undefined) => {
    const origPath = path
    let pathSplitted = path.split('#')
    path = pathSplitted[0]

    let isQuery = pathSplitted.length > 1
    let queryParams = isQuery ? pathSplitted[1].split('&') : []
    let queryId = isQuery ? queryParams.map((param) => {
            let splittedParam = param.split('=')
            if (splittedParam[0] === 'queryId') {
                return splittedParam[1]
            }
        }).filter(q => q) : undefined

    return (queryId && queryId.length > 0)
        ? (event ? event + ':/' + queryId : queryId[0])
        : ((isQuery) ? origPath : undefined)
}

const unsetWatcher = (firebase, dispatch, event, path, queryId = undefined, isSkipClean=false) => {
    const id = queryId || getQueryIdFromPath(path,event) || getWatchPath(event, path)
    path = path.split('#')[0]

    if (firebase._.watchers[id] <= 1) {
        delete firebase._.watchers[id]
        if (event!='once'){
            // if (event !== 'first_child') {
            //   firebase.database().ref().child(path).off(event)
            // }
            firebase.database().ref().child(path).off(event)
            if(!isSkipClean){
                dispatch({
                    type: INIT_BY_PATH,
                    path
                })
            }
        }
    } else if (firebase._.watchers[id]) {
        firebase._.watchers[id]--
    }
}

// see: http://stackoverflow.com/a/32539708/2228771
function isIntString(val) {
    return val === "" + ~~val;
}

export const watchEvent = (firebase, dispatch, event, path, isListenOnlyOnDelta=false, isAggregation=false) => {
    let isQuery = false
    let queryParams = []
    let queryId = getQueryIdFromPath(path, event)

    if (queryId) {
        let pathSplitted = path.split('#')
        path = pathSplitted[0]
        isQuery = true
        queryParams = pathSplitted[1].split('&')
    }

    const watchPath = path
    const counter = getWatcherCount(firebase, event, watchPath, queryId)

    if (counter > 0) {
        if (queryId) {
            unsetWatcher(firebase, dispatch, event, path, queryId, false)
        } else {
            return
        }
    }

    setWatcher(firebase, event, watchPath, queryId)

    // if (event === 'first_child') {
    //   // return
    //   return firebase.database().ref().child(path).orderByKey().limitToFirst(1).once('value', snapshot => {
    //     if (snapshot.val() === null) {
    //       dispatch({
    //         type: NO_VALUE,
    //         path
    //       })
    //     }
    //   })
    // }

    let query = firebase.database().ref().child(path)

    if (isQuery) {
        let doNotParse = false

        queryParams.forEach((param) => {
            param = param.split('=')
            switch (param[0]) {
                case 'doNotParse':
                    doNotParse = true
                    break
                case 'orderByValue':
                    query = query.orderByValue()
                    doNotParse = true
                    break
                case 'orderByPriority':
                    query = query.orderByPriority()
                    doNotParse = true
                    break
                case 'orderByKey':
                    query = query.orderByKey()
                    doNotParse = true
                    break
                case 'orderByChild':
                    query = query.orderByChild(param[1])
                    break
                case 'limitToFirst':
                    query = query.limitToFirst(parseInt(param[1]))
                    break
                case 'limitToLast':
                    query = query.limitToLast(parseInt(param[1]))
                    break
                case 'equalTo':
                    let equalToParam = (!doNotParse && isIntString(param[1])) ? parseInt(param[1]) : param[1]
                    equalToParam = equalToParam === 'null' ? null : equalToParam
                    query = param.length === 3
                        ? query.equalTo(equalToParam, param[2])
                        : query.equalTo(equalToParam)
                    break
                case 'startAt':
                    let startAtParam = (!doNotParse && isIntString(param[1])) ? parseInt(param[1]) : param[1]
                    startAtParam = startAtParam === 'null' ? null : startAtParam
                    query = param.length === 3
                        ? query.startAt(startAtParam, param[2])
                        : query.startAt(startAtParam)
                    break
                case 'endAt':
                    let endAtParam = (!doNotParse && isIntString(param[1])) ? parseInt(param[1]) : param[1]
                    endAtParam = endAtParam === 'null' ? null : endAtParam
                    query = param.length === 3
                        ? query.endAt(endAtParam, param[2])
                        : query.endAt(endAtParam)
                    break
                default:
                    break
            } })
    }

    const runQuery = (q, e, p) => {
        dispatch({
            type: START,
            timestamp: Date.now(),
            requesting : true,
            requested : false,
            path
        })

        let aggregationId = getQueryIdFromPath(path, event) || getWatchPath('child_aggregation', path);

        if (e === 'once') {
            q.once('value')
                .then(snapshot => {
                    if (snapshot.val() !== null) {
                        dispatch({
                            type: SET,
                            path: p,
                            data: snapshot.val(),
                            snapshot,
                            key: snapshot.key,
                            timestamp: Date.now(),
                            requesting : false,
                            requested : true,
                            isChild: false,
                            isMixSnapshot: false,
                            isMergeDeep: false
                        })
                    }
                })
        } else if (e === 'child_added' && isListenOnlyOnDelta) {
            let newItems = false;

            q.on(e, snapshot => {
                if (!newItems) return;

                if (isAggregation) {
                    if (!firebase._.timeouts[aggregationId]) {
                        firebase._.aggregatedData[aggregationId] = []
                        firebase._.aggregatedSnapshot[aggregationId] = []
                        firebase._.timeouts[aggregationId] = setTimeout(() => { dispatchBulk(p,aggregationId) }, 1000);
                    }

                    firebase._.aggregatedData[aggregationId][snapshot.key] = snapshot.val()
                    firebase._.aggregatedSnapshot[aggregationId][snapshot.key] = snapshot
                } else {
                    dispatch({
                        type: SET,
                        path: p,
                        data: snapshot.val(),
                        snapshot,
                        key: snapshot.key,
                        timestamp: Date.now(),
                        requesting : false,
                        requested : true,
                        isChild: true,
                        isMixSnapshot: true,
                        isMergeDeep: false
                    })
                }
            })

            q.once('value')
                .then(snapshot => {
                    newItems = true;
                    if (snapshot.val() !== null) {
                        dispatch({
                            type: SET,
                            path: p,
                            data: snapshot.val(),
                            snapshot,
                            key: snapshot.key,
                            timestamp: Date.now(),
                            requesting : false,
                            requested : true,
                            isChild: false,
                            isMixSnapshot: true,
                            isMergeDeep: false
                        })
                    }
                })
        } else {
            q.on(e, snapshot => {
                let data = (e === 'child_removed') ? '_child_removed' : snapshot.val();
                let tempSnapshot = (e === 'child_removed') ? '_child_removed' : snapshot;
                // if (e !== 'child_removed') {
                //   data = {
                //     _id: snapshot.key,
                //     val: snapshot.val()
                //   }
                // }

                if (e !== 'value' && isAggregation) {
                    if (!firebase._.timeouts[aggregationId]) {
                        firebase._.aggregatedData[aggregationId] = []
                        firebase._.aggregatedSnapshot[aggregationId] = []
                        firebase._.timeouts[aggregationId] = setTimeout(() => { dispatchBulk(p,aggregationId) }, 1000);
                    }

                    firebase._.aggregatedData[aggregationId][snapshot.key] = data
                    firebase._.aggregatedSnapshot[aggregationId][snapshot.key] = tempSnapshot
                } else {
                    dispatch({
                        type: SET,
                        path: p,
                        data,
                        snapshot: tempSnapshot,
                        key: snapshot.key,
                        timestamp: Date.now(),
                        requesting : false,
                        requested : true,
                        isChild: e !== 'value',
                        isMixSnapshot: isListenOnlyOnDelta,
                        isMergeDeep: false
                    })
                }
            })
        }
    }

    const dispatchBulk = (p, aggregationId) => {
        dispatch({
            type: SET,
            path: p,
            data: firebase._.aggregatedData[aggregationId],
            snapshot: firebase._.aggregatedSnapshot[aggregationId],
            key: '_NONE',
            timestamp: Date.now(),
            requesting : false,
            requested : true,
            isChild: false,
            isMixSnapshot: true,
            isMergeDeep: true
        })

        firebase._.timeouts[aggregationId] = undefined
    }

    runQuery(query, event, path)
}

export const unWatchEvent = (firebase, dispatch, event, path, isSkipClean=false) => {
    let queryId = getQueryIdFromPath(path, event)
    unsetWatcher(firebase, dispatch, event, path, queryId, isSkipClean)
}

export const watchEvents = (firebase, dispatch, events) =>
    events.forEach(event => watchEvent(firebase, dispatch, event.name, event.path, event.isListenOnlyOnDelta, event.isAggregation))

export const unWatchEvents = (firebase, dispatch, events, isUnmount=false) =>
    events.forEach(event => unWatchEvent(firebase, dispatch, event.name, event.path, isUnmount ? false : event.isSkipClean))

const dispatchLoginError = (dispatch, authError) =>
    dispatch({
        type: LOGIN_ERROR,
        authError
    })

const dispatchLogin = (dispatch, auth) =>
    dispatch({
        type: LOGIN,
        auth,
        authError: null
    })

const unWatchUserProfile = (firebase) => {
    const authUid = firebase._.authUid
    const userProfile = firebase._.config.userProfile
    if (firebase._.profileWatch) {
        firebase.database().ref().child(`${userProfile}/${authUid}`).off('value', firebase._.profileWatch)
        firebase._.profileWatch = null
    }
}

const watchUserProfile = (dispatch, firebase) => {
    const authUid = firebase._.authUid
    const userProfile = firebase._.config.userProfile
    unWatchUserProfile(firebase)
    if (firebase._.config.userProfile) {
        firebase._.profileWatch = firebase.database().ref().child(`${userProfile}/${authUid}`).on('value', snap => {
            dispatch({
                type: SET_PROFILE,
                profile: snap.val()
            })
        })
    }
}

export const login = (dispatch, firebase, credentials) => {
    return new Promise((resolve, reject) => {
        dispatchLoginError(dispatch, null)

        const {email, password} = credentials
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then(resolve)
            .catch(err => {
                dispatchLoginError(dispatch, err)
                reject(err)
            });
    })
}

export const init = (dispatch, firebase) => {
    firebase.auth().onAuthStateChanged(authData => {
        if (!authData) {
            return dispatch({type: LOGOUT})
        }

        firebase._.authUid = authData.uid
        watchUserProfile(dispatch, firebase)

        dispatchLogin(dispatch, authData)
    })

    firebase.auth().currentUser

    // Run onAuthStateChanged if it exists in config
    if (firebase._.config.onAuthStateChanged) {
        firebase._.config.onAuthStateChanged(authData, firebase)
    }
}

export const logout = (dispatch, firebase, preserve = [], remove = []) => {
    firebase.auth().signOut()
    dispatch({type: LOGOUT, preserve, remove})
    firebase._.authUid = null
    unWatchUserProfile(firebase)
}

export const createUser = (dispatch, firebase, credentials, profile) =>
    new Promise((resolve, reject) => {
        dispatchLoginError(dispatch, null)
        firebase.auth().createUserWithEmailAndPassword(credentials.email, credentials.password)
            .then((userData) => {
                if (profile && firebase._.config.userProfile) {
                    firebase.database().ref().child(`${firebase._.config.userProfile}/${userData.uid}`).set(profile)
                }

                login(dispatch, firebase, credentials)
                    .then(() => resolve(userData.uid))
                    .catch(err => reject(err))
            })
            .catch(err => {
                dispatchLoginError(dispatch, err)
                return reject(err)
            })
    })

export const resetPassword = (dispatch, firebase, email) => {
    dispatchLoginError(dispatch, null)
    return firebase.auth().sendPasswordResetEmail(email).catch((err) => {
        if (err) {
            switch (err.code) {
                case 'INVALID_USER':
                    dispatchLoginError(dispatch, new Error('The specified user account does not exist.'))
                    break
                default:
                    dispatchLoginError(dispatch, err)
            }
            return
        }
    })
}

export default { watchEvents, unWatchEvents, init, logout, createUser, resetPassword }
