import { createIronswornChatRoll, createIronswornDenizenChat } from '../../chat/chatrollhelpers'
import { RANK_INCREMENTS } from '../../constants'
import { moveDataByName } from '../../helpers/data'
import { RollDialog, rollSiteFeature } from '../../helpers/roll'
import { IronswornSettings } from '../../helpers/settings'
import { IronswornItem } from '../../item/item'
import { IronswornActor } from '../actor'
import { DenizenSlot, SiteDataSource } from '../actortypes'

interface Denizen {
  denizen: DenizenSlot
  idx: number
}

interface Data extends ActorSheet.Data<ActorSheet.Options> {
  theme?: IronswornItem
  domain?: IronswornItem
  denizenMatrix: Denizen[][]
}

export class IronswornSiteSheet extends ActorSheet<ActorSheet.Options, Data> {
  get siteData() {
    return this.actor.data as SiteDataSource
  }
  get theme() {
    return this.actor.items.find((x) => x.type === 'delve-theme')
  }
  get domain() {
    return this.actor.items.find((x) => x.type === 'delve-domain')
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['ironsworn', 'sheet', 'site', `theme-${IronswornSettings.theme}`],
      width: 700,
      height: 520,
      template: 'systems/foundry-ironsworn/templates/actor/site.hbs',
      resizable: false,
    })
  }

  _getHeaderButtons() {
    return [
      {
        class: 'ironsworn-toggle-edit-mode',
        label: 'Edit',
        icon: 'fas fa-edit',
        onclick: (e) => this._toggleEditMode(e),
      },
      ...super._getHeaderButtons(),
    ]
  }

  _toggleEditMode(e: JQuery.ClickEvent) {
    e.preventDefault()

    const currentValue = this.actor.getFlag('foundry-ironsworn', 'edit-mode')
    this.actor.setFlag('foundry-ironsworn', 'edit-mode', !currentValue)
  }

  async getData() {
    const data = await super.getData()

    data.theme = this.theme
    data.domain = this.domain

    // Layout indexes for denizens
    const denizenAt = (idx) => ({ denizen: this.siteData.data.denizens[idx], idx })
    data.denizenMatrix = [
      [denizenAt(0), denizenAt(1), denizenAt(2), denizenAt(3)],
      [denizenAt(4), denizenAt(5), denizenAt(6), denizenAt(7)],
      [denizenAt(8), denizenAt(9), denizenAt(10), denizenAt(11)],
    ]

    return data
  }

  activateListeners(html: JQuery) {
    super.activateListeners(html)
    for (const itemClass of CONFIG.IRONSWORN.itemClasses) {
      itemClass.activateActorSheetListeners(html, this)
    }

    html.find('.ironsworn__progress__rank').on('click', (ev) => this._setRank.call(this, ev))
    html.find('.ironsworn__progress__mark').on('click', (ev) => this._markProgress.call(this, ev))
    html.find('.ironsworn__progress__clear').on('click', (ev) => this._clearProgress.call(this, ev))

    html.find('.ironsworn__compendium__open').on('click', (ev) => this._openCompendium.call(this, ev))

    html.find('.ironsworn__feature__roll').on('click', (ev) => this._randomFeature.call(this, ev))
    html.find('.ironsworn__move__roll').on('click', (ev) => this._moveRoll.call(this, ev))
    html.find('.ironsworn__locateobjective__roll').on('click', (ev) => this._locateObjective.call(this, ev))

    html.find('.ironsworn__random__denizen').on('click', (ev) => this._randomDenizen.call(this, ev))
    html.find('.ironsworn__denizen__name').on('blur', (ev) => this._setDenizenName.call(this, ev))
  }

  _setRank(ev: JQuery.ClickEvent) {
    ev.preventDefault()
    this.actor.update({ 'data.rank': ev.currentTarget.dataset.rank })
  }

  _markProgress(ev: JQuery.ClickEvent) {
    ev.preventDefault()

    const increment = RANK_INCREMENTS[this.siteData.data.rank]
    const newValue = Math.min(this.siteData.data.current + increment, 40)
    this.actor.update({ 'data.current': newValue })
  }

  _clearProgress(ev: JQuery.ClickEvent) {
    ev.preventDefault()
    this.actor.update({ 'data.current': 0 })
  }

  _openCompendium(ev: JQuery.ClickEvent) {
    const { compendium } = ev.currentTarget.dataset
    const pack = game.packs?.get(`foundry-ironsworn.${compendium}`)
    pack?.render(true)
  }

  async _moveRoll(ev: JQuery.ClickEvent) {
    const { move: movename } = ev.currentTarget.dataset
    const move = await moveDataByName(movename)
    const actor = this.findActor()
    RollDialog.show({ move, actor, site: this.actor })
  }

  async _locateObjective(_ev: JQuery.ClickEvent) {
    const move = await moveDataByName('Locate Your Objective')
    const actor = this.findActor()
    const progress = Math.floor(this.siteData.data.current / 4)
    const roll = new Roll(`{${progress}, d10, d10}`)
    createIronswornChatRoll({
      isProgress: true,
      move,
      roll,
      actor,
      subtitle: this.actor.name || undefined,
    })
  }

  _randomFeature(_ev: JQuery.ClickEvent) {
    rollSiteFeature({
      domain: this.domain,
      theme: this.theme,
    })
  }

  async _randomDenizen(_ev: JQuery.ClickEvent) {
    const roll = await new Roll('1d100').evaluate({ async: true })
    const result = roll.total as number
    const denizen = this.siteData.data.denizens.find((x) => x.low <= result && x.high >= result)
    if (!denizen) throw new Error(`Rolled a ${result} but got no denizen???`)
    await createIronswornDenizenChat({ roll, denizen, site: this.actor })

    // Denizen slot is empty; set focus and add a class
    if (!denizen?.description) {
      const idx = this.siteData.data.denizens.indexOf(denizen)
      const input = this.element.find(`.ironsworn__denizen__name[data-idx=${idx}]`)
      input.addClass('highlight').trigger('focus')
    }
  }

  _setDenizenName(ev: JQuery.BlurEvent) {
    $(ev.currentTarget).removeClass('highlight')
    const val = $(ev.currentTarget).val()?.toString() || ''
    const idx = parseInt(ev.target.dataset.idx)
    const { denizens } = this.siteData.data
    denizens[idx].description = val
    this.actor.update({ data: { denizens } }, { render: false })
  }

  findActor(): IronswornActor {
    if (game.user?.character) return game.user.character

    // TODO: if more than one character, prompt the user
    const actor = game.actors?.find((x) => x.type === 'character')
    if (!actor) {
      ui.notifications?.error("Couldn't find a character for you")
      throw new Error("Couldn't find an actor")
    }
    return actor
  }
}
