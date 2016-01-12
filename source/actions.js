
import {
  SET,
  SET_PROFILE,
  LOGIN,
  LOGOUT,
  LOGIN_ERROR
} from './constants'


const getWatchPath = (event, path) =>  event + ':' + ((path.substring(0,1) == '/') ? '': '/') + path

const setWatcher = (firebase, event, path) => {
  const id = getWatchPath(event, path)

  if(firebase.watchers[id]) {
    firebase.watchers[id]++
  } else {
    firebase.watchers[id] = 1
  }

  return firebase.watchers[id]
}

const unsetWatcher = (firebase, event, path) => {
  const id = getWatchPath(event, path)

  if(firebase.watchers[id] <= 1) {
    delete firebase.watchers[id]
    firebase.ref.child(path).off(event)
  } else {
    firebase.watchers[id]--
  }
}

export const watchEvent = (firebase, dispatch, event, path, dest) => {
  const watchPath = (!dest) ? path : path + '@' + dest
  const counter = setWatcher(firebase, event, watchPath)

  if(counter > 1) {
    return
  }

  firebase.ref.child(path).on(event, snapshot => {
    let data = (event === 'child_removed') ? undefined : snapshot.val()
    const resultPath = (dest) ? dest :  (event === 'value') ? path : path + '/' + snapshot.key()
    if(dest && event != 'child_removed') {
      data = {
        _id: snapshot.key(),
        val: snapshot.val()
      }
    }
    dispatch({
      type: SET,
      path : resultPath,
      data
    })
  })

}

export const unWatchEvent = (firebase, event, path) =>
  unsetWatcher(firebase, event , path)

export const watchEvents = (firebase, dispatch, events) =>
  events.forEach( event => watchEvent(firebase, dispatch, event.name, event.path))

export const unWatchEvents = (firebase, events) =>
  events.forEach( event => unWatchEvent(firebase, event.name, event.path))

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

export const login = (dispatch, ref,  credentials) => {

  const handler = (err, authData) => {
    if(err){
      return dispatchLoginError(dispatch, err)
    }
  }

  const {token, provider, type} = credentials

  if(provider) {

    if(credentials.token) {
      return ref.authWithOAuthToken( provider, token, handler )
    }

    const  auth = (type === 'popup') ?
                    ref.authWithOAuthPopup
                  : ref.authWithOAuthRedirect

    return auth(provider, handler)

  }

  if(token) {
   return ref.authWithCustomToken(token, handler)
  }

  ref.authWithPassword(credentials, handler)
}


export const init = (dispatch, ref) => {
  ref.onAuth( authData => {
    if(!authData){
      return dispatch({type: LOGOUT})
    }

    dispatchLogin(dispatch, authData)
  })

  ref.getAuth()
}

export const logout = (dispatch, ref) => {
  ref.unAuth()
  dispatch({type: LOGOUT})
}

export const createUser = (dispatch, ref, credentials) => {
  ref.createUser(credentials, (err, userData) => {
    if(err){
      return dispatchLoginError(dispatch, err)
    }
  })
}

