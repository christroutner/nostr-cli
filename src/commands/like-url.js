import { finalizeEvent } from 'nostr-tools/pure'
import IdentityUtil from '../lib/identity-util.js'
import RelayUtil from '../lib/relay-util.js'
import config from '../../config/index.js'

class LikeUrl {
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
    if (!flags.url) {
      throw new Error('You must specify a URL with the -u flag.')
    }
  }

  async run (flags) {
    try {
      this.validateFlags(flags)

      const sk = this.identityUtil.getSigningKey(flags.name)
      const relayUrl = flags.relay || config.defaultRelay

      const eventTemplate = {
        kind: 17,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['r', flags.url]],
        content: '+'
      }

      const signedEvent = finalizeEvent(eventTemplate, sk)
      await this.relayUtil.publishEvent(relayUrl, signedEvent)

      console.log('URL reaction published successfully.')
      console.log(`  Event ID: ${signedEvent.id}`)
      console.log(`  Liked URL: ${flags.url}`)

      return true
    } catch (err) {
      console.error('Error in like-url: ', err)
      return 0
    }
  }
}

export default LikeUrl
