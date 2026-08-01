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

  describe('#lookupDmRelays()', () => {
    it('should return DM relays from kind:10050 event', async () => {
      const mockEvent = {
        kind: 10050,
        tags: [
          ['relay', 'wss://dm-relay.a.com'],
          ['relay', 'wss://dm-relay.b.com']
        ]
      }
      sandbox.stub(uut.relayUtil, 'subscribe').resolves([mockEvent])

      const result = await uut.lookupDmRelays('f'.repeat(64))

      assert.deepEqual(result, ['wss://dm-relay.a.com', 'wss://dm-relay.b.com'])
    })

    it('should fall back to default relays when no kind:10050 found', async () => {
      sandbox.stub(uut.relayUtil, 'subscribe').resolves([])

      const result = await uut.lookupDmRelays('f'.repeat(64))

      assert.isArray(result)
      assert.isAbove(result.length, 0)
    })
  })

  describe('#sendNip04()', () => {
    it('should publish a NIP-04 event', async () => {
      uut.nip04 = { encrypt: sandbox.stub().resolves('encrypted-content') }
      sandbox.stub(uut.relayUtil, 'publishEvent').resolves('eventid123')

      const sk = hexToBytes(mockIdentity.privateKey)
      const result = await uut.sendNip04(
        sk,
        mockIdentity.privateKey,
        'f'.repeat(64),
        'hello',
        'wss://relay.example.com'
      )

      assert.property(result, 'id')
      assert.equal(result.kind, 4)
    })
  })

  describe('#sendNip17()', () => {
    it('should publish a NIP-17 gift-wrapped event', async () => {
      // Mock nip44
      uut.nip44 = {
        getConversationKey: sandbox.stub().returns(new Uint8Array(32)),
        encrypt: sandbox.stub().returns('encrypted-payload')
      }
      sandbox.stub(uut.relayUtil, 'publishEvent').resolves('eventid123')

      const sk = hexToBytes(mockIdentity.privateKey)
      const result = await uut.sendNip17(
        sk,
        mockIdentity.privateKey,
        'f'.repeat(64),
        'hello',
        ['wss://relay.a.com', 'wss://relay.b.com']
      )

      assert.property(result, 'id')
      assert.equal(result.kind, 1059)
    })
  })

  describe('#run()', () => {
    it('should return true on success with NIP-04', async () => {
      sandbox.stub(uut.identityUtil, 'getSigningKey').returns(hexToBytes(mockIdentity.privateKey))
      sandbox.stub(uut.identityUtil, 'loadIdentity').returns(mockIdentity)
      uut.nip04 = { encrypt: sandbox.stub().resolves('encrypted-content') }
      sandbox.stub(uut.relayUtil, 'publishEvent').resolves('eventid123')

      const result = await uut.run({
        name: 'test',
        pubkey: 'f'.repeat(64),
        message: 'secret message'
      })

      assert.equal(result, true)
    })

    it('should return true on success with NIP-17', async () => {
      sandbox.stub(uut.identityUtil, 'getSigningKey').returns(hexToBytes(mockIdentity.privateKey))
      sandbox.stub(uut.identityUtil, 'loadIdentity').returns(mockIdentity)
      uut.nip44 = {
        getConversationKey: sandbox.stub().returns(new Uint8Array(32)),
        encrypt: sandbox.stub().returns('encrypted-payload')
      }
      sandbox.stub(uut.relayUtil, 'publishEvent').resolves('eventid123')
      sandbox.stub(uut, 'lookupDmRelays').resolves(['wss://relay.a.com'])

      const result = await uut.run({
        name: 'test',
        pubkey: 'f'.repeat(64),
        message: 'secret message',
        nip17: true
      })

      assert.equal(result, true)
    })

    it('should return 0 on error', async () => {
      const result = await uut.run({})

      assert.equal(result, 0)
    })
  })
})
