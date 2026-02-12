import { generateSecretKey, getPublicKey } from 'nostr-tools/pure'
import { npubEncode, nsecEncode } from 'nostr-tools/nip19'
import { bytesToHex } from '@noble/hashes/utils'
import IdentityUtil from '../lib/identity-util.js'

class IdentityCreate {
  constructor () {
    this.identityUtil = new IdentityUtil()

    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
    this.createIdentity = this.createIdentity.bind(this)
  }

  validateFlags (flags) {
    if (!flags.name) {
      throw new Error('You must specify an identity name with the -n flag.')
    }
  }

  createIdentity (name, description) {
    const sk = generateSecretKey()
    const pk = getPublicKey(sk)

    const identity = {
      name,
      privateKey: bytesToHex(sk),
      publicKey: pk,
      nsec: nsecEncode(sk),
      npub: npubEncode(pk),
      description: description || '',
      createdAt: new Date().toISOString()
    }

    return identity
  }

  async run (flags) {
    try {
      this.validateFlags(flags)

      const identity = this.createIdentity(flags.name, flags.description)
      this.identityUtil.saveIdentity(identity, flags.name)

      console.log(`Identity "${flags.name}" created successfully.`)
      console.log(`  npub: ${identity.npub}`)
      console.log(`  nsec: ${identity.nsec}`)
      console.log(`  Public Key (hex): ${identity.publicKey}`)

      return true
    } catch (err) {
      console.error('Error in identity-create: ', err)
      return 0
    }
  }
}

export default IdentityCreate
