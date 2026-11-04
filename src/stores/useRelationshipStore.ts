import { defineStore } from 'pinia'
import { ref } from 'vue'
import { relationshipRepository } from '@/data/repositories/RelationshipRepository'
import type { Relationship } from '@/domain/models'

export const DEFAULT_RELATIONSHIP_TYPES = [
  'دوست',
  'همکار',
  'معرف',
  'مشتری',
  'خانواده',
  'تأمین‌کننده',
  'شریک تجاری',
  'هم‌کلاسی',
  'همسایه',
]

export const useRelationshipStore = defineStore('relationships', () => {
  const relationships = ref<Relationship[]>([])
  const isLoading = ref<boolean>(false)

  async function loadRelationships() {
    isLoading.value = true
    try {
      relationships.value = await relationshipRepository.getAll()
    } finally {
      isLoading.value = false
    }
  }

  function getRelationshipsForPerson(personId: string): Relationship[] {
    return relationships.value.filter(
      (r) => r.sourcePersonId === personId || r.targetPersonId === personId
    )
  }

  async function addRelationship(
    data: Omit<Relationship, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const now = new Date().toISOString()
    const newRel: Relationship = {
      ...data,
      id: 'rel-' + Math.random().toString(36).substring(2, 9),
      createdAt: now,
      updatedAt: now,
    }
    await relationshipRepository.create(newRel)
    relationships.value.push(newRel)
    return newRel.id
  }

  async function updateRelationship(data: Relationship): Promise<void> {
    await relationshipRepository.update(data)
    const index = relationships.value.findIndex((r) => r.id === data.id)
    if (index !== -1) {
      relationships.value[index] = { ...data, updatedAt: new Date().toISOString() }
    }
  }

  async function deleteRelationship(id: string): Promise<void> {
    await relationshipRepository.delete(id)
    relationships.value = relationships.value.filter((r) => r.id !== id)
  }

  return {
    relationships,
    isLoading,
    loadRelationships,
    getRelationshipsForPerson,
    addRelationship,
    updateRelationship,
    deleteRelationship,
  }
})
