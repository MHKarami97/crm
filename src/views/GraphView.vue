<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { usePersonStore } from '@/stores/usePersonStore'
import { useRelationshipStore } from '@/stores/useRelationshipStore'
import { useGraphStore } from '@/stores/useGraphStore'
import { cytoscapeService } from '@/services/graph/CytoscapeService'
import type { Person } from '@/domain/models'
import GraphToolbar from '@/components/graph/GraphToolbar.vue'
import PathFinderModal from '@/components/graph/PathFinderModal.vue'
import PersonDetailSheet from '@/components/people/PersonDetailSheet.vue'
import RelationshipFormModal from '@/components/people/RelationshipFormModal.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { showToast } from '@/components/common/ToastContainer.vue'
import { Network, UserPlus } from 'lucide-vue-next'

const personStore = usePersonStore()
const relStore = useRelationshipStore()
const graphStore = useGraphStore()

const graphContainer = ref<HTMLElement | null>(null)
const isPathFinderOpen = ref(false)
const pathInitialTargetId = ref('')
const selectedPerson = ref<Person | null>(null)
const isDetailOpen = ref(false)
const isRelFormOpen = ref(false)
const relSourceId = ref<string | undefined>(undefined)

onMounted(async () => {
  await initGraph()
})

onUnmounted(() => {
  cytoscapeService.destroy()
})

watch(
  () => [personStore.people.length, relStore.relationships.length],
  async () => {
    await initGraph()
  }
)

async function initGraph() {
  if (!graphContainer.value) return
  if (personStore.people.length === 0) return

  await cytoscapeService.init(
    graphContainer.value,
    personStore.people,
    relStore.relationships,
    personStore.tags,
    (personId) => {
      const p = personStore.people.find((x) => x.id === personId)
      if (p) {
        selectedPerson.value = p
        isDetailOpen.value = true
      }
    },
    () => {
      // background tap
      selectedPerson.value = null
      isDetailOpen.value = false
    }
  )
}

function handleZoomIn() {
  cytoscapeService.zoomIn()
}

function handleZoomOut() {
  cytoscapeService.zoomOut()
}

function handleFit() {
  cytoscapeService.fit()
}

function handleChangeLayout(layout: 'cose' | 'concentric' | 'circle') {
  graphStore.setLayout(layout)
  cytoscapeService.runLayout(layout)
}

function handleSearch(query: string) {
  cytoscapeService.highlightSearch(query)
}

function handleHighlightPath(nodeIds: string[]) {
  cytoscapeService.highlightPath(nodeIds)
  isPathFinderOpen.value = false
  showToast('کوتاه‌ترین مسیر در گراف هایلایت شد.', 'success')
}

function handleOpenAddRelation(sourceId: string) {
  relSourceId.value = sourceId
  isRelFormOpen.value = true
}

async function handleSaveRelation(relData: any) {
  await relStore.addRelationship(relData)
  isRelFormOpen.value = false
  showToast('پیوند جدید افزوده شد.', 'success')
}
</script>

<template>
  <div class="relative flex-1 w-full h-[calc(100dvh-56px)] overflow-hidden bg-slate-50 dark:bg-slate-950 flex flex-col">
    <!-- Cytoscape Canvas Container -->
    <div
      v-if="personStore.people.length > 0"
      ref="graphContainer"
      class="w-full flex-1 touch-none cursor-grab active:cursor-grabbing"
    ></div>

    <!-- Empty State if no people exist -->
    <div v-else class="flex-1 flex items-center justify-center p-4">
      <EmptyState
        :icon="Network"
        title="داده‌ای برای نمایش گراف وجود ندارد"
        description="حداقل ۲ مخاطب و یک ارتباط بین آن‌ها ثبت کنید تا شبکه تعاملی روابط تشکیل شود."
        action-label="ثبت مخاطب در بخش افراد"
        @action="$router.push('/people')"
      >
        <template #action-icon>
          <UserPlus class="w-4 h-4" />
        </template>
      </EmptyState>
    </div>

    <!-- Floating Graph Toolbar (Top on mobile/desktop) -->
    <div
      v-if="personStore.people.length > 0"
      class="absolute top-4 left-4 right-4 sm:left-auto sm:right-6 z-30"
    >
      <GraphToolbar
        :active-layout="graphStore.activeLayout"
        @zoom-in="handleZoomIn"
        @zoom-out="handleZoomOut"
        @fit="handleFit"
        @change-layout="handleChangeLayout"
        @open-path-finder="isPathFinderOpen = true"
        @search="handleSearch"
      />
    </div>

    <!-- Path Finder Modal -->
    <PathFinderModal
      :is-open="isPathFinderOpen"
      :initial-target-id="pathInitialTargetId"
      @close="isPathFinderOpen = false; pathInitialTargetId = ''"
      @highlight-path="handleHighlightPath"
    />

    <!-- Person Details Sheet from graph click -->
    <PersonDetailSheet
      :is-open="isDetailOpen"
      :person="selectedPerson"
      @close="isDetailOpen = false"
      @edit="isDetailOpen = false; $router.push('/people')"
      @archive="isDetailOpen = false"
      @delete="isDetailOpen = false"
      @add-relation="handleOpenAddRelation"
      @select-person="(id) => {
        const p = personStore.people.find(x => x.id === id)
        if (p) selectedPerson = p
      }"
      @find-path="(id) => {
        isDetailOpen = false
        pathInitialTargetId = id
        isPathFinderOpen = true
      }"
      @delete-relation="async (relId) => {
        await relStore.deleteRelationship(relId)
        showToast('پیوند با موفقیت حذف شد.', 'info')
      }"
    />

    <RelationshipFormModal
      :is-open="isRelFormOpen"
      :initial-source-id="relSourceId"
      @close="isRelFormOpen = false"
      @save="handleSaveRelation"
    />
  </div>
</template>
