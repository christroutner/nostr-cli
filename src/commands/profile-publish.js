import { finalizeEvent } from 'nostr-tools/pure'
import IdentityUtil from '../lib/identity-util.js'
import RelayUtil from '../lib/relay-util.js'
import config from '../../config/index.js'

class ProfilePublish {
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
  }

  async run (flags) {
    try {
      this.validateFlags(flags)

      const sk = this.identityUtil.getSigningKey(flags.name)
      const relayUrl = flags.relay || config.defaultRelay

      const metadata = {
        name: flags.name || '',
        display_name: flags.displayName || '',
        about: flags.about || '',
        picture: flags.picture || '',
        nip05: flags.nip05 || ''
      }

      const eventTemplate = {
        kind: 0,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: JSON.stringify(metadata)
      }

      const signedEvent = finalizeEvent(eventTemplate, sk)
      await this.relayUtil.publishEvent(relayUrl, signedEvent)

      console.log('Profile published successfully.')
      console.log(`  Event ID: ${signedEvent.id}`)
      console.log(`  Relay: ${relayUrl}`)
      console.log(`  Name: ${metadata.display_name || metadata.name}`)
      console.log(`  About: ${metadata.about}`)

      return true
    } catch (err) {
      console.error('Error in profile-publish: ', err)
      return 0
    }
  }
}

export default ProfilePublish
