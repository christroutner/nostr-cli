import { assert } from 'chai'
import sinon from 'sinon'
import IdentityCreate from '../../../src/commands/identity-create.js'

describe('#identity-create', () => {
  let uut
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    uut = new IdentityCreate()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#validateFlags()', () => {
    it('should throw an error if name is not provided', () => {
      try {
        uut.validateFlags({})
        assert.fail('Expected an error')
      } catch (err) {
        assert.include(err.message, '-n flag')
      }
    })

    it('should not throw if name is provided', () => {
      uut.validateFlags({ name: 'test' })
    })
  })

  describe('#createIdentity()', () => {
    it('should create an identity with all required fields', () => {
      const result = uut.createIdentity('alice', 'Test')

      assert.equal(result.name, 'alice')
      assert.equal(result.description, 'Test')
      assert.isString(result.privateKey)
      assert.isString(result.publicKey)
      assert.isString(result.nsec)
      assert.isString(result.npub)
      assert.isString(result.createdAt)
      assert.equal(result.privateKey.length, 64)
      assert.equal(result.publicKey.length, 64)
      assert.isTrue(result.nsec.startsWith('nsec'))
      assert.isTrue(result.npub.startsWith('npub'))
    })
  })

  describe('#run()', () => {
    it('should return true on success', async () => {
      sandbox.stub(uut.identityUtil, 'saveIdentity').returns('/path/to/file')

      const result = await uut.run({ name: 'test' })

      assert.equal(result, true)
    })

    it('should return 0 on error', async () => {
      const result = await uut.run({})

      assert.equal(result, 0)
    })
  })
})
