import { assert } from 'chai'
import sinon from 'sinon'
import RelayUtil from '../../../src/lib/relay-util.js'
import { mockEvent, MockRelay } from '../../mocks/nostr-mock.js'

describe('#relay-util', () => {
  let uut
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    uut = new RelayUtil()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#connectRelay()', () => {
    it('should be a function', () => {
      assert.isFunction(uut.connectRelay)
    })
  })

  describe('#createPool()', () => {
    it('should be a function', () => {
      assert.isFunction(uut.createPool)
    })
  })

  describe('#publishEvent()', () => {
    it('should publish an event and return the event ID', async () => {
      const mockRelayInstance = new MockRelay()
      sandbox.stub(uut, 'connectRelay').resolves(mockRelayInstance)

      const result = await uut.publishEvent('wss://relay.example.com', mockEvent)

      assert.equal(result, mockEvent.id)
      assert.isTrue(mockRelayInstance.closed)
      assert.equal(mockRelayInstance.published.length, 1)
    })
  })

  describe('#subscribe()', () => {
    it('should be a function', () => {
      assert.isFunction(uut.subscribe)
    })
  })
})
