import { assert } from 'chai'
import sinon from 'sinon'
import DmRelayPublish from '../../../src/commands/dm-relay-publish.js'
import { mockIdentity } from '../../mocks/nostr-mock.js'
import { hexToBytes } from '@noble/hashes/utils'

describe('#dm-relay-publish', () => {
  let uut
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    uut = new DmRelayPublish()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#validateFlags()', () => {
    it('should throw if name is not provided', () => {
      try {
        uut.validateFlags({ relays: 'wss://relay.example.com' })
        assert.fail('Expected an error')
      } catch (err) {
        assert.include(err.message, '-n flag')
      }
    })
  })

  describe('#run()', () => {
    it('should return true on success with custom relays', async () => {
      sandbox.stub(uut.identityUtil, 'getSigningKey').returns(hexToBytes(mockIdentity.privateKey))
      sandbox.stub(uut.relayUtil, 'publishEvent').resolves('eventid123')

      const result = await uut.run({
        name: 'test',
        relays: 'wss://relay.a.com,wss://relay.b.com'
      })

      assert.equal(result, true)
    })

    it('should return true on success with default relays', async () => {
      sandbox.stub(uut.identityUtil, 'getSigningKey').returns(hexToBytes(mockIdentity.privateKey))
      sandbox.stub(uut.relayUtil, 'publishEvent').resolves('eventid123')

      const result = await uut.run({ name: 'test' })

      assert.equal(result, true)
    })

    it('should return 0 on error', async () => {
      const result = await uut.run({})

      assert.equal(result, 0)
    })
  })
})
