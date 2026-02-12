import { assert } from 'chai'
import sinon from 'sinon'
import FollowList from '../../../src/commands/follow-list.js'
import { mockContactEvent } from '../../mocks/nostr-mock.js'

describe('#follow-list', () => {
  let uut
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    uut = new FollowList()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#validateFlags()', () => {
    it('should throw if pubkey is not provided', () => {
      try {
        uut.validateFlags({})
        assert.fail('Expected an error')
      } catch (err) {
        assert.include(err.message, '-p flag')
      }
    })
  })

  describe('#run()', () => {
    it('should return true when follow list is found', async () => {
      sandbox.stub(uut.relayUtil, 'subscribe').resolves([mockContactEvent])

      const result = await uut.run({ pubkey: 'b'.repeat(64) })

      assert.equal(result, true)
    })

    it('should return true when no follow list is found', async () => {
      sandbox.stub(uut.relayUtil, 'subscribe').resolves([])

      const result = await uut.run({ pubkey: 'b'.repeat(64) })

      assert.equal(result, true)
    })

    it('should return 0 on error', async () => {
      const result = await uut.run({})

      assert.equal(result, 0)
    })
  })
})
