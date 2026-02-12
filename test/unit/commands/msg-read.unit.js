import { assert } from 'chai'
import sinon from 'sinon'
import MsgRead from '../../../src/commands/msg-read.js'
import { mockIdentity, mockEncryptedEvent } from '../../mocks/nostr-mock.js'

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

  describe('#run()', () => {
    it('should return true when messages are found', async () => {
      sandbox.stub(uut.identityUtil, 'loadIdentity').returns(mockIdentity)
      sandbox.stub(uut.identityUtil, 'getSigningKey').returns(new Uint8Array(32))
      sandbox.stub(uut.relayUtil, 'subscribe').resolves([mockEncryptedEvent])
      // Replace the nip04 reference with a mock object (ES modules can't be stubbed directly).
      uut.nip04 = { decrypt: sandbox.stub().resolves('decrypted message') }

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
