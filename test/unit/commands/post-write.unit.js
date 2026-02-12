import { assert } from 'chai'
import sinon from 'sinon'
import PostWrite from '../../../src/commands/post-write.js'
import { mockIdentity } from '../../mocks/nostr-mock.js'
import { hexToBytes } from '@noble/hashes/utils'

describe('#post-write', () => {
  let uut
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    uut = new PostWrite()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#validateFlags()', () => {
    it('should throw if name is not provided', () => {
      try {
        uut.validateFlags({ message: 'hello' })
        assert.fail('Expected an error')
      } catch (err) {
        assert.include(err.message, '-n flag')
      }
    })

    it('should throw if message is not provided', () => {
      try {
        uut.validateFlags({ name: 'test' })
        assert.fail('Expected an error')
      } catch (err) {
        assert.include(err.message, '-m flag')
      }
    })
  })

  describe('#run()', () => {
    it('should return true on success', async () => {
      sandbox.stub(uut.identityUtil, 'getSigningKey').returns(hexToBytes(mockIdentity.privateKey))
      sandbox.stub(uut.relayUtil, 'publishEvent').resolves('eventid123')

      const result = await uut.run({ name: 'test', message: 'Hello!' })

      assert.equal(result, true)
    })

    it('should return 0 on error', async () => {
      const result = await uut.run({})

      assert.equal(result, 0)
    })
  })
})
