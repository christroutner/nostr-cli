import RelayUtil from '../lib/relay-util.js'
import config from '../../config/index.js'

class PostReadTopic {
  constructor () {
    this.relayUtil = new RelayUtil()

    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
    this.formatEvent = this.formatEvent.bind(this)
  }

  validateFlags (flags) {
    if (!flags.topic) {
      throw new Error('You must specify a topic with the -t flag.')
    }
  }

  formatEvent (ev) {
    const date = new Date(ev.created_at * 1000).toISOString()
    return `[${date}] (${ev.id.slice(0, 8)}...) by ${ev.pubkey.slice(0, 8)}...\n  ${ev.content}\n`
  }

  async run (flags) {
    try {
      this.validateFlags(flags)

      const limit = parseInt(flags.limit) || 10
      const relays = flags.relay ? [flags.relay] : config.relays

      const filters = {
        kinds: [867],
        '#t': [flags.topic],
        limit
      }

      console.log(`Fetching posts for topic "${flags.topic}"...`)

      const events = await this.relayUtil.subscribe(relays, filters)

      if (events.length === 0) {
        console.log('No posts found for this topic.')
        return true
      }

      events.sort((a, b) => b.created_at - a.created_at)

      for (const ev of events) {
        console.log(this.formatEvent(ev))
      }

      console.log(`Total: ${events.length} post(s)`)

      return true
    } catch (err) {
      console.error('Error in post-read-topic: ', err)
      return 0
    }
  }
}

export default PostReadTopic
