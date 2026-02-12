import { assert } from 'chai'
import sinon from 'sinon'
import IdentityImport from '../../../src/commands/identity-import.js'

describe('#identity-import', () => {
  let uut
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    uut = new IdentityImport()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#validateFlags()', () => {
    it('should throw if name is not provided', () => {
      try {
        uut.validateFlags({ key: 'abc' })
        assert.fail('Expected an error')
      } catch (err) {
        assert.include(err.message, '-n flag')
      }
    })

    it('should throw if key is not provided', () => {
      try {
        uut.validateFlags({ name: 'test' })
        assert.fail('Expected an error')
      } catch (err) {
        assert.include(err.message, '-k flag')
      }
    })

    it('should not throw if both name and key are provided', () => {
      uut.validateFlags({ name: 'test', key: 'abc' })
    })
  })

  describe('#importKey()', () => {
    it('should import a hex private key', () => {
      const hexKey = 'a'.repeat(64)
      const result = uut.importKey(hexKey)

      assert.isString(result.privateKey)
      assert.isString(result.publicKey)
      assert.isString(result.nsec)
      assert.isString(result.npub)
    })

    it('should import an nsec private key', () => {
      // Generate a valid nsec from known hex key
      const hexKey = 'a'.repeat(64)
      const result1 = uut.importKey(hexKey)
      const result2 = uut.importKey(result1.nsec)

      assert.equal(result2.privateKey, result1.privateKey)
      assert.equal(result2.publicKey, result1.publicKey)
    })
  })

  describe('#run()', () => {
    it('should return true on success', async () => {
      sandbox.stub(uut.identityUtil, 'saveIdentity').returns('/path')

      const result = await uut.run({ name: 'test', key: 'a'.repeat(64) })

      assert.equal(result, true)
    })

    it('should return 0 on error', async () => {
      const result = await uut.run({})

      assert.equal(result, 0)
    })
  })
})
