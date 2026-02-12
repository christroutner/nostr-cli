import Table from 'cli-table'
import IdentityUtil from '../lib/identity-util.js'

class IdentityList {
  constructor () {
    this.identityUtil = new IdentityUtil()

    this.run = this.run.bind(this)
  }

  async run () {
    try {
      const identities = this.identityUtil.listIdentities()

      if (identities.length === 0) {
        console.log('No identities found. Run identity-create to create one.')
        return true
      }

      const table = new Table({
        head: ['Name', 'npub', 'Description'],
        colWidths: [15, 68, 30]
      })

      for (const id of identities) {
        table.push([id.name, id.npub, id.description || ''])
      }

      console.log(table.toString())

      return true
    } catch (err) {
      console.error('Error in identity-list: ', err)
      return 0
    }
  }
}

export default IdentityList
