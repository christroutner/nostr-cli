import { decode } from 'nostr-tools/nip19'
import RelayUtil from '../lib/relay-util.js'
import config from '../../config/index.js'

class PostReadId {
  constructor () {
    this.relayUtil = new RelayUtil()

    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
    this.resolveEventId = this.resolveEventId.bind(this)
  }

  validateFlags (flags) {
    if (!flags.eventid) {
      throw new Error('You must specify an event ID with the -e flag.')
    }
  }

  // Resolve a note1... ID or hex event ID to hex.
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

      const eventId = this.resolveEventId(flags.eventid)
      const relays = flags.relay ? [flags.relay] : config.relays

      const filters = {
        ids: [eventId]
      }

      console.log(`Fetching event ${eventId.slice(0, 8)}...`)

      const events = await this.relayUtil.subscribe(relays, filters)

      if (events.length === 0) {
        console.log('Event not found.')
        return true
      }

      const ev = events[0]
      const date = new Date(ev.created_at * 1000).toISOString()

      console.log(`Event ID: ${ev.id}`)
      console.log(`Author:   ${ev.pubkey}`)
      console.log(`Kind:     ${ev.kind}`)
      console.log(`Date:     ${date}`)
      console.log(`Tags:     ${JSON.stringify(ev.tags)}`)
      console.log(`Content:  ${ev.content}`)

      return true
    } catch (err) {
      console.error('Error in post-read-id: ', err)
      return 0
    }
  }
}

export default PostReadId
