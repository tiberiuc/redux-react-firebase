import {Map, List, fromJS} from 'immutable'
import {
  SET,
  SET_PROFILE,
  LOGIN,
  LOGOUT,
  LOGIN_ERROR,
  NO_VALUE
} from './constants'

const initialState = fromJS({
  auth: undefined,
  authError: undefined,
  profile: undefined,
  data: {}
})

const pathToArr = path => path.split(/\//).filter( p => !!p )

export default (state = initialState, action) => {

  const {path} = action
  let pathArr

  switch(action.type) {

    case SET:
      const {data} = action
      pathArr = pathToArr(path)
      return (data !== undefined) ?
        state.setIn(['data', ...pathArr], fromJS(data))
      : state.deleteIn(['data', ...pathArr])

    case NO_VALUE:
      pathArr = pathToArr(path)
      return state.setIn(['data', ...pathArr], fromJS({}))

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
