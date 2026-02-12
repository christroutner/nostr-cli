import { decode } from 'nostr-tools/nip19'
import Table from 'cli-table'
import RelayUtil from '../lib/relay-util.js'
import config from '../../config/index.js'

class FollowList {
  constructor () {
    this.relayUtil = new RelayUtil()

    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
    this.resolvePubkey = this.resolvePubkey.bind(this)
  }

  validateFlags (flags) {
    if (!flags.pubkey) {
      throw new Error('You must specify a pubkey or npub with the -p flag.')
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

      const pubkey = this.resolvePubkey(flags.pubkey)
      const relays = flags.relay ? [flags.relay] : config.relays

      const filters = {
        kinds: [3],
        authors: [pubkey],
        limit: 1
      }

      console.log(`Fetching follow list for ${pubkey.slice(0, 8)}...`)

      const events = await this.relayUtil.subscribe(relays, filters)

      if (events.length === 0) {
        console.log('No follow list found for this user.')
        return true
      }

      // Use the most recent Kind 3 event.
      const contactEvent = events.sort((a, b) => b.created_at - a.created_at)[0]
      const follows = contactEvent.tags.filter(t => t[0] === 'p')

      if (follows.length === 0) {
        console.log('Follow list is empty.')
        return true
      }

      const table = new Table({
        head: ['#', 'Public Key', 'Relay', 'Petname'],
        colWidths: [5, 68, 40, 15]
      })

      follows.forEach((tag, i) => {
        table.push([
          i + 1,
          tag[1] || '',
          tag[2] || '',
          tag[3] || ''
        ])
      })

      console.log(table.toString())
      console.log(`Total: ${follows.length} follow(s)`)

      return true
    } catch (err) {
      console.error('Error in follow-list: ', err)
      return 0
    }
  }
}

export default FollowList
