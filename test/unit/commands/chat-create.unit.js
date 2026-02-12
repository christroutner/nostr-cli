import { assert } from 'chai'
import sinon from 'sinon'
import ChatCreate from '../../../src/commands/chat-create.js'
import { mockIdentity } from '../../mocks/nostr-mock.js'
import { hexToBytes } from '@noble/hashes/utils'

describe('#chat-create', () => {
  let uut
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    uut = new ChatCreate()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#validateFlags()', () => {
    it('should throw if name is not provided', () => {
      try {
        uut.validateFlags({ roomName: 'room' })
        assert.fail('Expected an error')
      } catch (err) {
        assert.include(err.message, '-n flag')
      }
    })

    it('should throw if roomName is not provided', () => {
      try {
        uut.validateFlags({ name: 'test' })
        assert.fail('Expected an error')
      } catch (err) {
        assert.include(err.message, '--room-name')
      }
    })
  })

  describe('#run()', () => {
    it('should return true on success', async () => {
      sandbox.stub(uut.identityUtil, 'getSigningKey').returns(hexToBytes(mockIdentity.privateKey))
      sandbox.stub(uut.relayUtil, 'publishEvent').resolves('eventid123')

      const result = await uut.run({
        name: 'test',
        roomName: 'Test Room'
      })

      assert.equal(result, true)
    })

    it('should return 0 on error', async () => {
      const result = await uut.run({})

      assert.equal(result, 0)
    })
  })
})
