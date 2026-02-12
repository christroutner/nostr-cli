import { decode, npubEncode, nsecEncode, noteEncode } from 'nostr-tools/nip19'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils'

class Convert {
  constructor () {
    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
    this.convert = this.convert.bind(this)
  }

  validateFlags (flags) {
    if (!flags.input) {
      throw new Error('You must specify an input value with the -i flag.')
    }
  }

  convert (input, fromHint) {
    const results = {}

    // Try to detect the format automatically.
    if (input.startsWith('npub')) {
      const decoded = decode(input)
      results.type = 'npub (public key)'
      results.hex = decoded.data
      results.npub = input
    } else if (input.startsWith('nsec')) {
      const decoded = decode(input)
      results.type = 'nsec (private key)'
      results.hex = bytesToHex(decoded.data)
      results.nsec = input
    } else if (input.startsWith('note')) {
      const decoded = decode(input)
      results.type = 'note (event ID)'
      results.hex = decoded.data
      results.note = input
    } else {
      // Assume hex input. Use the --from hint to determine what it represents.
      const from = (fromHint || '').toLowerCase()

      if (from === 'pubkey' || from === 'npub') {
        results.type = 'hex public key'
        results.hex = input
        results.npub = npubEncode(input)
      } else if (from === 'privkey' || from === 'nsec') {
        results.type = 'hex private key'
        results.hex = input
        results.nsec = nsecEncode(hexToBytes(input))
      } else if (from === 'eventid' || from === 'note') {
        results.type = 'hex event ID'
        results.hex = input
        results.note = noteEncode(input)
      } else {
        // Try all conversions when no hint is given.
        results.type = 'hex (unknown type - use -f to specify)'
        results.hex = input
        try { results.npub = npubEncode(input) } catch (e) {}
        try { results.nsec = nsecEncode(hexToBytes(input)) } catch (e) {}
        try { results.note = noteEncode(input) } catch (e) {}
      }
    }

    return results
  }

  async run (flags) {
    try {
      this.validateFlags(flags)

      const results = this.convert(flags.input, flags.from)

      console.log(`Input type: ${results.type}`)
      if (results.hex) console.log(`  Hex:  ${results.hex}`)
      if (results.npub) console.log(`  npub: ${results.npub}`)
      if (results.nsec) console.log(`  nsec: ${results.nsec}`)
      if (results.note) console.log(`  note: ${results.note}`)

      return true
    } catch (err) {
      console.error('Error in convert: ', err)
      return 0
    }
  }
}

export default Convert
