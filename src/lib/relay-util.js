import WebSocket from 'ws'
import { useWebSocketImplementation, Relay } from 'nostr-tools/relay'
import { RelayPool } from 'nostr'
import config from '../../config/index.js'

// Set up WebSocket for Node.js environment.
useWebSocketImplementation(WebSocket)

class RelayUtil {
  constructor () {
    this.connectRelay = this.connectRelay.bind(this)
    this.createPool = this.createPool.bind(this)
    this.publishEvent = this.publishEvent.bind(this)
    this.subscribe = this.subscribe.bind(this)
  }

  // Connect to a single relay.
  async connectRelay (url) {
    const relay = await Relay.connect(url)
    return relay
  }

  // Create a multi-relay pool.
  createPool (relayUrls) {
    const urls = relayUrls || config.relays
    return RelayPool(urls)
  }

  // Publish a signed event to a relay and close the connection.
  async publishEvent (relayUrl, signedEvent) {
    const relay = await this.connectRelay(relayUrl)
    await relay.publish(signedEvent)
    relay.close()
    return signedEvent.id
  }

  // Subscribe to events via a relay pool. Returns a promise that resolves
  // with collected events on EOSE (End of Stored Events).
  subscribe (relayUrls, filters, opts = {}) {
    const timeout = opts.timeout || config.subscriptionTimeout

    return new Promise((resolve, reject) => {
      const events = []
      const pool = this.createPool(relayUrls)
      let settled = false

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true
          try { pool.close() } catch (e) {}
          resolve(events)
        }
      }, timeout)

      pool.on('open', (relay) => {
        relay.subscribe('sub', filters)
      })

      pool.on('event', (relay, subId, ev) => {
        events.push(ev)
      })

      pool.on('eose', (relay) => {
        if (!settled) {
          settled = true
          clearTimeout(timer)
          try { pool.close() } catch (e) {}
          resolve(events)
        }
      })

      pool.on('error', (relay, err) => {
        if (!settled) {
          settled = true
          clearTimeout(timer)
          try { pool.close() } catch (e) {}
          reject(err)
        }
      })
    })
  }
}

export default RelayUtil
