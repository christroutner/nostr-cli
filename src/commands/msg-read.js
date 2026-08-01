import { decode } from 'nostr-tools/nip19'
import * as nip04 from 'nostr-tools/nip04'
import { nip44 } from 'nostr-tools'
import { hexToBytes } from '@noble/hashes/utils'
import IdentityUtil from '../lib/identity-util.js'
import RelayUtil from '../lib/relay-util.js'
import config from '../../config/index.js'

class MsgRead {
  constructor () {
    this.identityUtil = new IdentityUtil()
    this.relayUtil = new RelayUtil()
    this.nip04 = nip04
    this.nip44 = nip44

    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
    this.resolvePubkey = this.resolvePubkey.bind(this)
    this.decryptNip04 = this.decryptNip04.bind(this)
    this.decryptNip17 = this.decryptNip17.bind(this)
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

  // Decrypt a NIP-04 (kind 4) direct message.
  async decryptNip04 (identity, ev) {
    const decrypted = await this.nip04.decrypt(
      identity.privateKey,
      ev.pubkey,
      ev.content
    )
    return decrypted
  }

  // Decrypt a NIP-17 (kind 1059) gift-wrapped direct message.
  // Decrypts gift wrap → seal (kind 13) → rumor (kind 14).
  decryptNip17 (identity, ev) {
    const myPrivKeyBytes = hexToBytes(identity.privateKey)
    const wrapperPubkey = ev.pubkey

    // Step 1: Decrypt the gift wrap using our key + wrapper's pubkey.
    const wrapperConvKey = this.nip44.getConversationKey(myPrivKeyBytes, wrapperPubkey)
    const sealJson = this.nip44.decrypt(ev.content, wrapperConvKey)
    const seal = JSON.parse(sealJson)

    // Step 2: Verify it's a seal (kind 13).
    if (seal.kind !== 13) {
      throw new Error(`Expected kind 13 seal, got kind ${seal.kind}`)
    }

    // Step 3: Decrypt the seal using our key + sender's pubkey.
    const senderPubkey = seal.pubkey
    const senderConvKey = this.nip44.getConversationKey(myPrivKeyBytes, senderPubkey)
    const rumorJson = this.nip44.decrypt(seal.content, senderConvKey)
    const rumor = JSON.parse(rumorJson)

    return {
      content: rumor.content,
      senderPubkey,
      rumorKind: rumor.kind
    }
  }

  async run (flags) {
    try {
      this.validateFlags(flags)

      const identity = this.identityUtil.loadIdentity(flags.name)
      const myPubkey = identity.publicKey
      const limit = parseInt(flags.limit) || 10
      const relays = flags.relay ? [flags.relay] : config.relays

      // Build filter for both NIP-04 (kind 4) and NIP-17 (kind 1059) DMs.
      const filters = {
        kinds: [4, 1059],
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
        const date = new Date(ev.created_at * 1000).toISOString()

        try {
          if (ev.kind === 4) {
            // NIP-04 DM
            const decrypted = await this.decryptNip04(identity, ev)
            console.log(`[${date}] From: ${ev.pubkey.slice(0, 8)}... (NIP-04)`)
            console.log(`  ${decrypted}\n`)
          } else if (ev.kind === 1059) {
            // NIP-17 gift-wrapped DM
            const result = this.decryptNip17(identity, ev)
            console.log(`[${date}] From: ${result.senderPubkey.slice(0, 8)}... (NIP-17)`)
            console.log(`  ${result.content}\n`)
          }
        } catch (decErr) {
          console.log(`[${date}] From: ${ev.pubkey.slice(0, 8)}... (decryption failed: ${decErr.message})\n`)
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
