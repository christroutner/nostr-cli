import { finalizeEvent } from 'nostr-tools/pure'
import { decode } from 'nostr-tools/nip19'
import IdentityUtil from '../lib/identity-util.js'
import RelayUtil from '../lib/relay-util.js'
import config from '../../config/index.js'

class LikeEvent {
  constructor () {
    this.identityUtil = new IdentityUtil()
    this.relayUtil = new RelayUtil()

    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
    this.resolveEventId = this.resolveEventId.bind(this)
  }

  validateFlags (flags) {
    if (!flags.name) {
      throw new Error('You must specify an identity with the -n flag.')
    }
    if (!flags.eventid) {
      throw new Error('You must specify an event ID with the -e flag.')
    }
  }

  resolveEventId (input) {
    if (input.startsWith('note')) {
      const decoded = decode(input)
      if (decoded.type !== 'note') {
        throw new Error('Invalid note format.')
      }
      return decoded.data
    }
    return input
  }

  async run (flags) {
    try {
      this.validateFlags(flags)

      const sk = this.identityUtil.getSigningKey(flags.name)
      const eventId = this.resolveEventId(flags.eventid)
      const relayUrl = flags.relay || config.defaultRelay

      const eventTemplate = {
        kind: 7,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['e', eventId, relayUrl],
          ['p', flags.author || '']
        ],
        content: '+'
      }

      // Remove empty author tag if not provided.
      if (!flags.author) {
        eventTemplate.tags = [['e', eventId, relayUrl]]
      }

      const signedEvent = finalizeEvent(eventTemplate, sk)
      await this.relayUtil.publishEvent(relayUrl, signedEvent)

      console.log('Reaction published successfully.')
      console.log(`  Event ID: ${signedEvent.id}`)
      console.log(`  Liked event: ${eventId.slice(0, 8)}...`)

      return true
    } catch (err) {
      console.error('Error in like-event: ', err)
      return 0
    }
  }
}

export default LikeEvent
