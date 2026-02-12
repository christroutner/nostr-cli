import { decode } from 'nostr-tools/nip19'
import RelayUtil from '../lib/relay-util.js'
import config from '../../config/index.js'

class PostRead {
  constructor () {
    this.relayUtil = new RelayUtil()

    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
    this.resolvePubkey = this.resolvePubkey.bind(this)
    this.formatEvent = this.formatEvent.bind(this)
  }

  validateFlags (flags) {
    if (!flags.pubkey) {
      throw new Error('You must specify a pubkey or npub with the -p flag.')
    }
  }

  // Resolve an npub or hex pubkey to hex format.
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

  formatEvent (ev) {
    const date = new Date(ev.created_at * 1000).toISOString()
    return `[${date}] (${ev.id.slice(0, 8)}...)\n  ${ev.content}\n`
  }

  async run (flags) {
    try {
      this.validateFlags(flags)

      const pubkey = this.resolvePubkey(flags.pubkey)
      const limit = parseInt(flags.limit) || 10
      const relays = flags.relay ? [flags.relay] : config.relays

      const filters = {
        kinds: [1],
        authors: [pubkey],
        limit
      }

      console.log(`Fetching posts from ${pubkey.slice(0, 8)}...`)

      const events = await this.relayUtil.subscribe(relays, filters)

      if (events.length === 0) {
        console.log('No posts found.')
        return true
      }

      // Sort by created_at descending.
      events.sort((a, b) => b.created_at - a.created_at)

      for (const ev of events) {
        console.log(this.formatEvent(ev))
      }

      console.log(`Total: ${events.length} post(s)`)

      return true
    } catch (err) {
      console.error('Error in post-read: ', err)
      return 0
    }
  }
}

export default PostRead
