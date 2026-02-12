import { assert } from 'chai'
import sinon from 'sinon'
import Convert from '../../../src/commands/convert.js'
import { npubEncode, nsecEncode, noteEncode } from 'nostr-tools/nip19'
import { generateSecretKey, getPublicKey } from 'nostr-tools/pure'
import { bytesToHex } from '@noble/hashes/utils'

describe('#convert', () => {
  let uut
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    uut = new Convert()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#validateFlags()', () => {
    it('should throw if input is not provided', () => {
      try {
        uut.validateFlags({})
        assert.fail('Expected an error')
      } catch (err) {
        assert.include(err.message, '-i flag')
      }
    })
  })

  describe('#convert()', () => {
    it('should convert an npub to hex', () => {
      const sk = generateSecretKey()
      const pk = getPublicKey(sk)
      const npub = npubEncode(pk)

      const result = uut.convert(npub)

      assert.equal(result.type, 'npub (public key)')
      assert.equal(result.hex, pk)
    })

    it('should convert an nsec to hex', () => {
      const sk = generateSecretKey()
      const nsec = nsecEncode(sk)

      const result = uut.convert(nsec)

      assert.equal(result.type, 'nsec (private key)')
      assert.equal(result.hex, bytesToHex(sk))
    })

    it('should convert hex pubkey with hint', () => {
      const sk = generateSecretKey()
      const pk = getPublicKey(sk)

      const result = uut.convert(pk, 'pubkey')

      assert.equal(result.type, 'hex public key')
      assert.isString(result.npub)
      assert.isTrue(result.npub.startsWith('npub'))
    })

    it('should convert hex event ID with hint', () => {
      const eventId = 'c'.repeat(64)

      const result = uut.convert(eventId, 'eventid')

      assert.equal(result.type, 'hex event ID')
      assert.isString(result.note)
      assert.isTrue(result.note.startsWith('note'))
    })

    it('should attempt all conversions for hex without hint', () => {
      const hex = 'c'.repeat(64)

      const result = uut.convert(hex)

      assert.include(result.type, 'hex')
      assert.equal(result.hex, hex)
    })
  })

  describe('#run()', () => {
    it('should return true on success', async () => {
      const sk = generateSecretKey()
      const npub = npubEncode(getPublicKey(sk))

      const result = await uut.run({ input: npub })

      assert.equal(result, true)
    })

    it('should return 0 on error', async () => {
      const result = await uut.run({})

      assert.equal(result, 0)
    })
  })
})
