/* global describe, it */
import { expect } from 'chai'

import reducer from '../../source/reducer'
import { SET, LOGOUT } from '../../source/constants'
import { Map } from 'immutable'

describe('reducer - handle logout', () => {
  it('must restore initial state when no action payload is specified', () => {
    let state = reducer(undefined, {})
    state = reducer(state, {type: SET, path: 'foo', data: 'bar', snapshot: 'bar'})
    state = reducer(state, {type: LOGOUT})

    // state must be reset
    expect(state.get('auth')).to.equal(null)
    expect(state.get('authError')).to.equal(null)
    expect(state.get('profile')).to.equal(null)
    expect(state.get('data')).to.be.instanceOf(Map)
    expect(state.get('data').size).to.equal(0)
    expect(state.get('snapshot')).to.be.instanceOf(Map)
    expect(state.get('snapshot').size).to.equal(0)
  })

  it('must preserve some parts of the data and snapshot tree', () => {
    let state = reducer(undefined, {})
    state = reducer(state, {type: SET, path: 'foo', data: 'X', snapshot: 'X'})
    state = reducer(state, {type: SET, path: 'bar', data: 'Y', snapshot: 'Y'})
    state = reducer(state, {type: LOGOUT, preserve: ['foo']})

    // state must be reset but not everything must be deleted
    expect(state.get('auth')).to.equal(null)
    expect(state.get('authError')).to.equal(null)
    expect(state.get('profile')).to.equal(null)
    expect(state.get('data')).to.be.instanceOf(Map)
    expect(state.get('data').size).to.equal(1)
    expect(state.getIn(['data', 'foo'])).to.equal('X')
    expect(state.get('snapshot')).to.be.instanceOf(Map)
    expect(state.get('snapshot').size).to.equal(1)
    expect(state.getIn(['snapshot', 'foo'])).to.equal('X')
  })

  it('must preserve some parts of the data and snapshot tree and remove some other', () => {
    let state = reducer(undefined, {})
    state = reducer(state, {type: SET, path: 'foo/X', data: 'Y', snapshot: 'Y'})
    state = reducer(state, {type: SET, path: 'foo/A', data: 'B', snapshot: 'B'})
    state = reducer(state, {type: LOGOUT, preserve: ['foo'], remove: ['foo/A']})

    // state must be reset but not everything must be deleted
    expect(state.getIn(['data', 'foo']).size).to.equal(1)
    expect(state.getIn(['data', 'foo', 'X'])).to.equal('Y')
    expect(state.getIn(['snapshot', 'foo']).size).to.equal(1)
    expect(state.getIn(['snapshot', 'foo', 'X'])).to.equal('Y')
  })

  it('must not create paths which did not exist in the old state when preserving', () => {
    let state = reducer(undefined, {})
    state = reducer(state, {type: LOGOUT, preserve: ['foo']})

    // state must be reset but not everything must be deleted
    expect(state.get('data').size).to.equal(0)
  })

  it('must not create paths which did not exist in the old state when removing', () => {
    let state = reducer(undefined, {})
    state = reducer(state, {type: SET, path: 'foo/X', data: 'Y', snapshot: 'Y'})
    state = reducer(state, {type: LOGOUT, remove: ['foo']})

    // state must be reset but not everything must be deleted
    expect(state.get('data').size).to.equal(0)
  })
})
