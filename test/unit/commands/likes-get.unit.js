import { assert } from 'chai'
import sinon from 'sinon'
import LikesGet from '../../../src/commands/likes-get.js'
import { mockReactionEvent } from '../../mocks/nostr-mock.js'

describe('#likes-get', () => {
  let uut
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    uut = new LikesGet()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#validateFlags()', () => {
    it('should throw if neither eventid nor url is provided', () => {
      try {
        uut.validateFlags({})
        assert.fail('Expected an error')
      } catch (err) {
        assert.include(err.message, 'event ID')
      }
    })

    it('should not throw if eventid is provided', () => {
      uut.validateFlags({ eventid: 'c'.repeat(64) })
    })

    it('should not throw if url is provided', () => {
      uut.validateFlags({ url: 'https://example.com' })
    })
  })

  describe('#run()', () => {
    it('should return true when querying by event ID', async () => {
      sandbox.stub(uut.relayUtil, 'subscribe').resolves([mockReactionEvent])

      const result = await uut.run({ eventid: 'c'.repeat(64) })

      assert.equal(result, true)
    })

    it('should return true when querying by URL', async () => {
      sandbox.stub(uut.relayUtil, 'subscribe').resolves([])

      const result = await uut.run({ url: 'https://example.com' })

      assert.equal(result, true)
    })

    it('should return 0 on error', async () => {
      const result = await uut.run({})

      assert.equal(result, 0)
    })
  })
})
