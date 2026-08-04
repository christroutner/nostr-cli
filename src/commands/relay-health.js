import { finalizeEvent } from 'nostr-tools/pure'
import WebSocket from 'ws'
import { useWebSocketImplementation, Relay } from 'nostr-tools/relay'
import IdentityUtil from '../lib/identity-util.js'
import config from '../../config/index.js'

useWebSocketImplementation(WebSocket)

class RelayHealth {
  constructor () {
    this.identityUtil = new IdentityUtil()

    this.run = this.run.bind(this)
    this.checkRead = this.checkRead.bind(this)
    this.checkReadback = this.checkReadback.bind(this)
  }

  // Subscribe and wait for EOSE (or a received event). Resolves true if the
  // relay processed the subscription (read path OK), false on timeout.
  checkRead (relay) {
    return new Promise((resolve) => {
      let settled = false
      const finish = (ok) => {
        if (!settled) {
          settled = true
          try { sub.close() } catch (e) {}
          resolve(ok)
        }
      }

      const sub = relay.subscribe([{ limit: 1 }], {
        onevent: () => finish(true),
        oneose: () => finish(true)
      })

      setTimeout(() => finish(false), 10000)
    })
  }

  // Subscribe filtered by the published event id. Resolves true if the event
  // comes back (persistence OK), false if EOSE arrives without it or timeout.
  checkReadback (relay, eventId) {
    return new Promise((resolve) => {
      let settled = false
      const finish = (ok) => {
        if (!settled) {
          settled = true
          try { sub.close() } catch (e) {}
          resolve(ok)
        }
      }

      const sub = relay.subscribe([{ ids: [eventId] }], {
        onevent: (ev) => {
          if (ev.id === eventId) finish(true)
        },
        oneose: () => finish(false)
      })

      setTimeout(() => finish(false), 10000)
    })
  }

  async run (flags) {
    let relay = null
    try {
      const relayUrl = flags.relay || config.defaultRelay
      const name = flags.name || 'nostr-relay'

      const results = {
        connection: 'FAIL',
        read: 'FAIL',
        write: 'FAIL',
        readback: 'FAIL'
      }

      console.log('Nostr relay health check')
      console.log(`  Relay: ${relayUrl}`)
      console.log(`  Identity: ${name}`)
      console.log('')

      // 1. Connection
      console.log('[1/4] Connecting...')
      relay = await Relay.connect(relayUrl)
      results.connection = 'OK'
      console.log(`  Connection: OK`)

      // 2. Read path (REQ → EOSE)
      console.log('[2/4] Read path (REQ → EOSE)...')
      const readOk = await this.checkRead(relay)
      results.read = readOk ? 'OK' : 'FAIL'
      console.log(`  Read: ${results.read}`)

      // 3. Write path (publish a test event)
      console.log('[3/4] Write path (publish test event)...')
      const sk = this.identityUtil.getSigningKey(name)
      const ts = new Date().toISOString()
      const eventTemplate = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: `relay-health check ${ts}`
      }
      const signedEvent = finalizeEvent(eventTemplate, sk)
      await relay.publish(signedEvent)
      results.write = 'OK'
      console.log(`  Write: OK (event ${signedEvent.id.slice(0, 8)}...)`)

      // 4. Readback (verify the event is stored and retrievable)
      console.log('[4/4] Readback (verify stored)...')
      const rbOk = await this.checkReadback(relay, signedEvent.id)
      results.readback = rbOk ? 'OK' : 'FAIL'
      console.log(`  Readback: ${results.readback}`)

      const allOk = Object.values(results).every((v) => v === 'OK')

      console.log('')
      console.log(`RESULT: ${allOk ? 'PASS' : 'FAIL'}`)
      console.log(
        `  connection: ${results.connection} | read: ${results.read} | write: ${results.write} | readback: ${results.readback}`
      )

      if (!allOk) process.exitCode = 1

      return allOk ? true : 0
    } catch (err) {
      process.exitCode = 1
      console.error('RESULT: FAIL')
      console.error('Error in relay-health: ', err)
      return 0
    } finally {
      if (relay) {
        try { relay.close() } catch (e) {}
      }
    }
  }
}

export default RelayHealth
