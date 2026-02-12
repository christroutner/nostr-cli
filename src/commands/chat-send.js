import { finalizeEvent } from 'nostr-tools/pure'
import IdentityUtil from '../lib/identity-util.js'
import RelayUtil from '../lib/relay-util.js'
import config from '../../config/index.js'

class ChatSend {
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
    if (!flags.message) {
      throw new Error('You must specify a message with the -m flag.')
    }
  }

  async run (flags) {
    try {
      this.validateFlags(flags)

      const sk = this.identityUtil.getSigningKey(flags.name)
      const relayUrl = flags.relay || config.defaultRelay

      const eventTemplate = {
        kind: 42,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['e', flags.eventid, relayUrl, 'root']],
        content: flags.message
      }

      const signedEvent = finalizeEvent(eventTemplate, sk)
      await this.relayUtil.publishEvent(relayUrl, signedEvent)

      console.log('Chat message sent successfully.')
      console.log(`  Event ID: ${signedEvent.id}`)
      console.log(`  Channel: ${flags.eventid.slice(0, 8)}...`)

      return true
    } catch (err) {
      console.error('Error in chat-send: ', err)
      return 0
    }
  }
}

export default ChatSend
