import { decode } from 'nostr-tools/nip19'
import RelayUtil from '../lib/relay-util.js'

const TROUT_NPUB = 'npub188msq9d8tkdnakhlg9j0sn4602773et7ue95u5xeuszf082wx79qq4vz6a'
const RELAY = 'wss://relay.damus.io'

class TroutFollowDay {
  constructor () {
    this.relayUtil = new RelayUtil()

    this.run = this.run.bind(this)
    this.formatEvent = this.formatEvent.bind(this)
  }

  formatEvent (ev) {
    const date = new Date(ev.created_at * 1000).toISOString()
    return `[${date}] ${ev.pubkey.slice(0, 8)}... (${ev.id.slice(0, 8)}...)\n  ${ev.content}\n`
  }

  async run () {
    try {
      // Step 1: Decode trout's npub to hex pubkey.
      const decoded = decode(TROUT_NPUB)
      const troutPubkey = decoded.data
      console.log(`Fetching follow list for ${troutPubkey.slice(0, 8)}...`)

      // Step 2: Get follow list (Kind 3) from the relay.
      const followFilters = {
        kinds: [3],
        authors: [troutPubkey],
        limit: 1
      }

      const followEvents = await this.relayUtil.subscribe([RELAY], followFilters)

      if (followEvents.length === 0) {
        console.log('No follow list found.')
        return true
      }

      // Use the most recent Kind 3 event.
      const contactEvent = followEvents.sort((a, b) => b.created_at - a.created_at)[0]
      const followPubkeys = contactEvent.tags
        .filter(t => t[0] === 'p')
        .map(t => t[1])

      if (followPubkeys.length === 0) {
        console.log('Follow list is empty.')
        return true
      }

      console.log(`Found ${followPubkeys.length} follows. Fetching posts from the last 24 hours...\n`)

      // Step 3: Query for Kind 1 posts from the last 24 hours by those authors.
      const oneDayAgo = Math.floor(Date.now() / 1000) - (24 * 60 * 60)

      const postFilters = {
        kinds: [1],
        authors: followPubkeys,
        since: oneDayAgo,
        limit: 500
      }

      const posts = await this.relayUtil.subscribe([RELAY], postFilters, { timeout: 15000 })

      if (posts.length === 0) {
        console.log('No posts from follows in the last 24 hours.')
        return true
      }

      // Sort by created_at descending (newest first).
      posts.sort((a, b) => b.created_at - a.created_at)

      for (const ev of posts) {
        console.log(this.formatEvent(ev))
      }

      console.log(`Total: ${posts.length} post(s) from follows in the last 24 hours`)

      return true
    } catch (err) {
      console.error('Error in trout-follow-day: ', err)
      return 0
    }
  }
}

export default TroutFollowDay
