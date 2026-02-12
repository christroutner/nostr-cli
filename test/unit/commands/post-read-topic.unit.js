import { assert } from 'chai'
import sinon from 'sinon'
import PostReadTopic from '../../../src/commands/post-read-topic.js'
import { mockEvent } from '../../mocks/nostr-mock.js'

describe('#post-read-topic', () => {
  let uut
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    uut = new PostReadTopic()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#validateFlags()', () => {
    it('should throw if topic is not provided', () => {
      try {
        uut.validateFlags({})
        assert.fail('Expected an error')
      } catch (err) {
        assert.include(err.message, '-t flag')
      }
    })
  })

  describe('#formatEvent()', () => {
    it('should format an event with content and author', () => {
      const result = uut.formatEvent(mockEvent)

      assert.include(result, mockEvent.content)
      assert.include(result, mockEvent.pubkey.slice(0, 8))
    })
  })

  describe('#run()', () => {
    it('should return true when posts are found', async () => {
      sandbox.stub(uut.relayUtil, 'subscribe').resolves([mockEvent])

      const result = await uut.run({ topic: 'test-topic' })

      assert.equal(result, true)
    })

    it('should return true when no posts found', async () => {
      sandbox.stub(uut.relayUtil, 'subscribe').resolves([])

      const result = await uut.run({ topic: 'test-topic' })

      assert.equal(result, true)
    })

    it('should return 0 on error', async () => {
      const result = await uut.run({})

      assert.equal(result, 0)
    })
  })
})
