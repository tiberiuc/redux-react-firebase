## API

### `firebaseStateReducer`
The reducer for the firebase data.
The reducer keeps data  in Immutable.Map format

#### `firebase` in store structure
```
{
  auth: undefined, null or Object, // undefined mean still wating for firebase feedback, null user is not authenticated, if  Object mean user is authenticated and it is the object returned by firebase
  data: immutable,  // corresponded structure from firebase
  authError: Object or String // the error when login or createUser if there is any
}
```

in firebase store objects can have this values
- `undefined` data is not loaded yet
- `null` data was loaded but there is nothing in firebase ( when listening for value )
- `{}` data was loaded but there is nothing in firebase ( when listening for array )
- `String or Object` data loaded

there are helpers for dealing with data ( see helpers )

### `reduxReactFirebase(FIREBASE_URL)`
Add firebase to redux

#### Arguments
- `FIREBASE_URL` Firebase URL to connect to

### `firebase(arrayOfPathsToListen)`

#### Arguments
- `arrayOfPathToListen(props)` (*Array or Function*) A function that takes the original props passed to the object and returns an array of path to listen

#### Returns
A function that takes the component and wraps it, add `firebase` object into props and start the needed listeners for respective paths. when a firebase event is happening the value is automatically set into firebase store into `firebase.data.[...path]`

#### Examples

listen for value on path  `ref.on('value', 'todos')`
```javascript
@firebase([
  'todos'
])
```

listen for multiple paths `ref.on('value', 'todos')` and `ref.on('value', 'users')`
```javascript
@firebase([
  'todos',
  'users'
])
```

listen for a firebase array `ref.on('child_added', 'todos')`, `ref.on('child_removed', 'todos')`, `ref.on('child_changed', 'todos')`
```javascript
@firebase([
  ['todos']
])
```

nesting with connect from redux
```javascript
@firebase(
  props => ([
    `todos/${props.id}`
  ])
)
@connect(
  (state, props) => ({
    todo: dataToJs(state.firebase, `todos/${props.id}`)
  })
)
```

nesting with connect from redux and do a firebase query that depend on data from redux store
```javascript
@connect(
  state => ({
    currentTodo: state.myStore.currentTodo,
    todo: dataToJs(state.firebase, `todos/${state.myStore.currentTodo}`)
  })
)
@firebase(
  props => ([
    `todos/${props.currentTodo}`
  ])
)
```

just access firebase object in component ( for access to ref or other  firebase helpers )
`firebase` object will be added to `props` - see `firebase` object docs
```
@firebase()
```

## Firebase object

### `ref`
The original Firebase object

### `set(path, value)`
Short for `ref.child(path).set(value)`

### `push(path, value)`
Short for `ref.child(path).push(value)`

### `remove(path)`
Short for `ref.child(path).remove()`

### `createUser(credentials)`
Short for `ref.createUser(credentials)`

### `login(credentials)`

#### Arguments
- `credentials` (*String or Object*) If String then `ref.authWithCustomToken(credentials)` is used . If object then following 

cases:
- with provider `ref.authWithOAuthPopup(provider)` or `ref.authWithOAuthRedirect(proviser)`
```
{
  provider: "facebook | google | twitter", 
  type: "popup | redirect", // redirect is default
}
```
- with provider and token `ref.authWithOAuthToken(provider, token)`
```
{
  provider: "facebook | google | twitter", 
  token : String  
}
```
- with email and password `ref.authWithPassword(credentials)`
```
{
  email: String
  password: String
}
```

### `logout()`
Logout from Firebase and delete all data from the store.
`store.firebase.auth` is set to `null`

## Data helpers

### `isLoaded(objects...)`
Check if all the objects passed to function are loaded ( not `undefined` )
`null` mean we have feedback from firebase but there is no data
`undefined` mean still waiting from Firebase

### `isEmpty(object)`
Check if an object is empty (`null` if value was requested or empty object `{}` if array was requested)

### `toJS(immutableData)`
Short for `immutableData.toJS()` but take care if `immutableData` is `null` or `undefined`

### `pathToJS(pathAsString, immutableData)`
Short for `immutableData.getIn(path.split(/\//)).toJS()` but take care if `immutableData` is null or undefined

### `dataToJS(pathAsString, immutableData)`
Short for ``pathToJS(`${data}/path`, immutableData)``
