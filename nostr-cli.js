#!/usr/bin/env node

import { Command } from 'commander'

// Identity commands
import IdentityCreate from './src/commands/identity-create.js'
import IdentityList from './src/commands/identity-list.js'
import IdentityImport from './src/commands/identity-import.js'

// Post commands
import PostWrite from './src/commands/post-write.js'
import PostRead from './src/commands/post-read.js'
import PostReadId from './src/commands/post-read-id.js'
import PostTopic from './src/commands/post-topic.js'
import PostReadTopic from './src/commands/post-read-topic.js'

// Message commands
import MsgSend from './src/commands/msg-send.js'
import MsgRead from './src/commands/msg-read.js'

// Social commands
import FollowList from './src/commands/follow-list.js'
import FollowUpdate from './src/commands/follow-update.js'

// Reaction commands
import LikeEvent from './src/commands/like-event.js'
import LikeUrl from './src/commands/like-url.js'
import LikesGet from './src/commands/likes-get.js'

// Chat commands
import ChatCreate from './src/commands/chat-create.js'
import ChatUpdate from './src/commands/chat-update.js'
import ChatSend from './src/commands/chat-send.js'

// Utility commands
import Convert from './src/commands/convert.js'

const program = new Command()

program
  .name('nostr-cli')
  .description('CLI for interacting with Nostr relays')
  .version('1.0.0')

// --- Identity Commands ---

const identityCreate = new IdentityCreate()
program
  .command('identity-create')
  .description('Create a new Nostr identity (keypair)')
  .option('-n, --name <string>', 'Identity name')
  .option('-d, --description <string>', 'Description for the identity')
  .action(identityCreate.run)

const identityList = new IdentityList()
program
  .command('identity-list')
  .description('List all saved identities')
  .action(identityList.run)

const identityImport = new IdentityImport()
program
  .command('identity-import')
  .description('Import an identity from an nsec or hex private key')
  .option('-n, --name <string>', 'Identity name')
  .option('-k, --key <string>', 'Private key (nsec or hex)')
  .option('-d, --description <string>', 'Description for the identity')
  .action(identityImport.run)

// --- Post Commands ---

const postWrite = new PostWrite()
program
  .command('post-write')
  .description('Publish a text note (Kind 1)')
  .option('-n, --name <string>', 'Identity name')
  .option('-m, --message <string>', 'Message content')
  .option('-r, --relay <string>', 'Relay URL (optional)')
  .action(postWrite.run)

const postRead = new PostRead()
program
  .command('post-read')
  .description('Read posts from a user by pubkey or npub')
  .option('-p, --pubkey <string>', 'Public key (hex or npub)')
  .option('-l, --limit <number>', 'Max number of posts to retrieve', '10')
  .option('-r, --relay <string>', 'Relay URL (optional)')
  .action(postRead.run)

const postReadId = new PostReadId()
program
  .command('post-read-id')
  .description('Read a single event by its ID')
  .option('-e, --eventid <string>', 'Event ID (hex or note1...)')
  .option('-r, --relay <string>', 'Relay URL (optional)')
  .action(postReadId.run)

const postTopic = new PostTopic()
program
  .command('post-topic')
  .description('Post to a topic-based feed (Kind 867)')
  .option('-n, --name <string>', 'Identity name')
  .option('-m, --message <string>', 'Message content')
  .option('-t, --topic <string>', 'Topic name')
  .option('-r, --relay <string>', 'Relay URL (optional)')
  .action(postTopic.run)

const postReadTopic = new PostReadTopic()
program
  .command('post-read-topic')
  .description('Read posts by topic')
  .option('-t, --topic <string>', 'Topic name')
  .option('-l, --limit <number>', 'Max number of posts to retrieve', '10')
  .option('-r, --relay <string>', 'Relay URL (optional)')
  .action(postReadTopic.run)

// --- Message Commands ---

const msgSend = new MsgSend()
program
  .command('msg-send')
  .description('Send an encrypted direct message (NIP-04, Kind 4)')
  .option('-n, --name <string>', 'Identity name (sender)')
  .option('-p, --pubkey <string>', 'Recipient public key (hex or npub)')
  .option('-m, --message <string>', 'Message content')
  .option('-r, --relay <string>', 'Relay URL (optional)')
  .action(msgSend.run)

const msgRead = new MsgRead()
program
  .command('msg-read')
  .description('Read and decrypt direct messages')
  .option('-n, --name <string>', 'Identity name (recipient)')
  .option('-p, --pubkey <string>', 'Filter by sender pubkey (hex or npub)')
  .option('-l, --limit <number>', 'Max number of messages to retrieve', '10')
  .option('-r, --relay <string>', 'Relay URL (optional)')
  .action(msgRead.run)

// --- Social Commands ---

const followList = new FollowList()
program
  .command('follow-list')
  .description('Get follow list for a user (Kind 3)')
  .option('-p, --pubkey <string>', 'Public key (hex or npub)')
  .option('-r, --relay <string>', 'Relay URL (optional)')
  .action(followList.run)

const followUpdate = new FollowUpdate()
program
  .command('follow-update')
  .description('Update your follow list (Kind 3)')
  .option('-n, --name <string>', 'Identity name')
  .option('-p, --pubkeys <string>', 'Comma-separated pubkeys to follow')
  .option('-r, --relay <string>', 'Relay URL (optional)')
  .action(followUpdate.run)

// --- Reaction Commands ---

const likeEvent = new LikeEvent()
program
  .command('like-event')
  .description('React to an event with a like (Kind 7)')
  .option('-n, --name <string>', 'Identity name')
  .option('-e, --eventid <string>', 'Event ID to like (hex or note1...)')
  .option('-a, --author <string>', 'Author pubkey of the event (optional)')
  .option('-r, --relay <string>', 'Relay URL (optional)')
  .action(likeEvent.run)

const likeUrl = new LikeUrl()
program
  .command('like-url')
  .description('React to a URL with a like (Kind 17)')
  .option('-n, --name <string>', 'Identity name')
  .option('-u, --url <string>', 'URL to like')
  .option('-r, --relay <string>', 'Relay URL (optional)')
  .action(likeUrl.run)

const likesGet = new LikesGet()
program
  .command('likes-get')
  .description('Get reaction count for an event or URL')
  .option('-e, --eventid <string>', 'Event ID (hex or note1...)')
  .option('-u, --url <string>', 'URL')
  .option('-r, --relay <string>', 'Relay URL (optional)')
  .action(likesGet.run)

// --- Chat Commands ---

const chatCreate = new ChatCreate()
program
  .command('chat-create')
  .description('Create a NIP-28 chat room (Kind 40)')
  .option('-n, --name <string>', 'Identity name')
  .option('--room-name <string>', 'Chat room name')
  .option('--about <string>', 'Room description')
  .option('--picture <string>', 'Room picture URL')
  .option('-r, --relay <string>', 'Relay URL (optional)')
  .action(chatCreate.run)

const chatUpdate = new ChatUpdate()
program
  .command('chat-update')
  .description('Update chat room metadata (Kind 41)')
  .option('-n, --name <string>', 'Identity name')
  .option('-e, --eventid <string>', 'Channel creation event ID')
  .option('--room-name <string>', 'New room name')
  .option('--about <string>', 'New room description')
  .option('--picture <string>', 'New room picture URL')
  .option('-r, --relay <string>', 'Relay URL (optional)')
  .action(chatUpdate.run)

const chatSend = new ChatSend()
program
  .command('chat-send')
  .description('Send a message to a chat room (Kind 42)')
  .option('-n, --name <string>', 'Identity name')
  .option('-e, --eventid <string>', 'Channel creation event ID')
  .option('-m, --message <string>', 'Message content')
  .option('-r, --relay <string>', 'Relay URL (optional)')
  .action(chatSend.run)

// --- Utility Commands ---

const convert = new Convert()
program
  .command('convert')
  .description('Convert between npub/nsec/note/hex formats')
  .option('-i, --input <string>', 'Value to convert')
  .option('-f, --from <string>', 'Format hint for hex input (pubkey, privkey, eventid)')
  .action(convert.run)

program.parseAsync(process.argv)
