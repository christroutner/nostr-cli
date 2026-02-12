import { finalizeEvent } from 'nostr-tools/pure'
import { decode } from 'nostr-tools/nip19'
import IdentityUtil from '../lib/identity-util.js'
import RelayUtil from '../lib/relay-util.js'
import config from '../../config/index.js'

class FollowUpdate {
  constructor () {
    this.identityUtil = new IdentityUtil()
    this.relayUtil = new RelayUtil()

    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
    this.resolvePubkey = this.resolvePubkey.bind(this)
  }

  validateFlags (flags) {
    if (!flags.name) {
      throw new Error('You must specify an identity with the -n flag.')
    }
    if (!flags.pubkeys) {
      throw new Error('You must specify pubkeys to follow with the -p flag (comma-separated).')
    }
  }

  resolvePubkey (input) {
    if (input.startsWith('npub')) {
      const decoded = decode(input)
      if (decoded.type !== 'npub') {
        throw new Error('Invalid npub format.')
      }
      return decoded.data
    }
    return input
  }

  async run (flags) {
    try {
      this.validateFlags(flags)

      const sk = this.identityUtil.getSigningKey(flags.name)
      const relayUrl = flags.relay || config.defaultRelay

      // Parse comma-separated pubkeys.
      const pubkeys = flags.pubkeys.split(',').map(p => p.trim())
      const tags = pubkeys.map(p => {
        const resolved = this.resolvePubkey(p)
        return ['p', resolved, relayUrl, '']
      })

      const eventTemplate = {
        kind: 3,
        created_at: Math.floor(Date.now() / 1000),
        tags,
        content: ''
      }

      const signedEvent = finalizeEvent(eventTemplate, sk)
      await this.relayUtil.publishEvent(relayUrl, signedEvent)

      console.log('Follow list updated successfully.')
      console.log(`  Event ID: ${signedEvent.id}`)
      console.log(`  Following: ${pubkeys.length} user(s)`)

      return true
    } catch (err) {
      console.error('Error in follow-update: ', err)
      return 0
    }
  }
}

export default FollowUpdate
