import React, {Component, PropTypes} from 'react'
import { Provider } from 'react-redux'
import {connect} from 'react-redux'
import {firebase, helpers} from '../source'
import _ from 'lodash'


const {isLoaded, dataToJS} = helpers

@firebase()
class TodoItem extends Component {
  render(){
    const {firebase, todo, id} = this.props
    const toggleDone = () => {
      firebase.set(`/todos/${id}/done`, !todo.done)
    }

    const deleteTodo = (event) => {
       firebase.remove(`/todos/${id}`)
    }
    return (
      <li>
        <input type="checkbox" checked={todo.done} onChange={toggleDone}/>
        {todo.text}
        <button onClick={deleteTodo}>Delete</button>
      </li>)
  }
}


@firebase( [
  '/todos',
])
@connect(
  ({firebase}) => ({
    todos: dataToJS(firebase, '/todos'),
  })
)
class Todos extends Component {

  componentWillMount(){
    const {firebase} = this.props
  }

  render() {
    const {firebase, todos} = this.props;

    const handleAdd = () => {
      const {newTodo} = this.refs
      firebase.push('/todos', {text:newTodo.value, done:false})
      newTodo.value = ''
    }

    const todosList = (!isLoaded(todos)) ?
                          'Loading'
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


export default class App extends React.Component {

  render () {
    return (
        <Provider store={this.props.store}>
          <Todos />
        </Provider>
    );
  }

}


