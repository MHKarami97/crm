import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { personRepository } from '@/data/repositories/PersonRepository'
import { tagRepository } from '@/data/repositories/TagRepository'
import { celebrationService, type UpcomingCelebration } from '@/services/events/CelebrationService'
import { toCleanData } from '@/utils/cleanData'
import type { Person, Tag } from '@/domain/models'

export const usePersonStore = defineStore('people', () => {
  const people = ref<Person[]>([])
  const tags = ref<Tag[]>([])
  const isLoading = ref<boolean>(false)
  const searchQuery = ref<string>('')
  const selectedTags = ref<string[]>([])
  const selectedPersonId = ref<string | null>(null)

  const filteredPeople = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    const activeTags = selectedTags.value

    return people.value.filter((p) => {
      if (p.archived) return false

      if (activeTags.length > 0) {
        const hasMatch = activeTags.some((t) => p.tags.includes(t))
        if (!hasMatch) return false
      }

      if (!q) return true

      if (p.name.toLowerCase().includes(q)) return true
      if (p.phones.some((ph) => ph.includes(q))) return true
      if (p.emails.some((em) => em.toLowerCase().includes(q))) return true
      if (p.notes && p.notes.toLowerCase().includes(q)) return true

      if (p.customFields) {
        for (const v of Object.values(p.customFields)) {
          if (typeof v === 'string' && v.toLowerCase().includes(q)) return true
        }
      }

      return false
    })
  })

  const selectedPerson = computed(() => {
    if (!selectedPersonId.value) return null
    return people.value.find((p) => p.id === selectedPersonId.value) || null
  })

  const upcomingCelebrations = computed<UpcomingCelebration[]>(() => {
    return celebrationService.findUpcoming(people.value, 30)
  })

  async function loadPeople() {
    isLoading.value = true
    try {
      people.value = await personRepository.getAll(false)
      tags.value = await tagRepository.getAll()
    } finally {
      isLoading.value = false
    }
  }

  async function addPerson(
    data: Omit<Person, 'id' | 'createdAt' | 'updatedAt' | 'archived'>
  ): Promise<string> {
    const now = new Date().toISOString()
    const id = 'p-' + Math.random().toString(36).substring(2, 9)
    const cleanInput = toCleanData(data)
    delete (cleanInput as any).id

    const newPerson: Person = {
      ...cleanInput,
      id,
      archived: false,
      createdAt: now,
      updatedAt: now,
    }

    // Ensure tags are saved in tagRepository
    if (newPerson.tags && Array.isArray(newPerson.tags)) {
      for (const tagName of newPerson.tags) {
        if (tagName && typeof tagName === 'string') {
          await tagRepository.getOrCreate(tagName)
        }
      }
    }

    await personRepository.create(newPerson)
    people.value.unshift(newPerson)
    tags.value = await tagRepository.getAll()
    return id
  }

  async function updatePerson(data: Person): Promise<void> {
    const cleanPerson = toCleanData(data)
    cleanPerson.updatedAt = new Date().toISOString()

    if (cleanPerson.tags && Array.isArray(cleanPerson.tags)) {
      for (const tagName of cleanPerson.tags) {
        if (tagName && typeof tagName === 'string') {
          await tagRepository.getOrCreate(tagName)
        }
      }
    }

    await personRepository.update(cleanPerson)
    const index = people.value.findIndex((p) => p.id === cleanPerson.id)
    if (index !== -1) {
      people.value[index] = { ...cleanPerson }
    }
    tags.value = await tagRepository.getAll()
  }

  async function archivePerson(id: string): Promise<void> {
    await personRepository.archive(id)
    people.value = people.value.filter((p) => p.id !== id)
    if (selectedPersonId.value === id) selectedPersonId.value = null
  }

  async function deletePerson(id: string): Promise<void> {
    await personRepository.delete(id)
    people.value = people.value.filter((p) => p.id !== id)
    if (selectedPersonId.value === id) selectedPersonId.value = null
  }

  function selectPerson(id: string | null) {
    selectedPersonId.value = id
  }

  function toggleTagFilter(tagName: string) {
    const idx = selectedTags.value.indexOf(tagName)
    if (idx === -1) {
      selectedTags.value.push(tagName)
    } else {
      selectedTags.value.splice(idx, 1)
    }
  }

  function clearFilters() {
    searchQuery.value = ''
    selectedTags.value = []
  }

  return {
    people,
    tags,
    isLoading,
    searchQuery,
    selectedTags,
    selectedPersonId,
    filteredPeople,
    selectedPerson,
    upcomingCelebrations,
    loadPeople,
    addPerson,
    updatePerson,
    archivePerson,
    deletePerson,
    selectPerson,
    toggleTagFilter,
    clearFilters,
  }
})
