import { assert } from 'chai'
import sinon from 'sinon'
import MsgRead from '../../../src/commands/msg-read.js'
import { mockIdentity, mockEncryptedEvent, mockGiftWrappedEvent } from '../../mocks/nostr-mock.js'

describe('#msg-read', () => {
  let uut
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    uut = new MsgRead()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#validateFlags()', () => {
    it('should throw if name is not provided', () => {
      try {
        uut.validateFlags({})
        assert.fail('Expected an error')
      } catch (err) {
        assert.include(err.message, '-n flag')
      }
    })
  })

  describe('#decryptNip04()', () => {
    it('should decrypt a NIP-04 message', async () => {
      uut.nip04 = { decrypt: sandbox.stub().resolves('decrypted NIP-04 message') }

      const result = await uut.decryptNip04(mockIdentity, mockEncryptedEvent)

      assert.equal(result, 'decrypted NIP-04 message')
    })
  })

  describe('#decryptNip17()', () => {
    it('should decrypt a NIP-17 gift-wrapped message', () => {
      // Mock nip44 to return a seal (kind 13) on first call, then a rumor (kind 14) on second call.
      const mockSealJson = JSON.stringify({
        kind: 13,
        pubkey: 'sender'.padEnd(64, 'x'),
        content: 'encrypted-seal-content'
      })
      const mockRumorJson = JSON.stringify({
        kind: 14,
        content: 'decrypted NIP-17 message'
      })

      uut.nip44 = {
        getConversationKey: sandbox.stub().returns(new Uint8Array(32)),
        decrypt: sandbox.stub()
          .onFirstCall().returns(mockSealJson)
          .onSecondCall().returns(mockRumorJson)
      }

      const result = uut.decryptNip17(mockIdentity, mockGiftWrappedEvent)

      assert.equal(result.content, 'decrypted NIP-17 message')
      assert.equal(result.senderPubkey, 'sender'.padEnd(64, 'x'))
      assert.equal(result.rumorKind, 14)
    })
  })

  describe('#run()', () => {
    it('should return true when NIP-04 messages are found', async () => {
      sandbox.stub(uut.identityUtil, 'loadIdentity').returns(mockIdentity)
      sandbox.stub(uut.identityUtil, 'getSigningKey').returns(new Uint8Array(32))
      sandbox.stub(uut.relayUtil, 'subscribe').resolves([mockEncryptedEvent])
      uut.nip04 = { decrypt: sandbox.stub().resolves('decrypted message') }

      const result = await uut.run({ name: 'test' })

      assert.equal(result, true)
    })

    it('should return true when NIP-17 messages are found', async () => {
      sandbox.stub(uut.identityUtil, 'loadIdentity').returns(mockIdentity)
      sandbox.stub(uut.identityUtil, 'getSigningKey').returns(new Uint8Array(32))
      sandbox.stub(uut.relayUtil, 'subscribe').resolves([mockGiftWrappedEvent])

      const mockSealJson = JSON.stringify({
        kind: 13,
        pubkey: 'sender'.padEnd(64, 'x'),
        content: 'encrypted-seal-content'
      })
      const mockRumorJson = JSON.stringify({
        kind: 14,
        content: 'decrypted NIP-17 message'
      })

      uut.nip44 = {
        getConversationKey: sandbox.stub().returns(new Uint8Array(32)),
        decrypt: sandbox.stub()
          .onFirstCall().returns(mockSealJson)
          .onSecondCall().returns(mockRumorJson)
      }

      const result = await uut.run({ name: 'test' })

      assert.equal(result, true)
    })

    it('should return true when no messages found', async () => {
      sandbox.stub(uut.identityUtil, 'loadIdentity').returns(mockIdentity)
      sandbox.stub(uut.identityUtil, 'getSigningKey').returns(new Uint8Array(32))
      sandbox.stub(uut.relayUtil, 'subscribe').resolves([])

      const result = await uut.run({ name: 'test' })

      assert.equal(result, true)
    })

    it('should return 0 on error', async () => {
      const result = await uut.run({})

      assert.equal(result, 0)
    })
  })
})
