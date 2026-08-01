import { assert } from 'chai'
import sinon from 'sinon'
import ProfilePublish from '../../../src/commands/profile-publish.js'
import { mockIdentity } from '../../mocks/nostr-mock.js'
import { hexToBytes } from '@noble/hashes/utils'

describe('#profile-publish', () => {
  let uut
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    uut = new ProfilePublish()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#validateFlags()', () => {
    it('should throw if name is not provided', () => {
      try {
        uut.validateFlags({ about: 'test bio' })
        assert.fail('Expected an error')
      } catch (err) {
        assert.include(err.message, '-n flag')
      }
    })
  })

  describe('#run()', () => {
    it('should return true on success', async () => {
      sandbox.stub(uut.identityUtil, 'getSigningKey').returns(hexToBytes(mockIdentity.privateKey))
      sandbox.stub(uut.relayUtil, 'publishEvent').resolves('eventid123')

      const result = await uut.run({
        name: 'test',
        displayName: 'Test User',
        about: 'A test profile'
      })

      assert.equal(result, true)
    })

    it('should return 0 on error', async () => {
      const result = await uut.run({})

      assert.equal(result, 0)
    })
  })
})
