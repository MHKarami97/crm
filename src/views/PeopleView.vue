<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePersonStore } from '@/stores/usePersonStore'
import { useRelationshipStore } from '@/stores/useRelationshipStore'
import { cytoscapeService } from '@/services/graph/CytoscapeService'
import type { Person } from '@/domain/models'
import PersonCard from '@/components/people/PersonCard.vue'
import PersonFormModal from '@/components/people/PersonFormModal.vue'
import PersonDetailSheet from '@/components/people/PersonDetailSheet.vue'
import RelationshipFormModal from '@/components/people/RelationshipFormModal.vue'
import PathFinderModal from '@/components/graph/PathFinderModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import { showToast } from '@/components/common/ToastContainer.vue'
import {
  Search,
  Plus,
  UserPlus,
  Users,
  X,
} from 'lucide-vue-next'
import { toPersianDigits } from '@/utils/format'

const router = useRouter()
const personStore = usePersonStore()
const relStore = useRelationshipStore()

// Modals
const isFormOpen = ref(false)
const personToEdit = ref<Person | null>(null)
const isDetailOpen = ref(false)
const selectedPerson = ref<Person | null>(null)
const isRelFormOpen = ref(false)
const relSourceId = ref<string | undefined>(undefined)
const isPathFinderOpen = ref(false)
const pathTargetId = ref('')

// Delete confirmation
const isConfirmDeleteOpen = ref(false)
const personToDeleteId = ref<string | null>(null)

// Pagination / chunking for 5000+ people performance
const displayLimit = ref(60)

const visiblePeople = computed(() => {
  return personStore.filteredPeople.slice(0, displayLimit.value)
})

function loadMore() {
  displayLimit.value += 60
}

function handleOpenCreate() {
  personToEdit.value = null
  isFormOpen.value = true
}

function handleSelectPerson(p: Person) {
  selectedPerson.value = p
  isDetailOpen.value = true
}

function handleEditPerson(p: Person) {
  isDetailOpen.value = false
  personToEdit.value = p
  isFormOpen.value = true
}

function handleOpenPathFinder(id: string) {
  isDetailOpen.value = false
  pathTargetId.value = id
  isPathFinderOpen.value = true
}

function handleHighlightPath(nodeIds: string[]) {
  isPathFinderOpen.value = false
  router.push('/graph')
  setTimeout(() => {
    cytoscapeService.highlightPath(nodeIds)
  }, 400)
}

async function handleSavePerson(data: any) {
  const pendingRels = data.pendingRelationships || []
  delete data.pendingRelationships

  if (data.id) {
    await personStore.updatePerson(data as Person)

    // Sync relationships for this person
    const currentRels = relStore.getRelationshipsForPerson(data.id)
    for (const cr of currentRels) {
      await relStore.deleteRelationship(cr.id)
    }

    for (const rel of pendingRels) {
      if (rel.targetPersonId) {
        await relStore.addRelationship({
          sourcePersonId: data.id,
          targetPersonId: rel.targetPersonId,
          type: rel.type || 'ارتباط',
          strength: rel.strength || 3,
          notes: rel.notes || '',
        })
      }
    }

    showToast('مشخصات و پیوندهای مخاطب با موفقیت ذخیره شد.', 'success')
  } else {
    const id = await personStore.addPerson(data)

    if (pendingRels.length > 0) {
      for (const rel of pendingRels) {
        if (rel.targetPersonId) {
          await relStore.addRelationship({
            sourcePersonId: id,
            targetPersonId: rel.targetPersonId,
            type: rel.type || 'ارتباط',
            strength: rel.strength || 3,
            notes: rel.notes || '',
          })
        }
      }
      showToast('مخاطب جدید همراه با پیوندهای ارتباطی با موفقیت ثبت شد.', 'success')
    } else {
      showToast('مخاطب جدید با موفقیت ثبت شد.', 'success')
    }
  }
  isFormOpen.value = false
}

async function handleArchivePerson(id: string) {
  await personStore.archivePerson(id)
  isDetailOpen.value = false
  showToast('مخاطب به بخش بایگانی منتقل شد.', 'info')
}

function handlePromptDelete(id: string) {
  personToDeleteId.value = id
  isConfirmDeleteOpen.value = true
}

async function handleConfirmDelete() {
  if (personToDeleteId.value) {
    await personStore.deletePerson(personToDeleteId.value)
    isConfirmDeleteOpen.value = false
    isDetailOpen.value = false
    personToDeleteId.value = null
    showToast('مخاطب و پیوندهای مربوطه حذف شدند.', 'info')
  }
}

function handleOpenAddRelation(sourceId: string) {
  relSourceId.value = sourceId
  isRelFormOpen.value = true
}

async function handleSaveRelation(relData: any) {
  await relStore.addRelationship(relData)
  isRelFormOpen.value = false
  showToast('پیوند جدید با موفقیت در گراف ثبت شد.', 'success')
}

function handleSelectRelatedPerson(id: string) {
  const p = personStore.people.find((x) => x.id === id)
  if (p) {
    selectedPerson.value = p
  }
}

async function handleDeleteRelation(relationId: string) {
  await relStore.deleteRelationship(relationId)
  showToast('پیوند با موفقیت حذف شد.', 'info')
}

// Debounced search
const searchInput = ref(personStore.searchQuery)
let debounceTimer: any = null

function onSearchInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  searchInput.value = val
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    personStore.searchQuery = val
  }, 200)
}

function clearSearch() {
  searchInput.value = ''
  personStore.searchQuery = ''
}
</script>

<template>
  <div class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 pb-24 space-y-4">
    <!-- Top Action Bar: Search & Quick Add -->
    <div class="flex items-center gap-2.5">
      <!-- Search Input -->
      <div class="relative flex-1">
        <Search class="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          :value="searchInput"
          @input="onSearchInput"
          type="text"
          placeholder="جستجوی نام، تلفن، سازمان، برچسب یا یادداشت..."
          class="w-full pr-10 pl-8 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-xs transition-shadow"
        />
        <button
          v-if="searchInput"
          type="button"
          @click="clearSearch"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Quick Add Person Button -->
      <button
        type="button"
        @click="handleOpenCreate"
        class="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-primary-700 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-500 rounded-2xl shadow-sm transition-all active:scale-95 shrink-0"
      >
        <Plus class="w-4 h-4" />
        <span class="hidden sm:inline">شخص جدید</span>
        <span class="sm:hidden">ثبت</span>
      </button>
    </div>

    <!-- Tags Filter Horizontal Scroll Bar -->
    <div v-if="personStore.tags.length > 0" class="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
      <button
        type="button"
        @click="personStore.selectedTags = []"
        :class="[
          'px-3 py-1.5 text-xs font-semibold rounded-xl border shrink-0 transition-all',
          personStore.selectedTags.length === 0
            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent shadow-xs'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400',
        ]"
      >
        همه ({{ toPersianDigits(personStore.people.length) }})
      </button>

      <button
        v-for="tag in personStore.tags"
        :key="tag.id"
        type="button"
        @click="personStore.toggleTagFilter(tag.name)"
        :class="[
          'px-3 py-1.5 text-xs font-semibold rounded-xl border shrink-0 transition-all flex items-center gap-1.5',
          personStore.selectedTags.includes(tag.name)
            ? 'bg-primary-50 dark:bg-primary-950/80 border-primary-500 text-primary-700 dark:text-primary-300 font-bold shadow-xs'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400',
        ]"
      >
        <span
          class="w-2 h-2 rounded-full shrink-0"
          :style="{ backgroundColor: tag.color }"
        ></span>
        <span>{{ tag.name }}</span>
      </button>
    </div>

    <!-- Loading Skeleton -->
    <LoadingSkeleton v-if="personStore.isLoading" />

    <!-- People Cards Grid -->
    <div
      v-else-if="visiblePeople.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
    >
      <PersonCard
        v-for="person in visiblePeople"
        :key="person.id"
        :person="person"
        @select="handleSelectPerson"
      />
    </div>

    <!-- Empty State -->
    <EmptyState
      v-else-if="!personStore.isLoading"
      :icon="Users"
      :title="personStore.searchQuery ? 'هیچ مخاطبی با این مشخصات یافت نشد' : 'هنوز مخاطبی ثبت نشده است'"
      :description="
        personStore.searchQuery
          ? 'املا و عبارت جستجو را بازبینی کنید یا فیلتر برچسب‌ها را تغییر دهید.'
          : 'اولین شخص را به سامانه اضافه کنید یا اطلاعات را از فایل vCard/اکسل وارد نمایید.'
      "
      action-label="ثبت اولین مخاطب"
      @action="handleOpenCreate"
    >
      <template #action-icon>
        <UserPlus class="w-4 h-4" />
      </template>
    </EmptyState>

    <!-- Load More Button for large datasets (5,000+ benchmark) -->
    <div
      v-if="personStore.filteredPeople.length > visiblePeople.length"
      class="flex justify-center pt-4"
    >
      <button
        type="button"
        @click="loadMore"
        class="px-5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs hover:bg-slate-50 transition-colors"
      >
        نمایش بیشتر ({{ toPersianDigits(personStore.filteredPeople.length - visiblePeople.length) }} نفر باقی‌مانده)
      </button>
    </div>

    <!-- Modals -->
    <PersonFormModal
      :is-open="isFormOpen"
      :person-to-edit="personToEdit"
      @close="isFormOpen = false"
      @save="handleSavePerson"
    />

    <PersonDetailSheet
      :is-open="isDetailOpen"
      :person="selectedPerson"
      @close="isDetailOpen = false"
      @edit="handleEditPerson"
      @archive="handleArchivePerson"
      @delete="handlePromptDelete"
      @add-relation="handleOpenAddRelation"
      @select-person="handleSelectRelatedPerson"
      @find-path="handleOpenPathFinder"
      @delete-relation="handleDeleteRelation"
    />

    <PathFinderModal
      :is-open="isPathFinderOpen"
      :initial-target-id="pathTargetId"
      @close="isPathFinderOpen = false"
      @highlight-path="handleHighlightPath"
    />

    <RelationshipFormModal
      :is-open="isRelFormOpen"
      :initial-source-id="relSourceId"
      @close="isRelFormOpen = false"
      @save="handleSaveRelation"
    />

    <ConfirmModal
      :is-open="isConfirmDeleteOpen"
      title="حذف کامل مخاطب"
      message="آیا از حذف این شخص اطمینان دارید؟ تمامی روابط و پیوندهای ثبت‌شده برای این شخص نیز حذف خواهند شد."
      confirm-text="حذف کامل"
      :is-danger="true"
      @cancel="isConfirmDeleteOpen = false"
      @confirm="handleConfirmDelete"
    />
  </div>
</template>
