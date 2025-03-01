import { IronswornActor } from './module/actor/actor'
import { CreateActorDialog } from './module/applications/createActorDialog'
import { importFromDatasworn } from './module/datasworn'
import { AssetItem } from './module/item/asset/assetitem'
import { BaseItem } from './module/item/baseitem'
import { BondsetItem } from './module/item/bondset/bondsetitem'
import { DelveDomainItem } from './module/item/delve-theme-domain/delvedomainitem'
import { DelveThemeItem } from './module/item/delve-theme-domain/delvethemeitem'
import { MoveItem } from './module/item/move/moveitem'
import { ProgressItem } from './module/item/progress/progressitem'
import { VowItem } from './module/item/vow/vowitem'

export interface IronswornConfig {
  itemClasses: Array<typeof BaseItem>
  actorClass: typeof IronswornActor
  importFromDatasworn: typeof importFromDatasworn
  applications: {
    createActorDialog: CreateActorDialog | null
  }
}

export const IRONSWORN: IronswornConfig = {
  itemClasses: [AssetItem, BondsetItem, MoveItem, ProgressItem, VowItem, DelveDomainItem, DelveThemeItem],
  actorClass: IronswornActor,

  applications: {
    createActorDialog: null,
  },

  importFromDatasworn,
}
