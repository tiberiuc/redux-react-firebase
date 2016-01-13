## API

### `firebaseStateReducer`
The reducer for the firebase data.
The reducer keeps data  in Immutable.Map format

### `reduxReactFirebase(FIREBASE_URL)`
Add firebase to redux

#### Arguments
- `FIREBASE_URL` Firebase URL to connect to

### `firebase(arrayOfPathsToListen)`

#### Arguments
- `arrayOfPathToListen(props)` (*Array or Function*) A function that takes the original props passed to the object and returns an array of path to listen

#### Returns
A function that takes the component and wraps it, add `firebase` object into props and start the needed listeners


## Firebase object

### `ref`
The original firebase object

### `set(path, value)`
Short for `ref.child(path).set(value)`

### `push(path, value)`
Short for `ref.child(path).push(value)`

### `remove(path)`
Short for `ref.child(path).remove()`

### `createUser(credentials)`

### `login(credentials)`

### `logout()`
Logout from Firebase and delete all data from the store
`store.firebase.auth` is set to `null`

## Data helpers

### `isLoaded(objects...)`
Check if all the objects passed to function are loaded ( not `undefined` )
'null' mean we have feedback from firebase but there is no data
'undefined' mean still waiting from Firebase

### `isEmpty(object)`
Check if an object is empty ('null' if value was requested or empty object `{}` if array wa requested)

### `toJS(immutableData)`
Short for `immutableData.toJS()` but take care if `immutableData` is null or undefined

### `pathToJS(path, immutableData)`
Short for `immutableData.getIn(path.split(/\//)).toJS()` but take care if `immutableData` is null or undefined


### `dataToJS(path, immutableData)`
Short for ``pathToJS(`${data}/path`, immutableData)``
