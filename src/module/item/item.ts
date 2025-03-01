import { createIronswornChatRoll } from '../chat/chatrollhelpers'
import { RANK_INCREMENTS } from '../constants'
import { EnhancedDataswornMove, moveDataByName } from '../helpers/data'

/**
 * Extend the base Iteem entity
 * @extends {Item}
 */
export class IronswornItem extends Item {
  /**
   * Progress methods
   */
  markProgress() {
    if (this.data.type !== 'vow' && this.data.type !== 'progress') return

    const increment = RANK_INCREMENTS[this.data.data.rank]
    const newValue = Math.min(this.data.data.current + increment, 40)
    return this.update({ 'data.current': newValue })
  }

  clearProgress() {
    if (this.data.type !== 'vow' && this.data.type !== 'progress') return
    return this.update({ 'data.current': 0 })
  }

  fulfill() {
    if (this.data.type === 'vow') return this.fulfillVow()
    if (this.data.type !== 'progress') return
    const progress = Math.floor(this.data.data.current / 4)
    const r = new Roll(`{${progress},d10,d10}`)
    return createIronswornChatRoll({
      isProgress: true,
      actor: this.actor || undefined,
      subtitle: this.name || undefined,
      roll: r,
    })
  }

  async fulfillVow() {
    if (this.data.type !== 'vow') return

    const move = await moveDataByName('Fulfill Your Vow')
    if (!move) throw new Error('Problem loading fulvill-vow move')
    move.Name += `: ${this.data.name}`

    const progress = Math.floor(this.data.data.current / 4)
    const r = new Roll(`{${progress},d10,d10}`)
    createIronswornChatRoll({
      isProgress: true,
      move,
      roll: r,
      actor: this.actor || undefined,
      subtitle: this.name || undefined,
    })
  }

  /**
   * Move methods
   */
  getMoveData(): EnhancedDataswornMove {
    if (this.data.type !== 'move') throw new Error(`tried to get move data from a ${this.type}`)
    return {
      Name: this.name || '',
      Source: {
        Name: 'Custom',
        Page: '',
      },
      Stats: this.data.data.stats,
      Text: '',
      Description: this.data.data.description,
      Strong: this.data.data.strong,
      Weak: this.data.data.weak,
      Miss: this.data.data.miss,
    }
  }

  /**
   * Asset methods
   */
  createField() {
    if (this.data.type !== 'asset') return
    const fields = this.data.data.fields
    fields.push({ name: '', value: '' })
    return this.update({ 'data.fields': fields })
  }
  deleteField(name) {
    if (this.data.type !== 'asset') return
    const fields = this.data.data.fields
    return this.update({ 'data.fields': fields.filter((x) => x.name !== name) })
  }
  createAbility() {
    if (this.data.type !== 'asset') return
    const abilities = this.data.data.abilities
    abilities.push({
      enabled: false,
      description: '',
    })
    return this.update({ 'data.abilities': abilities })
  }
  deleteAbility(name) {
    if (this.data.type !== 'asset') return
    const abilities = this.data.data.abilities
    return this.update({
      'data.abilities': abilities.filter((x) => x.name !== name),
    })
  }

  // Bondset methods
  get count() {
    if (this.data.type !== 'bondset') return
    return Object.values(this.data.data.bonds).length
  }
}

declare global {
  interface DocumentClassConfig {
    Item: typeof IronswornItem
  }
}
