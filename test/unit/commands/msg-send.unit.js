import { assert } from 'chai'
import sinon from 'sinon'
import MsgSend from '../../../src/commands/msg-send.js'
import { mockIdentity } from '../../mocks/nostr-mock.js'
import { hexToBytes } from '@noble/hashes/utils'

describe('#msg-send', () => {
  let uut
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    uut = new MsgSend()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#validateFlags()', () => {
    it('should throw if name is not provided', () => {
      try {
        uut.validateFlags({ pubkey: 'abc', message: 'hi' })
        assert.fail('Expected an error')
      } catch (err) {
        assert.include(err.message, '-n flag')
      }
    })

    it('should throw if pubkey is not provided', () => {
      try {
        uut.validateFlags({ name: 'test', message: 'hi' })
        assert.fail('Expected an error')
      } catch (err) {
        assert.include(err.message, '-p flag')
      }
    })

    it('should throw if message is not provided', () => {
      try {
        uut.validateFlags({ name: 'test', pubkey: 'abc' })
        assert.fail('Expected an error')
      } catch (err) {
        assert.include(err.message, '-m flag')
      }
    })
  })

  describe('#resolvePubkey()', () => {
    it('should return hex pubkey as-is', () => {
      const hex = 'b'.repeat(64)
      assert.equal(uut.resolvePubkey(hex), hex)
    })
  })

  describe('#run()', () => {
    it('should return true on success', async () => {
      sandbox.stub(uut.identityUtil, 'getSigningKey').returns(hexToBytes(mockIdentity.privateKey))
      sandbox.stub(uut.identityUtil, 'loadIdentity').returns(mockIdentity)
      // Replace the nip04 reference with a mock object (ES modules can't be stubbed directly).
      uut.nip04 = { encrypt: sandbox.stub().resolves('encrypted-content') }
      sandbox.stub(uut.relayUtil, 'publishEvent').resolves('eventid123')

      const result = await uut.run({
        name: 'test',
        pubkey: 'f'.repeat(64),
        message: 'secret message'
      })

      assert.equal(result, true)
    })

    it('should return 0 on error', async () => {
      const result = await uut.run({})

      assert.equal(result, 0)
    })
  })
})
