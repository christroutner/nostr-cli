import { finalizeEvent } from 'nostr-tools/pure'
import IdentityUtil from '../lib/identity-util.js'
import RelayUtil from '../lib/relay-util.js'
import config from '../../config/index.js'

class PostTopic {
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
    if (!flags.message) {
      throw new Error('You must specify a message with the -m flag.')
    }
    if (!flags.topic) {
      throw new Error('You must specify a topic with the -t flag.')
    }
  }

  async run (flags) {
    try {
      this.validateFlags(flags)

      const sk = this.identityUtil.getSigningKey(flags.name)

      const eventTemplate = {
        kind: 867,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['t', flags.topic]],
        content: flags.message
      }

      const signedEvent = finalizeEvent(eventTemplate, sk)
      const relayUrl = flags.relay || config.defaultRelay

      await this.relayUtil.publishEvent(relayUrl, signedEvent)

      console.log('Topic post published successfully.')
      console.log(`  Event ID: ${signedEvent.id}`)
      console.log(`  Topic: ${flags.topic}`)
      console.log(`  Relay: ${relayUrl}`)

      return true
    } catch (err) {
      console.error('Error in post-topic: ', err)
      return 0
    }
  }
}

export default PostTopic
