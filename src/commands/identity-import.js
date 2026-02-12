import { getPublicKey } from 'nostr-tools/pure'
import { npubEncode, nsecEncode, decode } from 'nostr-tools/nip19'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils'
import IdentityUtil from '../lib/identity-util.js'

class IdentityImport {
  constructor () {
    this.identityUtil = new IdentityUtil()

    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
    this.importKey = this.importKey.bind(this)
  }

  validateFlags (flags) {
    if (!flags.name) {
      throw new Error('You must specify an identity name with the -n flag.')
    }
    if (!flags.key) {
      throw new Error('You must specify a private key with the -k flag (nsec or hex).')
    }
  }

  importKey (key) {
    let skBytes

    if (key.startsWith('nsec')) {
      const decoded = decode(key)
      if (decoded.type !== 'nsec') {
        throw new Error('Invalid nsec key.')
      }
      skBytes = decoded.data
    } else {
      // Assume hex private key
      skBytes = hexToBytes(key)
    }

    const pk = getPublicKey(skBytes)

    return {
      privateKey: bytesToHex(skBytes),
      publicKey: pk,
      nsec: nsecEncode(skBytes),
      npub: npubEncode(pk)
    }
  }

  async run (flags) {
    try {
      this.validateFlags(flags)

      const keyData = this.importKey(flags.key)

      const identity = {
        name: flags.name,
        ...keyData,
        description: flags.description || 'Imported identity',
        createdAt: new Date().toISOString()
      }

      this.identityUtil.saveIdentity(identity, flags.name)

      console.log(`Identity "${flags.name}" imported successfully.`)
      console.log(`  npub: ${identity.npub}`)
      console.log(`  Public Key (hex): ${identity.publicKey}`)

      return true
    } catch (err) {
      console.error('Error in identity-import: ', err)
      return 0
    }
  }
}

export default IdentityImport
