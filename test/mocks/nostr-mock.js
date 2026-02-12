// Mock data for Nostr tests.

const mockIdentity = {
  name: 'test-user',
  privateKey: 'a'.repeat(64),
  publicKey: 'b'.repeat(64),
  nsec: 'nsec1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsry70hh',
  npub: 'npub1kcngsm2ggvjp50yh3gqvvvz0tprlxvmp80l2667kkknnq0q7a4qsyhf2rc',
  description: 'Test identity',
  createdAt: '2026-01-01T00:00:00.000Z'
}

const mockEvent = {
  id: 'c'.repeat(64),
  pubkey: 'b'.repeat(64),
  created_at: Math.floor(Date.now() / 1000),
  kind: 1,
  tags: [],
  content: 'Hello Nostr!',
  sig: 'd'.repeat(128)
}

const mockEncryptedEvent = {
  id: 'e'.repeat(64),
  pubkey: 'b'.repeat(64),
  created_at: Math.floor(Date.now() / 1000),
  kind: 4,
  tags: [['p', 'f'.repeat(64)]],
  content: 'encrypted-content',
  sig: 'd'.repeat(128)
}

const mockContactEvent = {
  id: 'g'.repeat(64),
  pubkey: 'b'.repeat(64),
  created_at: Math.floor(Date.now() / 1000),
  kind: 3,
  tags: [
    ['p', 'aaa111'.padEnd(64, '0'), 'wss://relay.example.com', 'alice'],
    ['p', 'bbb222'.padEnd(64, '0'), 'wss://relay.example.com', 'bob']
  ],
  content: '',
  sig: 'd'.repeat(128)
}

const mockReactionEvent = {
  id: 'h'.repeat(64),
  pubkey: 'b'.repeat(64),
  created_at: Math.floor(Date.now() / 1000),
  kind: 7,
  tags: [['e', 'c'.repeat(64)]],
  content: '+',
  sig: 'd'.repeat(128)
}

class MockRelay {
  constructor () {
    this.published = []
    this.closed = false
  }

  async publish (event) {
    this.published.push(event)
  }

  close () {
    this.closed = true
  }
}

export {
  mockIdentity,
  mockEvent,
  mockEncryptedEvent,
  mockContactEvent,
  mockReactionEvent,
  MockRelay
}
