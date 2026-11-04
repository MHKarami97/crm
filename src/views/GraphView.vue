<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
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
import { toPersianDigits, formatPhoneNumber } from '@/utils/format'
import {
  Network,
  UserPlus,
  Route,
  UserCheck,
  Share2,
  ExternalLink,
  PlusCircle,
  Phone,
  X,
} from 'lucide-vue-next'

const personStore = usePersonStore()
const relStore = useRelationshipStore()
const graphStore = useGraphStore()

const graphContainer = ref<HTMLElement | null>(null)
const isPathFinderOpen = ref(false)
const pathInitialTargetId = ref('')
const selectedPerson = ref<Person | null>(null)
const selectedPersonDegree = ref<number>(0)
const isFullDetailOpen = ref(false)
const isRelFormOpen = ref(false)
const relSourceId = ref<string | undefined>(undefined)

const totalPeopleCount = computed(() => personStore.people.length)
const totalRelCount = computed(() => relStore.relationships.length)

onMounted(async () => {
  if (personStore.people.length === 0) {
    await personStore.loadPeople()
  }
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
    (personId, degree) => {
      const p = personStore.people.find((x) => x.id === personId)
      if (p) {
        selectedPerson.value = p
        selectedPersonDegree.value = degree
      }
    },
    () => {
      // Background tapped
      selectedPerson.value = null
      selectedPersonDegree.value = 0
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

function handleFilterTag(tagName: string | null) {
  cytoscapeService.filterByTag(tagName)
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
  showToast('پیوند جدید به گراف اضافه شد.', 'success')
}

function deselectNode() {
  selectedPerson.value = null
  selectedPersonDegree.value = 0
  cytoscapeService.clearSelection()
}

function startPathFromSelected() {
  if (!selectedPerson.value) return
  pathInitialTargetId.value = selectedPerson.value.id
  isPathFinderOpen.value = true
}

function openFullDetail() {
  isFullDetailOpen.value = true
}
</script>

<template>
  <div class="relative flex-1 w-full h-[calc(100dvh-56px)] overflow-hidden graph-canvas-bg flex flex-col">
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
        action-label="ثبت مخاطب در بخش مخاطبان"
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
        :total-nodes="totalPeopleCount"
        :total-edges="totalRelCount"
        @zoom-in="handleZoomIn"
        @zoom-out="handleZoomOut"
        @fit="handleFit"
        @change-layout="handleChangeLayout"
        @open-path-finder="isPathFinderOpen = true"
        @search="handleSearch"
        @filter-tag="handleFilterTag"
      />
    </div>

    <!-- Floating Node Quick-Card (Inspector Sheet) -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-12 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-12 opacity-0"
    >
      <div
        v-if="selectedPerson"
        class="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl p-4 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 space-y-3"
      >
        <!-- Top Row: Avatar, Name & Close Button -->
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-600 to-teal-700 text-white font-bold text-base flex items-center justify-center shadow-md shadow-primary-600/30 shrink-0"
            >
              {{ selectedPerson.name.charAt(0) }}
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {{ selectedPerson.name }}
                </h3>
              </div>
              <p
                v-if="selectedPerson.customFields?.jobTitle || selectedPerson.phones?.[0]"
                class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5"
              >
                {{ selectedPerson.customFields?.jobTitle || selectedPerson.phones[0] }}
              </p>
            </div>
          </div>

          <button
            type="button"
            @click="deselectNode"
            class="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="بستن انتخاب"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Connection Degree & Tags Pill Bar -->
        <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
          <div class="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
            <Share2 class="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
            <span>{{ toPersianDigits(selectedPersonDegree) }} پیوند در شبکه</span>
          </div>

          <!-- Tags -->
          <div v-if="selectedPerson.tags && selectedPerson.tags.length > 0" class="flex gap-1">
            <span
              v-for="t in selectedPerson.tags.slice(0, 2)"
              :key="t"
              class="text-[10px] px-2 py-0.5 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-semibold"
            >
              {{ t }}
            </span>
          </div>
        </div>

        <!-- Quick Action Buttons -->
        <div class="grid grid-cols-3 gap-1.5 pt-1">
          <!-- Path to this person -->
          <button
            type="button"
            @click="startPathFromSelected"
            class="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition active:scale-95"
            title="مسیر معرفی به این فرد"
          >
            <Route class="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
            <span>مسیر به...</span>
          </button>

          <!-- Add relationship -->
          <button
            type="button"
            @click="handleOpenAddRelation(selectedPerson.id)"
            class="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition active:scale-95"
            title="ثبت ارتباط جدید با این فرد"
          >
            <PlusCircle class="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>پیوند جدید</span>
          </button>

          <!-- View full detail -->
          <button
            type="button"
            @click="openFullDetail"
            class="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition shadow-sm active:scale-95"
            title="مشاهده اطلاعات کامل مخاطب"
          >
            <ExternalLink class="w-3.5 h-3.5" />
            <span>پرونده کامل</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Path Finder Modal -->
    <PathFinderModal
      :is-open="isPathFinderOpen"
      :initial-target-id="pathInitialTargetId"
      @close="isPathFinderOpen = false; pathInitialTargetId = ''"
      @highlight-path="handleHighlightPath"
    />

    <!-- Person Full Details Sheet (triggered from Quick Card or edit) -->
    <PersonDetailSheet
      :is-open="isFullDetailOpen"
      :person="selectedPerson"
      @close="isFullDetailOpen = false"
      @edit="isFullDetailOpen = false; $router.push('/people')"
      @archive="isFullDetailOpen = false; deselectNode()"
      @delete="isFullDetailOpen = false; deselectNode()"
      @add-relation="handleOpenAddRelation"
      @select-person="(id) => {
        const p = personStore.people.find(x => x.id === id)
        if (p) {
          selectedPerson = p
          cytoscapeService.selectNode(id)
        }
      }"
      @find-path="(id) => {
        isFullDetailOpen = false
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

<style scoped>
.graph-canvas-bg {
  background-color: #f8fafc;
  background-image: radial-gradient(rgba(100, 116, 139, 0.22) 1.5px, transparent 1.5px);
  background-size: 24px 24px;
}

:root.dark .graph-canvas-bg,
.dark .graph-canvas-bg {
  background-color: #0b0f19;
  background-image: radial-gradient(rgba(148, 163, 184, 0.16) 1.5px, transparent 1.5px);
  background-size: 24px 24px;
}
</style>
