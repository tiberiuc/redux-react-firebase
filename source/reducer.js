import {Map, List, fromJS} from 'immutable'
import {
  SET,
  SET_PROFILE,
  LOGIN,
  LOGOUT,
  LOGIN_ERROR
} from './constants'

const initialState = fromJS({
  auth: undefined,
  authError: undefined,
  profile: undefined,
  data: {}
})

export default (state = initialState, action) => {

  switch(action.type) {

    case SET:
      const {path, data} = action
      const pathArr = path.split(/\//).filter( p => !!p )
      return (data !== undefined) ?
        state.setIn(['data', ...pathArr], fromJS(data))
      : state.deleteIn(['data', ...pathArr])

    case SET_PROFILE:
      const {profile} = action
      return (profile !== undefined) ?
        state.setIn(['profile'], fromJS(profile))
      : state.deleteIn(['profile'])

    case LOGOUT:
      return fromJS({
        auth: null,
        authError: null,
        profile: null,
        data: {}
      })

    case LOGIN:
      return state.setIn(['auth'], fromJS(action.auth))
                  .setIn(['authError'], null)

    case LOGIN_ERROR:
      return state
              .setIn(['authError'], action.authError)
              .setIn(['auth'], null)
              .setIn(['profile'], null)

    default:
      return state

  }

}
