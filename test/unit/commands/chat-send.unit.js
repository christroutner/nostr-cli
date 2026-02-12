import { assert } from 'chai'
import sinon from 'sinon'
import ChatSend from '../../../src/commands/chat-send.js'
import { mockIdentity } from '../../mocks/nostr-mock.js'
import { hexToBytes } from '@noble/hashes/utils'

describe('#chat-send', () => {
  let uut
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    uut = new ChatSend()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#validateFlags()', () => {
    it('should throw if name is not provided', () => {
      try {
        uut.validateFlags({ eventid: 'abc', message: 'hi' })
        assert.fail('Expected an error')
      } catch (err) {
        assert.include(err.message, '-n flag')
      }
    })

    it('should throw if eventid is not provided', () => {
      try {
        uut.validateFlags({ name: 'test', message: 'hi' })
        assert.fail('Expected an error')
      } catch (err) {
        assert.include(err.message, '-e flag')
      }
    })

    it('should throw if message is not provided', () => {
      try {
        uut.validateFlags({ name: 'test', eventid: 'abc' })
        assert.fail('Expected an error')
      } catch (err) {
        assert.include(err.message, '-m flag')
      }
    })
  })

  describe('#run()', () => {
    it('should return true on success', async () => {
      sandbox.stub(uut.identityUtil, 'getSigningKey').returns(hexToBytes(mockIdentity.privateKey))
      sandbox.stub(uut.relayUtil, 'publishEvent').resolves('eventid123')

      const result = await uut.run({
        name: 'test',
        eventid: 'c'.repeat(64),
        message: 'Hello room!'
      })

      assert.equal(result, true)
    })

    it('should return 0 on error', async () => {
      const result = await uut.run({})

      assert.equal(result, 0)
    })
  })
})
