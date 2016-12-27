import {fromJS} from 'immutable'
import {
    SET,
    SET_PROFILE,
    LOGIN,
    LOGOUT,
    LOGIN_ERROR,
//  NO_VALUE,
    START,
    INIT_BY_PATH
} from './constants'

const initialState = fromJS({
    auth: undefined,
    authError: undefined,
    profile: undefined,
    data: {},
    snapshot: {},
    timestamp: {},
    requesting: {},
    requested: {}
})

const pathToArr = path => path.split(/\//).filter(p => !!p)

export default (state = initialState, action) => {
    const {path, timestamp, requesting, requested} = action
    let pathArr
    let rootPathArr
    let retVal

    switch (action.type) {

        case START:
            pathArr = pathToArr(path)

            pathArr.push('requesting')
            retVal = (requesting !== undefined)
                ? state.setIn(['requesting', ...pathArr], fromJS(requesting))
                : state.deleteIn(['requesting', ...pathArr])
            pathArr.pop()

            pathArr.push('requested')
            retVal = (requested !== undefined)
                ? retVal.setIn(['requested', ...pathArr], fromJS(requested))
                : retVal.deleteIn(['requested', ...pathArr])
            pathArr.pop()

            return retVal;

        case INIT_BY_PATH:
            pathArr = pathToArr(path)

            pathArr.push('data')
            retVal = state.deleteIn(['data', ...pathArr])
            pathArr.pop()

            pathArr.push('snapshot')
            retVal = retVal.deleteIn(['snapshot', ...pathArr])
            pathArr.pop()

            pathArr.push('timestamp')
            retVal = retVal.deleteIn(['timestamp', ...pathArr])
            pathArr.pop()

            pathArr.push('requesting')
            retVal = retVal.deleteIn(['requesting', ...pathArr])
            pathArr.pop()

            pathArr.push('requested')
            retVal = retVal.deleteIn(['requested', ...pathArr])
            pathArr.pop()

            return retVal

        case SET:
            const { data, snapshot, rootPath } = action
            pathArr = pathToArr(path)
            rootPathArr = pathToArr(rootPath)

            pathArr.push('data')
            retVal = (data !== undefined)
                ? state.setIn(['data', ...pathArr], fromJS(data))
                : state.deleteIn(['data', ...pathArr])
            pathArr.pop()

            pathArr.push('snapshot')
            retVal = (snapshot !== undefined)
                ? retVal.setIn(['snapshot', ...pathArr], fromJS(snapshot))
                : retVal.deleteIn(['snapshot', ...pathArr])
            pathArr.pop()

            rootPathArr.push('timestamp')
            retVal = (timestamp !== undefined)
                ? retVal.setIn(['timestamp', ...rootPathArr], fromJS(timestamp))
                : retVal.deleteIn(['timestamp', ...rootPathArr])
            rootPathArr.pop()

            rootPathArr.push('requesting')
            retVal = (requesting !== undefined)
                ? retVal.setIn(['requesting', ...rootPathArr], fromJS(requesting))
                : retVal.deleteIn(['requesting', ...rootPathArr])
            rootPathArr.pop()

            rootPathArr.push('requested')
            retVal = (requested !== undefined)
                ? retVal.setIn(['requested', ...rootPathArr], fromJS(requested))
                : retVal.deleteIn(['requested', ...rootPathArr])
            rootPathArr.pop()

            return retVal

        // case NO_VALUE:
        //   pathArr = pathToArr(path)
        //   retVal = state.setIn(['data', ...pathArr], fromJS({}))
        //   retVal = retVal.setIn(['snapshot', ...pathArr], fromJS({}))
        //
        //   retVal = retVal.setIn(['timestamp', ...pathArr], fromJS({}))
        //   retVal = retVal.setIn(['requesting', ...pathArr], fromJS({}))
        //   retVal = retVal.setIn(['requested', ...pathArr], fromJS({}))
        //
        //   return retVal

        case SET_PROFILE:
            const {profile} = action
            return (profile !== undefined)
                ? state.setIn(['profile'], fromJS(profile))
                : state.deleteIn(['profile'])

        case LOGOUT:
            const {preserve = [], remove = []} = action
            let preserved = fromJS({data: {}, snapshot: {}, timestamp:{}, requesting:{}, requested:{}});

            // preserving and removing must be applied to both the 'data' and 'snapshot' subtrees of the state
            ['data', 'snapshot', 'timestamp', 'requesting', 'requested'].map(type => {
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
