import { finalizeEvent } from 'nostr-tools/pure'
import IdentityUtil from '../lib/identity-util.js'
import RelayUtil from '../lib/relay-util.js'
import config from '../../config/index.js'

class ChatUpdate {
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
    if (!flags.eventid) {
      throw new Error('You must specify the channel creation event ID with the -e flag.')
    }
  }

  async run (flags) {
    try {
      this.validateFlags(flags)

      const sk = this.identityUtil.getSigningKey(flags.name)
      const relayUrl = flags.relay || config.defaultRelay

      const metadata = {}
      if (flags.roomName) metadata.name = flags.roomName
      if (flags.about) metadata.about = flags.about
      if (flags.picture) metadata.picture = flags.picture
      metadata.relays = [relayUrl]

      const eventTemplate = {
        kind: 41,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['e', flags.eventid, relayUrl, 'root']],
        content: JSON.stringify(metadata)
      }

      const signedEvent = finalizeEvent(eventTemplate, sk)
      await this.relayUtil.publishEvent(relayUrl, signedEvent)

      console.log('Chat room metadata updated successfully.')
      console.log(`  Event ID: ${signedEvent.id}`)
      console.log(`  Channel: ${flags.eventid.slice(0, 8)}...`)

      return true
    } catch (err) {
      console.error('Error in chat-update: ', err)
      return 0
    }
  }
}

export default ChatUpdate
