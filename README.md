# nostr-cli

A command-line interface for interacting with Nostr relays. Manage identities, publish and read posts, send encrypted direct messages, manage follow lists, react to events and URLs, and participate in NIP-28 chat rooms.

## Installation

```bash
git clone <repo-url>
cd nostr-cli
npm install
```

## Quick Start

```bash
# Create an identity
node nostr-cli.js identity-create -n alice -d "Alice's identity"

# Publish a post
node nostr-cli.js post-write -n alice -m "Hello Nostr!"

# Read posts from a user
node nostr-cli.js post-read -p <pubkey-or-npub>
```

## Commands

### Identity Management

#### `identity-create`
Create a new Nostr identity (keypair).

```bash
node nostr-cli.js identity-create -n <name> [-d <description>]
```

#### `identity-list`
List all saved identities.

```bash
node nostr-cli.js identity-list
```

#### `identity-import`
Import an identity from an existing nsec or hex private key.

```bash
node nostr-cli.js identity-import -n <name> -k <nsec-or-hex> [-d <description>]
```

### Posts

#### `post-write`
Publish a text note (Kind 1).

```bash
node nostr-cli.js post-write -n <identity> -m "Your message" [-r <relay-url>]
```

#### `post-read`
Read posts from a user by pubkey or npub.

```bash
node nostr-cli.js post-read -p <pubkey-or-npub> [-l <limit>] [-r <relay-url>]
```

#### `post-read-id`
Read a single event by its ID (hex or note1...).

```bash
node nostr-cli.js post-read-id -e <event-id> [-r <relay-url>]
```

### Topic Posts

#### `post-topic`
Post to a topic-based feed (Kind 867).

```bash
node nostr-cli.js post-topic -n <identity> -m "Message" -t <topic> [-r <relay-url>]
```

#### `post-read-topic`
Read posts filtered by topic.

```bash
node nostr-cli.js post-read-topic -t <topic> [-l <limit>] [-r <relay-url>]
```

### Direct Messages (NIP-04)

#### `msg-send`
Send an encrypted direct message (Kind 4).

```bash
node nostr-cli.js msg-send -n <identity> -p <recipient-pubkey> -m "Secret message" [-r <relay-url>]
```

#### `msg-read`
Read and decrypt direct messages.

```bash
node nostr-cli.js msg-read -n <identity> [-p <sender-pubkey>] [-l <limit>] [-r <relay-url>]
```

### Social

#### `follow-list`
Get a user's follow list (Kind 3).

```bash
node nostr-cli.js follow-list -p <pubkey-or-npub> [-r <relay-url>]
```

#### `follow-update`
Update your follow list (Kind 3).

```bash
node nostr-cli.js follow-update -n <identity> -p <pubkey1,pubkey2,...> [-r <relay-url>]
```

### Reactions

#### `like-event`
React to an event with a like (Kind 7).

```bash
node nostr-cli.js like-event -n <identity> -e <event-id> [-a <author-pubkey>] [-r <relay-url>]
```

#### `like-url`
React to a URL with a like (Kind 17).

```bash
node nostr-cli.js like-url -n <identity> -u <url> [-r <relay-url>]
```

#### `likes-get`
Get reaction count for an event or URL.

```bash
node nostr-cli.js likes-get -e <event-id> [-r <relay-url>]
node nostr-cli.js likes-get -u <url> [-r <relay-url>]
```

### Chat Rooms (NIP-28)

#### `chat-create`
Create a NIP-28 chat room (Kind 40).

```bash
node nostr-cli.js chat-create -n <identity> --room-name "Room Name" [--about "Description"] [-r <relay-url>]
```

#### `chat-update`
Update chat room metadata (Kind 41).

```bash
node nostr-cli.js chat-update -n <identity> -e <channel-event-id> [--room-name "New Name"] [--about "New Desc"] [-r <relay-url>]
```

#### `chat-send`
Send a message to a chat room (Kind 42).

```bash
node nostr-cli.js chat-send -n <identity> -e <channel-event-id> -m "Hello room!" [-r <relay-url>]
```

### Utilities

#### `convert`
Convert between npub/nsec/note/hex formats.

```bash
node nostr-cli.js convert -i <npub|nsec|note|hex> [-f <pubkey|privkey|eventid>]
```

## Configuration

Default relay configuration is in `config/index.js`:

```javascript
{
  relays: [
    'wss://relay.damus.io',
    'wss://nostr-relay.psfoundation.info'
  ],
  defaultRelay: 'wss://nostr-relay.psfoundation.info',
  subscriptionTimeout: 5000
}
```

Override the relay for any command with the `-r` flag.

## Identity Storage

Identities are stored as JSON files in the `.identities/` directory (gitignored). Each file contains the keypair and metadata for one identity.

## Testing

```bash
npm test
```

## License

MIT
