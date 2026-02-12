import { assert } from 'chai'
import sinon from 'sinon'
import PostTopic from '../../../src/commands/post-topic.js'
import { mockIdentity } from '../../mocks/nostr-mock.js'
import { hexToBytes } from '@noble/hashes/utils'

describe('#post-topic', () => {
  let uut
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    uut = new PostTopic()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#validateFlags()', () => {
    it('should throw if name is not provided', () => {
      try {
        uut.validateFlags({ message: 'hi', topic: 'test' })
        assert.fail('Expected an error')
      } catch (err) {
        assert.include(err.message, '-n flag')
      }
    })

    it('should throw if message is not provided', () => {
      try {
        uut.validateFlags({ name: 'test', topic: 'test' })
        assert.fail('Expected an error')
      } catch (err) {
        assert.include(err.message, '-m flag')
      }
    })

    it('should throw if topic is not provided', () => {
      try {
        uut.validateFlags({ name: 'test', message: 'hi' })
        assert.fail('Expected an error')
      } catch (err) {
        assert.include(err.message, '-t flag')
      }
    })
  })

  describe('#run()', () => {
    it('should return true on success', async () => {
      sandbox.stub(uut.identityUtil, 'getSigningKey').returns(hexToBytes(mockIdentity.privateKey))
      sandbox.stub(uut.relayUtil, 'publishEvent').resolves('eventid123')

      const result = await uut.run({
        name: 'test',
        message: 'Hello topic!',
        topic: 'test-topic'
      })

      assert.equal(result, true)
    })

    it('should return 0 on error', async () => {
      const result = await uut.run({})

      assert.equal(result, 0)
    })
  })
})
