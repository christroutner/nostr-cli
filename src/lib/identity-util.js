import fs from 'fs'
import path from 'path'
import { hexToBytes } from '@noble/hashes/utils'

const IDENTITIES_DIR = '.identities'

class IdentityUtil {
  constructor () {
    this.fs = fs
    this.path = path

    this.saveIdentity = this.saveIdentity.bind(this)
    this.loadIdentity = this.loadIdentity.bind(this)
    this.listIdentities = this.listIdentities.bind(this)
    this.getSigningKey = this.getSigningKey.bind(this)
    this.ensureDir = this.ensureDir.bind(this)
  }

  // Ensure the .identities directory exists.
  ensureDir () {
    if (!this.fs.existsSync(IDENTITIES_DIR)) {
      this.fs.mkdirSync(IDENTITIES_DIR, { recursive: true })
    }
  }

  // Save identity data to a JSON file.
  saveIdentity (identityData, name) {
    this.ensureDir()

    const filePath = this.path.join(IDENTITIES_DIR, `${name}.json`)
    const data = JSON.stringify({ identity: identityData }, null, 2)
    this.fs.writeFileSync(filePath, data)

    return filePath
  }

  // Load an identity from a JSON file by name.
  loadIdentity (name) {
    const filePath = this.path.join(IDENTITIES_DIR, `${name}.json`)

    if (!this.fs.existsSync(filePath)) {
      throw new Error(`Identity "${name}" not found. Run identity-create first.`)
    }

    const raw = this.fs.readFileSync(filePath, 'utf8')
    const data = JSON.parse(raw)

    return data.identity
  }

  // List all saved identities.
  listIdentities () {
    this.ensureDir()

    const files = this.fs.readdirSync(IDENTITIES_DIR)
    const identities = []

    for (const file of files) {
      if (!file.endsWith('.json')) continue

      const filePath = this.path.join(IDENTITIES_DIR, file)
      const raw = this.fs.readFileSync(filePath, 'utf8')
      const data = JSON.parse(raw)
      identities.push(data.identity)
    }

    return identities
  }

  // Load identity and return the private key as a Uint8Array for signing.
  getSigningKey (name) {
    const identity = this.loadIdentity(name)
    return hexToBytes(identity.privateKey)
  }
}

export default IdentityUtil
