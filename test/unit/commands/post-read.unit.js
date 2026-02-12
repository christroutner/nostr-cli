import { assert } from 'chai'
import sinon from 'sinon'
import PostRead from '../../../src/commands/post-read.js'
import { mockEvent } from '../../mocks/nostr-mock.js'

describe('#post-read', () => {
  let uut
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    uut = new PostRead()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#validateFlags()', () => {
    it('should throw if pubkey is not provided', () => {
      try {
        uut.validateFlags({})
        assert.fail('Expected an error')
      } catch (err) {
        assert.include(err.message, '-p flag')
      }
    })
  })

  describe('#resolvePubkey()', () => {
    it('should return hex pubkey as-is', () => {
      const hex = 'b'.repeat(64)
      assert.equal(uut.resolvePubkey(hex), hex)
    })
  })

  describe('#formatEvent()', () => {
    it('should format an event with date and content', () => {
      const result = uut.formatEvent(mockEvent)

      assert.include(result, mockEvent.content)
      assert.include(result, mockEvent.id.slice(0, 8))
    })
  })

  describe('#run()', () => {
    it('should return true when events are found', async () => {
      sandbox.stub(uut.relayUtil, 'subscribe').resolves([mockEvent])

      const result = await uut.run({ pubkey: 'b'.repeat(64) })

      assert.equal(result, true)
    })

    it('should return true when no events found', async () => {
      sandbox.stub(uut.relayUtil, 'subscribe').resolves([])

      const result = await uut.run({ pubkey: 'b'.repeat(64) })

      assert.equal(result, true)
    })

    it('should return 0 on error', async () => {
      const result = await uut.run({})

      assert.equal(result, 0)
    })
  })
})
