import type { TagRecord } from '~/types/smarttag'

export const useTagsStore = defineStore('tags', {
  state: () => ({
    items: [] as TagRecord[]
  }),
  actions: {
    setItems(items: TagRecord[]) {
      this.items = items
    }
  }
})
