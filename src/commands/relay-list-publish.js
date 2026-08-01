import { finalizeEvent } from 'nostr-tools/pure'
import IdentityUtil from '../lib/identity-util.js'
import RelayUtil from '../lib/relay-util.js'
import config from '../../config/index.js'

class RelayListPublish {
  constructor () {
    this.identityUtil = new IdentityUtil()
    this.relayUtil = new RelayUtil()

    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
  }

  validateFlags (flags) {
    if (!flags.name) {
      throw new Error('You must specify an identity with the -n flag.')
    }
  }

  async run (flags) {
    try {
      this.validateFlags(flags)

      const sk = this.identityUtil.getSigningKey(flags.name)
      const relayUrl = flags.relay || config.defaultRelay

      // Parse relay list from --relays flag, or use defaults from config.
      const relayUrls = flags.relays
        ? flags.relays.split(',').map(r => r.trim())
        : config.relays

      const tags = relayUrls.map(url => ['r', url])

      const eventTemplate = {
        kind: 10002,
        created_at: Math.floor(Date.now() / 1000),
        tags,
        content: ''
      }

      const signedEvent = finalizeEvent(eventTemplate, sk)
      await this.relayUtil.publishEvent(relayUrl, signedEvent)

      console.log('Relay list (kind:10002) published successfully.')
      console.log(`  Event ID: ${signedEvent.id}`)
      console.log(`  Relay: ${relayUrl}`)
      console.log(`  Relays listed: ${relayUrls.length}`)
      relayUrls.forEach(r => console.log(`    - ${r}`))

      return true
    } catch (err) {
      console.error('Error in relay-list-publish: ', err)
      return 0
    }
  }
}

export default RelayListPublish
