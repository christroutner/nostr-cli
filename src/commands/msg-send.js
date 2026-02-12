import { finalizeEvent, getPublicKey } from 'nostr-tools/pure'
import { decode } from 'nostr-tools/nip19'
import * as nip04 from 'nostr-tools/nip04'
import IdentityUtil from '../lib/identity-util.js'
import RelayUtil from '../lib/relay-util.js'
import config from '../../config/index.js'

class MsgSend {
  constructor () {
    this.identityUtil = new IdentityUtil()
    this.relayUtil = new RelayUtil()
    this.nip04 = nip04

    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
    this.resolvePubkey = this.resolvePubkey.bind(this)
  }

  validateFlags (flags) {
    if (!flags.name) {
      throw new Error('You must specify an identity with the -n flag.')
    }
    if (!flags.pubkey) {
      throw new Error('You must specify the recipient pubkey with the -p flag.')
    }
    if (!flags.message) {
      throw new Error('You must specify a message with the -m flag.')
    }
  }

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

  async run (flags) {
    try {
      this.validateFlags(flags)

      const sk = this.identityUtil.getSigningKey(flags.name)
      const recipientPubkey = this.resolvePubkey(flags.pubkey)
      const skHex = this.identityUtil.loadIdentity(flags.name).privateKey

      const encrypted = await this.nip04.encrypt(skHex, recipientPubkey, flags.message)

      const eventTemplate = {
        kind: 4,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['p', recipientPubkey]],
        content: encrypted
      }

      const signedEvent = finalizeEvent(eventTemplate, sk)
      const relayUrl = flags.relay || config.defaultRelay

      await this.relayUtil.publishEvent(relayUrl, signedEvent)

      console.log('Encrypted message sent successfully.')
      console.log(`  Event ID: ${signedEvent.id}`)
      console.log(`  Recipient: ${recipientPubkey.slice(0, 8)}...`)

      return true
    } catch (err) {
      console.error('Error in msg-send: ', err)
      return 0
    }
  }
}

export default MsgSend
