import { finalizeEvent, generateSecretKey, getPublicKey, getEventHash } from 'nostr-tools/pure'
import { decode } from 'nostr-tools/nip19'
import * as nip04 from 'nostr-tools/nip04'
import { nip44 } from 'nostr-tools'
import { hexToBytes } from '@noble/hashes/utils'
import IdentityUtil from '../lib/identity-util.js'
import RelayUtil from '../lib/relay-util.js'
import config from '../../config/index.js'

class MsgSend {
  constructor () {
    this.identityUtil = new IdentityUtil()
    this.relayUtil = new RelayUtil()
    this.nip04 = nip04
    this.nip44 = nip44

    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
    this.resolvePubkey = this.resolvePubkey.bind(this)
    this.sendNip04 = this.sendNip04.bind(this)
    this.sendNip17 = this.sendNip17.bind(this)
    this.lookupDmRelays = this.lookupDmRelays.bind(this)
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

  // Look up a user's DM relay list (kind:10050).
  // Tries each relay individually to avoid multi-relay subscription errors.
  async lookupDmRelays (pubkey) {
    const filters = {
      kinds: [10050],
      authors: [pubkey],
      limit: 1
    }

    for (const relayUrl of config.relays) {
      try {
        const events = await this.relayUtil.subscribe([relayUrl], filters, { timeout: 3000 })
        if (events.length > 0) {
          const relayTags = events[0].tags.filter(t => t[0] === 'relay')
          if (relayTags.length > 0) {
            return relayTags.map(t => t[1])
          }
        }
      } catch (e) {
        // Try next relay
      }
    }

    // Fall back to default relays.
    return config.relays
  }

  // Send a NIP-04 (kind 4) direct message.
  async sendNip04 (sk, skHex, recipientPubkey, message, relayUrl) {
    const encrypted = await this.nip04.encrypt(skHex, recipientPubkey, message)

    const eventTemplate = {
      kind: 4,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['p', recipientPubkey]],
      content: encrypted
    }

    const signedEvent = finalizeEvent(eventTemplate, sk)
    await this.relayUtil.publishEvent(relayUrl, signedEvent)

    return signedEvent
  }

  // Send a NIP-17 (kind 1059) gift-wrapped direct message.
  async sendNip17 (sk, skHex, recipientPubkey, message, dmRelays) {
    const myPubkey = getPublicKey(sk)
    const myPrivKeyBytes = hexToBytes(skHex)

    // Step 1: Create the rumor (unsigned, kind 14 for DMs).
    // The rumor has an id (event hash) but no signature.
    const rumorTemplate = {
      kind: 14,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: message,
      pubkey: myPubkey
    }
    const rumor = {
      ...rumorTemplate,
      id: getEventHash(rumorTemplate)
    }

    // Step 2: Encrypt rumor with recipient's key → seal (kind 13).
    const recipientConvKey = this.nip44.getConversationKey(myPrivKeyBytes, recipientPubkey)
    const encryptedRumor = this.nip44.encrypt(JSON.stringify(rumor), recipientConvKey)

    const sealTemplate = {
      kind: 13,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: encryptedRumor
    }
    const seal = finalizeEvent(sealTemplate, sk)

    // Step 3: Generate random key → encrypt seal with recipient's key → gift wrap (kind 1059).
    const randomSk = generateSecretKey()
    const randomConvKey = this.nip44.getConversationKey(randomSk, recipientPubkey)
    const encryptedSeal = this.nip44.encrypt(JSON.stringify(seal), randomConvKey)

    const giftWrapTemplate = {
      kind: 1059,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['p', recipientPubkey]],
      content: encryptedSeal
    }
    const giftWrap = finalizeEvent(giftWrapTemplate, randomSk)

    // Step 4: Publish to the recipient's DM relays, plus fallback to default relays.
    const publishRelays = [...new Set([...dmRelays, ...config.relays])]
    for (const relayUrl of publishRelays) {
      try {
        await this.relayUtil.publishEvent(relayUrl, giftWrap)
        console.log(`  Published to DM relay: ${relayUrl}`)
      } catch (err) {
        console.log(`  Failed to publish to ${relayUrl}: ${err.message}`)
      }
    }

    return giftWrap
  }

  async run (flags) {
    try {
      this.validateFlags(flags)

      const sk = this.identityUtil.getSigningKey(flags.name)
      const recipientPubkey = this.resolvePubkey(flags.pubkey)
      const skHex = this.identityUtil.loadIdentity(flags.name).privateKey

      if (flags.nip17) {
        // NIP-17 gift-wrapped DM
        console.log('Looking up recipient DM relay list...')
        const dmRelays = await this.lookupDmRelays(recipientPubkey)
        console.log(`DM relays: ${dmRelays.join(', ')}`)

        const giftWrap = await this.sendNip17(sk, skHex, recipientPubkey, flags.message, dmRelays)

        console.log('\nNIP-17 encrypted message sent successfully.')
        console.log(`  Gift Wrap Event ID: ${giftWrap.id}`)
        console.log(`  Recipient: ${recipientPubkey.slice(0, 8)}...`)
      } else {
        // NIP-04 DM (default)
        const relayUrl = flags.relay || config.defaultRelay
        const signedEvent = await this.sendNip04(sk, skHex, recipientPubkey, flags.message, relayUrl)

        console.log('NIP-04 encrypted message sent successfully.')
        console.log(`  Event ID: ${signedEvent.id}`)
        console.log(`  Recipient: ${recipientPubkey.slice(0, 8)}...`)
        console.log(`  Relay: ${relayUrl}`)
      }

      return true
    } catch (err) {
      console.error('Error in msg-send: ', err)
      return 0
    }
  }
}

export default MsgSend
