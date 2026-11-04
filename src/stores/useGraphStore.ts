import { defineStore } from 'pinia'
import { ref } from 'vue'
import { pathFindingService, type PathFindingResult } from '@/services/graph/PathFindingService'
import { usePersonStore } from './usePersonStore'
import { useRelationshipStore } from './useRelationshipStore'

export const useGraphStore = defineStore('graph', () => {
  const selectedNodeId = ref<string | null>(null)
  const activeLayout = ref<'cose' | 'concentric' | 'circle' | 'breadthfirst'>('cose')
  const pathFindingActive = ref<boolean>(false)
  const pathStartId = ref<string | null>(null)
  const pathTargetId = ref<string | null>(null)
  const pathResult = ref<PathFindingResult | null>(null)

  function selectNode(id: string | null) {
    selectedNodeId.value = id
  }

  function setLayout(layout: 'cose' | 'concentric' | 'circle' | 'breadthfirst') {
    activeLayout.value = layout
  }

  function computeShortestPath() {
    if (!pathStartId.value || !pathTargetId.value) {
      pathResult.value = null
      return
    }

    const personStore = usePersonStore()
    const relStore = useRelationshipStore()

    const peopleMap = new Map<string, { id: string; name: string }>()
    for (const p of personStore.people) {
      peopleMap.set(p.id, { id: p.id, name: p.name })
    }

    pathResult.value = pathFindingService.findShortestPath(
      pathStartId.value,
      pathTargetId.value,
      peopleMap,
      relStore.relationships
    )
  }

  function clearPath() {
    pathStartId.value = null
    pathTargetId.value = null
    pathResult.value = null
    pathFindingActive.value = false
  }

  return {
    selectedNodeId,
    activeLayout,
    pathFindingActive,
    pathStartId,
    pathTargetId,
    pathResult,
    selectNode,
    setLayout,
    computeShortestPath,
    clearPath,
  }
})
