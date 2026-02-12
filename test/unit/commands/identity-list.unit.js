import { assert } from 'chai'
import sinon from 'sinon'
import IdentityList from '../../../src/commands/identity-list.js'
import { mockIdentity } from '../../mocks/nostr-mock.js'

describe('#identity-list', () => {
  let uut
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    uut = new IdentityList()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#run()', () => {
    it('should return true when identities exist', async () => {
      sandbox.stub(uut.identityUtil, 'listIdentities').returns([mockIdentity])

      const result = await uut.run()

      assert.equal(result, true)
    })

    it('should return true when no identities exist', async () => {
      sandbox.stub(uut.identityUtil, 'listIdentities').returns([])

      const result = await uut.run()

      assert.equal(result, true)
    })

    it('should return 0 on error', async () => {
      sandbox.stub(uut.identityUtil, 'listIdentities').throws(new Error('test error'))

      const result = await uut.run()

      assert.equal(result, 0)
    })
  })
})
