import { decode } from 'nostr-tools/nip19'
import RelayUtil from '../lib/relay-util.js'
import config from '../../config/index.js'

class LikesGet {
  constructor () {
    this.relayUtil = new RelayUtil()

    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
    this.resolveEventId = this.resolveEventId.bind(this)
  }

  validateFlags (flags) {
    if (!flags.eventid && !flags.url) {
      throw new Error('You must specify an event ID (-e) or a URL (-u).')
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

      const relays = flags.relay ? [flags.relay] : config.relays
      let filters

      if (flags.eventid) {
        const eventId = this.resolveEventId(flags.eventid)
        filters = {
          kinds: [7],
          '#e': [eventId]
        }
        console.log(`Fetching reactions for event ${eventId.slice(0, 8)}...`)
      } else {
        filters = {
          kinds: [17],
          '#r': [flags.url]
        }
        console.log(`Fetching reactions for URL ${flags.url}...`)
      }

      const events = await this.relayUtil.subscribe(relays, filters)

      const likes = events.filter(ev => ev.content === '+')
      const dislikes = events.filter(ev => ev.content === '-')

      console.log(`Total reactions: ${events.length}`)
      console.log(`  Likes (+): ${likes.length}`)
      console.log(`  Dislikes (-): ${dislikes.length}`)

      if (likes.length > 0) {
        console.log('\nLiked by:')
        for (const ev of likes) {
          console.log(`  ${ev.pubkey.slice(0, 16)}...`)
        }
      }

      return true
    } catch (err) {
      console.error('Error in likes-get: ', err)
      return 0
    }
  }
}

export default LikesGet
