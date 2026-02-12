import { getPublicKey } from 'nostr-tools/pure'
import { decode } from 'nostr-tools/nip19'
import * as nip04 from 'nostr-tools/nip04'
import IdentityUtil from '../lib/identity-util.js'
import RelayUtil from '../lib/relay-util.js'
import config from '../../config/index.js'

class MsgRead {
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
      throw new Error('You must specify your identity with the -n flag.')
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

      const identity = this.identityUtil.loadIdentity(flags.name)
      const sk = this.identityUtil.getSigningKey(flags.name)
      const myPubkey = identity.publicKey
      const limit = parseInt(flags.limit) || 10
      const relays = flags.relay ? [flags.relay] : config.relays

      // Build filter for DMs sent to this identity.
      const filters = {
        kinds: [4],
        '#p': [myPubkey],
        limit
      }

      // If a specific sender is specified, filter by author.
      if (flags.pubkey) {
        const senderPubkey = this.resolvePubkey(flags.pubkey)
        filters.authors = [senderPubkey]
      }

      console.log('Fetching encrypted messages...')

      const events = await this.relayUtil.subscribe(relays, filters)

      if (events.length === 0) {
        console.log('No messages found.')
        return true
      }

      // Sort by created_at descending.
      events.sort((a, b) => b.created_at - a.created_at)

      for (const ev of events) {
        try {
          const decrypted = await this.nip04.decrypt(
            identity.privateKey,
            ev.pubkey,
            ev.content
          )
          const date = new Date(ev.created_at * 1000).toISOString()
          console.log(`[${date}] From: ${ev.pubkey.slice(0, 8)}...`)
          console.log(`  ${decrypted}\n`)
        } catch (decErr) {
          const date = new Date(ev.created_at * 1000).toISOString()
          console.log(`[${date}] From: ${ev.pubkey.slice(0, 8)}... (decryption failed)\n`)
        }
      }

      console.log(`Total: ${events.length} message(s)`)

      return true
    } catch (err) {
      console.error('Error in msg-read: ', err)
      return 0
    }
  }
}

export default MsgRead
