/* global describe, it */
import chai from 'chai'
import spies from 'chai-spies'
chai.use(spies)
const { expect } = chai

import { logout } from '../../source/actions'
import { LOGOUT } from '../../source/constants'

const createFirebaseMock = (signOutSpy = () => {}) => ({
  auth: () => ({ signOut: signOutSpy }),
  _: {
    authUid: '123',
    config: {
      userProfile: 'xyz'
    }
  }
})

describe('actions - dispatch logout', () => {
  it('must dispatch logout action and manipulate firebase', () => {
    const dispatchSpy = chai.spy()
    const signOut = chai.spy()
    const firebaseMock = {
      auth: () => ({ signOut }),
      _: {
        authUid: '123',
        config: {
          userProfile: 'xyz'
        }
      }
    }

    logout(dispatchSpy, firebaseMock)
    expect(signOut).to.have.been.called.once()
    expect(dispatchSpy).to.have.been.called.once()
    expect(dispatchSpy).to.have.been.called.with({type: LOGOUT, preserve: [], remove: []})
  })

  it('must dispatch logout action with preserve param', () => {
    const dispatchSpy = chai.spy()
    const firebaseMock = createFirebaseMock()
    const preserve = ['A', 'B/C', 'D']

    logout(dispatchSpy, firebaseMock, preserve)
    expect(dispatchSpy).to.have.been.called.once()
    expect(dispatchSpy).to.have.been.called.with({type: LOGOUT, preserve, remove: []})
  })

  it('must dispatch logout action with preserve and remove params', () => {
    const dispatchSpy = chai.spy()
    const firebaseMock = createFirebaseMock()
    const preserve = ['A', 'B/C', 'D']
    const remove = ['X', 'A/B', 'F']

    logout(dispatchSpy, firebaseMock, preserve, remove)
    expect(dispatchSpy).to.have.been.called.once()
    expect(dispatchSpy).to.have.been.called.with({type: LOGOUT, preserve, remove})
  })
})
