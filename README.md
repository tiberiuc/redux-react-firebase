# redux-react-firebase
Use Firebase with React and Redux in ES6

## Features
- Integrated into redux
- Automatic bunding/unbiding
- Declarative decorator syntax for React components
- Support for nested props
- Out of the box support for authentication
- Lots of helper functions

## Install
```
$ npm install --save redux-react-firebase
```

## Use

Include redux-react-firebase in your store

```javascript
import {createStore, combineReducers, compose} from 'redux'
import {reduxReactFirebase, firebaseStateReducer} from '../source'

const rootReducer = combineReducers({
  firebase: firebaseStateReducer
})

const createStoreWithFirebase = compose(
    reduxReactFirebase('YOUR_FIREBASE_URL'),
)(createStore)


store = createStoreWithFirebase(rootReducer, initialState)
```

In the components
```javascript
@firebase( [
  '/todos'
])
@connect(
  ({firebase}) => ({
    todos: dataToJS(firebase, '/todos'),
  })
)
class Todos extends Component {

  render() {
    const {firebase, todos} = this.props;


    const todosList = (!isLoaded(todos)) ?
                          'Loading'
                        : (!isEmpty(todos) ) ?
                              'Todo list is emtpy'
                            : _.map(todos, (todo, id) => (<TodoItem key={id} id={id} todo={todo}/>) )

    return (
      <div>
        <h1>Todos</h1>
        <ul>
          {todosList}
        </ul>
        <input type="text" ref="newTodo" />
        <button onClick={handleAdd}>Add</button>
      </div>
    )
  }

}

```

## Example
You can see a complete example [here](example)
