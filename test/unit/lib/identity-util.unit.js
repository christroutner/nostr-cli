import { assert } from 'chai'
import sinon from 'sinon'
import IdentityUtil from '../../../src/lib/identity-util.js'
import { mockIdentity } from '../../mocks/nostr-mock.js'

describe('#identity-util', () => {
  let uut
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    uut = new IdentityUtil()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#saveIdentity()', () => {
    it('should save an identity to a JSON file', () => {
      sandbox.stub(uut.fs, 'existsSync').returns(true)
      sandbox.stub(uut.fs, 'writeFileSync').returns(true)

      const result = uut.saveIdentity(mockIdentity, 'test-user')

      assert.include(result, 'test-user.json')
      assert.isTrue(uut.fs.writeFileSync.calledOnce)
    })

    it('should create the identities directory if it does not exist', () => {
      sandbox.stub(uut.fs, 'existsSync').returns(false)
      sandbox.stub(uut.fs, 'mkdirSync').returns(true)
      sandbox.stub(uut.fs, 'writeFileSync').returns(true)

      uut.saveIdentity(mockIdentity, 'test-user')

      assert.isTrue(uut.fs.mkdirSync.calledOnce)
    })
  })

  describe('#loadIdentity()', () => {
    it('should load an identity from a JSON file', () => {
      const fileData = JSON.stringify({ identity: mockIdentity })
      sandbox.stub(uut.fs, 'existsSync').returns(true)
      sandbox.stub(uut.fs, 'readFileSync').returns(fileData)

      const result = uut.loadIdentity('test-user')

      assert.equal(result.name, 'test-user')
      assert.equal(result.publicKey, mockIdentity.publicKey)
    })

    it('should throw an error if identity does not exist', () => {
      sandbox.stub(uut.fs, 'existsSync').returns(false)

      try {
        uut.loadIdentity('nonexistent')
        assert.fail('Expected an error')
      } catch (err) {
        assert.include(err.message, 'not found')
      }
    })
  })

  describe('#listIdentities()', () => {
    it('should list all identities', () => {
      const fileData = JSON.stringify({ identity: mockIdentity })
      sandbox.stub(uut.fs, 'existsSync').returns(true)
      sandbox.stub(uut.fs, 'readdirSync').returns(['test-user.json'])
      sandbox.stub(uut.fs, 'readFileSync').returns(fileData)

      const result = uut.listIdentities()

      assert.isArray(result)
      assert.equal(result.length, 1)
      assert.equal(result[0].name, 'test-user')
    })

    it('should return an empty array if no identities exist', () => {
      sandbox.stub(uut.fs, 'existsSync').returns(true)
      sandbox.stub(uut.fs, 'readdirSync').returns([])

      const result = uut.listIdentities()

      assert.isArray(result)
      assert.equal(result.length, 0)
    })

    it('should skip non-JSON files', () => {
      const fileData = JSON.stringify({ identity: mockIdentity })
      sandbox.stub(uut.fs, 'existsSync').returns(true)
      sandbox.stub(uut.fs, 'readdirSync').returns(['test-user.json', '.gitkeep'])
      sandbox.stub(uut.fs, 'readFileSync').returns(fileData)

      const result = uut.listIdentities()

      assert.equal(result.length, 1)
    })
  })

  describe('#getSigningKey()', () => {
    it('should return a Uint8Array', () => {
      const fileData = JSON.stringify({ identity: mockIdentity })
      sandbox.stub(uut.fs, 'existsSync').returns(true)
      sandbox.stub(uut.fs, 'readFileSync').returns(fileData)

      const result = uut.getSigningKey('test-user')

      assert.instanceOf(result, Uint8Array)
      assert.equal(result.length, 32)
    })
  })
})
