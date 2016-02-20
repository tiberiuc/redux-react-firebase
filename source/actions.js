
import {
  SET,
  SET_PROFILE,
  LOGIN,
  LOGOUT,
  LOGIN_ERROR,
  NO_VALUE
} from './constants'


const getWatchPath = (event, path) =>  event + ':' + ((path.substring(0,1) == '/') ? '': '/') + path

const setWatcher = (firebase, event, path) => {
  const id = getWatchPath(event, path)

  if(firebase._.watchers[id]) {
    firebase._.watchers[id]++
  } else {
    firebase._.watchers[id] = 1
  }

  return firebase._.watchers[id]
}

const unsetWatcher = (firebase, event, path) => {
  const id = getWatchPath(event, path)

  if(firebase._.watchers[id] <= 1) {
    delete firebase._.watchers[id]
    if(event !== 'first_child'){
      firebase.ref.child(path).off(event)
    }
  } else {
    firebase._.watchers[id]--
  }
}

export const watchEvent = (firebase, dispatch, event, path, dest) => {
  const watchPath = (!dest) ? path : path + '@' + dest
  const counter = setWatcher(firebase, event, watchPath)

  if(counter > 1) {
    return
  }

  if(event == 'first_child'){
    return firebase.ref.child(path).orderByKey().limitToFirst(1).once('value', snapshot => {
      if(snapshot.val() === null){
        dispatch({
          type: NO_VALUE,
          path
        })
      }
    })
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

const unWatchUserProfile = (firebase) => {
    const authUid = firebase._.authUid
    const userProfile = firebase._.config.userProfile
    if(firebase._.profileWatch){
      firebase.ref.child(`${userProfile}/${authUid}`).off('value', firebase._.profileWatch)
      firebase._.profileWatch = null
    }
}

const watchUserProfile = (dispatch, firebase) => {
    const authUid = firebase._.authUid
    const userProfile = firebase._.config.userProfile
    unWatchUserProfile(firebase)
    if(firebase._.config.userProfile){
      firebase._.profileWatch = firebase.ref.child(`${userProfile}/${authUid}`).on('value', snap => {
        dispatch({
          type: SET_PROFILE,
          profile: snap.val()
        })
      })
    }
}


export const login = (dispatch, firebase,  credentials) => {
  const {ref} = firebase

  dispatchLoginError(dispatch, null)

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

export const init = (dispatch,  firebase) => {
  const {ref} = firebase
  ref.onAuth( authData => {
    if(!authData){
      return dispatch({type: LOGOUT})
    }

    firebase._.authUid = authData.uid
    watchUserProfile(dispatch, firebase)

    dispatchLogin(dispatch, authData)
  })

  ref.getAuth()
}

export const logout = (dispatch, firebase) => {
  const {ref} = firebase
  ref.unauth()
  dispatch({type: LOGOUT})
  firebase._.authUid = null
  unWatchUserProfile(firebase)
}

export const createUser = (dispatch, firebase, credentials, profile) => {
  const {ref} = firebase
  dispatchLoginError(dispatch, null)
  ref.createUser(credentials, (err, userData) => {
    if(err){
      return dispatchLoginError(dispatch, err)
    }

    if(profile && firebase._.config.userProfile) {
      ref.child(`${firebase._.config.userProfile}/${userData.uid}`).set(profile)
    }

    login(dispatch, firebase, credentials)
  })
}


export const resetPassword = (dispatch, firebase, credentials) => {
  const {ref} = firebase
  dispatchLoginError(dispatch, null)
  ref.resetPassword(credentials, err => {
    if(err){
      switch (err.code) {
        case "INVALID_USER":
          dispatchLoginError(dispatch, new Error('The specified user account does not exist.'))
          break
        default:
          dispatchLoginError(dispatch, err)
      }
      return
    }

    return dispatchLoginError(dispatch, new Error('Password reset email sent successfully!'))

  })
}

export const changePassword = (dispatch, firebase, credentials) => {
  const {ref} = firebase
  dispatchLoginError(dispatch, null)
  ref.changePassword(credentials, err => {
    if(err){
      switch (err.code) {
        case "INVALID_PASSWORD":
          dispatchLoginError(dispatch, new Error('The specified user account password is incorrect.'))
          break
        case "INVALID_USER":
          dispatchLoginError(dispatch, new Error('The specified user account does not exist.'))
          break
        default:
          dispatchLoginError(dispatch, err)
      }
      return
    }

    return dispatchLoginError(dispatch, new Error('User password changed successfully!'))

  })
}
