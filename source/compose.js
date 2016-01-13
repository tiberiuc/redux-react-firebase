
import Firebase from 'firebase'
import * as Actions from './actions'



export default (url, config) => {
  return next => (reducer, initialState) => {

    const store = next(reducer, initialState)

    const {dispatch} = store

    const ref = new Firebase(url)

    const set = (path, value) => ref.child(path).set(value)
    const push = (path, value) => ref.child(path).push(value)
    const remove = (path, value) => ref.child(path).remove(value)
    const login = credentials => Actions.login(dispatch, ref, credentials)
    const logout = () => Actions.logout(dispatch, ref)
    const createUser = credentials => Actions.createUser(dispatch, ref, credentials)

    Actions.init(dispatch, ref)

    store.firebase = {
      ref,
      config,
      helpers: {
        set, push, remove,
        createUser,
        login, logout,
      },
      _: {
        watchers: {}
      },
    }

    console.log(store)


    return store

  }
}

