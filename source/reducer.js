import {fromJS} from 'immutable'
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
  data: {},
  snapshot: {}
})

const pathToArr = path => path.split(/\//).filter(p => !!p)

export default (state = initialState, action) => {
  const {path} = action
  let pathArr
  let retVal

  switch (action.type) {

    case SET:
      const {data, snapshot} = action
      pathArr = pathToArr(path)

      retVal = (data !== undefined)
        ? state.setIn(['data', ...pathArr], fromJS(data))
        : state.deleteIn(['data', ...pathArr])

      retVal = (snapshot !== undefined)
        ? retVal.setIn(['snapshot', ...pathArr], fromJS(snapshot))
        : retVal.deleteIn(['snapshot', ...pathArr])

      return retVal

    case NO_VALUE:
      pathArr = pathToArr(path)
      retVal = state.setIn(['data', ...pathArr], fromJS({}))
      retVal = retVal.setIn(['snapshot', ...pathArr], fromJS({}))
      return retVal

    case SET_PROFILE:
      const {profile} = action
      return (profile !== undefined)
        ? state.setIn(['profile'], fromJS(profile))
        : state.deleteIn(['profile'])

    case LOGOUT:
      const {preserve = [], remove = []} = action
      let preserved = fromJS({data: {}, snapshot: {}});

      // preserving and removing must be applied to both the 'data' and 'snapshot' subtrees of the state
      ['data', 'snapshot'].map(type => {
        // some predefined paths should not be removed after logout
        preserve
          .map(path => [type, ...pathToArr(path)])
          .map(pathArr => {
            if (state.hasIn(pathArr)) {
              preserved = preserved.setIn(pathArr, state.getIn(pathArr))
            }
          })

        // but some sub-parts of this preserved state should be still removed
        remove
          .map(path => [type, ...pathToArr(path)])
          .map(pathArr => {
            preserved = preserved.removeIn(pathArr)
          })
      })

      return preserved.merge(
        fromJS({
          auth: null,
          authError: null,
          profile: null
        })
      )

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
