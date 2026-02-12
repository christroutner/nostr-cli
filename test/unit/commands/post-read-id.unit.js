import { assert } from 'chai'
import sinon from 'sinon'
import PostReadId from '../../../src/commands/post-read-id.js'
import { mockEvent } from '../../mocks/nostr-mock.js'

describe('#post-read-id', () => {
  let uut
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    uut = new PostReadId()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#validateFlags()', () => {
    it('should throw if eventid is not provided', () => {
      try {
        uut.validateFlags({})
        assert.fail('Expected an error')
      } catch (err) {
        assert.include(err.message, '-e flag')
      }
    })
  })

  describe('#resolveEventId()', () => {
    it('should return hex event ID as-is', () => {
      const hex = 'c'.repeat(64)
      assert.equal(uut.resolveEventId(hex), hex)
    })
  })

  describe('#run()', () => {
    it('should return true when event is found', async () => {
      sandbox.stub(uut.relayUtil, 'subscribe').resolves([mockEvent])

      const result = await uut.run({ eventid: 'c'.repeat(64) })

      assert.equal(result, true)
    })

    it('should return true when event is not found', async () => {
      sandbox.stub(uut.relayUtil, 'subscribe').resolves([])

      const result = await uut.run({ eventid: 'c'.repeat(64) })

      assert.equal(result, true)
    })

    it('should return 0 on error', async () => {
      const result = await uut.run({})

      assert.equal(result, 0)
    })
  })
})
