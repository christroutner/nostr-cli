import { finalizeEvent } from 'nostr-tools/pure'
import IdentityUtil from '../lib/identity-util.js'
import RelayUtil from '../lib/relay-util.js'
import config from '../../config/index.js'

class ChatCreate {
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
    if (!flags.roomName) {
      throw new Error('You must specify a room name with the --room-name flag.')
    }
  }

  async run (flags) {
    try {
      this.validateFlags(flags)

      const sk = this.identityUtil.getSigningKey(flags.name)
      const relayUrl = flags.relay || config.defaultRelay

      const metadata = {
        name: flags.roomName,
        about: flags.about || '',
        picture: flags.picture || '',
        relays: [relayUrl]
      }

      const eventTemplate = {
        kind: 40,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: JSON.stringify(metadata)
      }

      const signedEvent = finalizeEvent(eventTemplate, sk)
      await this.relayUtil.publishEvent(relayUrl, signedEvent)

      console.log('Chat room created successfully.')
      console.log(`  Event ID: ${signedEvent.id}`)
      console.log(`  Room Name: ${flags.roomName}`)
      console.log(`  Relay: ${relayUrl}`)
      console.log('\nUse this event ID to send messages to the room with chat-send.')

      return true
    } catch (err) {
      console.error('Error in chat-create: ', err)
      return 0
    }
  }
}

export default ChatCreate
