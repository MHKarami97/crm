import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CustomerProfile, CustomerVisit, Person } from '@/domain/models'
import { BUSINESS_TEMPLATES, type BusinessType } from '@/domain/businessTemplates'
import { customerRepository } from '@/data/repositories/CustomerRepository'
import { usePersonStore } from './usePersonStore'
import { useRelationshipStore } from './useRelationshipStore'
import { daysSinceShamsiDate, gregorianToShamsi } from '@/utils/jalali'

export interface EnrichedCustomerProfile {
  profile: CustomerProfile
  person: Person | null
  lastVisitDaysAgo: number | null
  isDormant: boolean
  isDueForRepeat: boolean
  referredByPerson: Person | null
  referredCount: number
}

export const useCustomerStore = defineStore('customer', () => {
  const personStore = usePersonStore()
  const relationStore = useRelationshipStore()

  const profiles = ref<CustomerProfile[]>([])
  const visits = ref<CustomerVisit[]>([])
  const isLoading = ref(false)

  // Persisted business type & privacy mask
  const activeBusinessType = ref<BusinessType>(
    (localStorage.getItem('crm_active_business') as BusinessType) || 'haircut'
  )
  const isPrivacyMasked = ref<boolean>(
    localStorage.getItem('crm_privacy_masked') === 'true'
  )

  const searchQuery = ref('')
  const preferenceFilterKey = ref('')
  const preferenceFilterVal = ref('')

  const currentTemplate = computed(() => BUSINESS_TEMPLATES[activeBusinessType.value])
  const allTemplates = computed(() => Object.values(BUSINESS_TEMPLATES))

  async function loadAll() {
    isLoading.value = true
    try {
      const [allProfiles, allVisits] = await Promise.all([
        customerRepository.getAllProfiles(),
        customerRepository.getAllVisits(),
      ])
      profiles.value = allProfiles
      visits.value = allVisits
    } finally {
      isLoading.value = false
    }
  }

  function setBusinessType(type: BusinessType) {
    activeBusinessType.value = type
    localStorage.setItem('crm_active_business', type)
  }

  function togglePrivacyMask() {
    isPrivacyMasked.value = !isPrivacyMasked.value
    localStorage.setItem('crm_privacy_masked', String(isPrivacyMasked.value))
  }

  // Get or find customer profile by personId
  function getProfileByPersonId(personId: string): CustomerProfile | undefined {
    return profiles.value.find((p) => p.personId === personId)
  }

  // Get visits for a specific person
  function getVisitsForPerson(personId: string): CustomerVisit[] {
    return visits.value
      .filter((v) => v.personId === personId)
      .sort((a, b) => b.date.localeCompare(a.date))
  }

  // Enriched list of customer profiles for active business type
  const enrichedProfiles = computed<EnrichedCustomerProfile[]>(() => {
    const defaultRepeatDays = currentTemplate.value.defaultRepeatDays || 30
    const dormantDaysThreshold = Math.max(45, Math.floor(defaultRepeatDays * 1.5))

    return profiles.value
      .filter((prof) => prof.businessType === activeBusinessType.value)
      .map((prof) => {
        const person = personStore.people.find((p) => p.id === prof.personId) || null

        let lastVisitDaysAgo: number | null = null
        if (prof.lastVisitDate) {
          lastVisitDaysAgo = daysSinceShamsiDate(prof.lastVisitDate)
        }

        // Determine if dormant
        const isDormant = lastVisitDaysAgo !== null && lastVisitDaysAgo >= dormantDaysThreshold

        // Determine if due for repeat visit
        let isDueForRepeat = false
        if (prof.nextServiceDueDate) {
          const daysToDue = daysSinceShamsiDate(prof.nextServiceDueDate)
          // Negative means future. If -7 <= daysToDue <= 0 or positive (overdue), it's due
          if (daysToDue !== null && daysToDue >= -7) {
            isDueForRepeat = true
          }
        } else if (lastVisitDaysAgo !== null && lastVisitDaysAgo >= defaultRepeatDays) {
          isDueForRepeat = true
        }

        // Find referral connection
        let referredByPerson: Person | null = null
        let referredCount = 0

        // Find who referred this person
        const incomingReferrals = relationStore.relationships.filter(
          (r) => r.targetPersonId === prof.personId && (r.type === 'referral' || r.type === 'colleague')
        )
        if (incomingReferrals.length > 0) {
          const referrerId = incomingReferrals[0].sourcePersonId
          referredByPerson = personStore.people.find((p) => p.id === referrerId) || null
        }

        // Count how many people this person referred
        const outgoingReferrals = relationStore.relationships.filter(
          (r) => r.sourcePersonId === prof.personId && r.type === 'referral'
        )
        referredCount = outgoingReferrals.length

        return {
          profile: prof,
          person,
          lastVisitDaysAgo,
          isDormant,
          isDueForRepeat,
          referredByPerson,
          referredCount,
        }
      })
  })

  // Filtered customer profiles by search & preference filter
  const filteredProfiles = computed<EnrichedCustomerProfile[]>(() => {
    let list = enrichedProfiles.value
    const q = searchQuery.value.trim().toLowerCase()

    if (q) {
      list = list.filter((item) => {
        const nameMatch = item.person?.name.toLowerCase().includes(q)
        const phoneMatch = item.person?.customFields?.phone?.toString().includes(q)
        const notesMatch = item.person?.notes?.toLowerCase().includes(q)
        // Search inside preferences values
        const prefValues = Object.values(item.profile.preferences || {}).join(' ').toLowerCase()
        const prefMatch = prefValues.includes(q)
        return nameMatch || phoneMatch || notesMatch || prefMatch
      })
    }

    if (preferenceFilterKey.value && preferenceFilterVal.value) {
      list = list.filter((item) => {
        const val = item.profile.preferences?.[preferenceFilterKey.value]
        if (!val) return false
        return String(val).toLowerCase().includes(preferenceFilterVal.value.toLowerCase())
      })
    }

    return list
  })

  // Customers due for repeat visit
  const dueRepeatCustomers = computed(() => {
    return enrichedProfiles.value.filter((p) => p.isDueForRepeat && !p.isDormant)
  })

  // Dormant customers (inactive for 45+ days)
  const dormantCustomers = computed(() => {
    return enrichedProfiles.value.filter((p) => p.isDormant)
  })

  // Financial and visit analytics
  const analytics = computed(() => {
    const relevantVisits = visits.value.filter((v) => {
      const prof = profiles.value.find((p) => p.id === v.customerProfileId)
      return prof?.businessType === activeBusinessType.value
    })

    const totalRevenue = relevantVisits.reduce((sum, v) => sum + (Number(v.price) || 0), 0)
    const totalVisitsCount = relevantVisits.length
    const averageVisitValue = totalVisitsCount > 0 ? Math.round(totalRevenue / totalVisitsCount) : 0

    // This month's revenue (current Shamsi month)
    const todayShamsi = gregorianToShamsi(new Date())
    const thisMonthPrefix = `${todayShamsi.jy}-${String(todayShamsi.jm).padStart(2, '0')}`
    const thisMonthAltPrefix = `${todayShamsi.jy}/${String(todayShamsi.jm).padStart(2, '0')}`

    const thisMonthVisits = relevantVisits.filter(
      (v) => v.date.startsWith(thisMonthPrefix) || v.date.startsWith(thisMonthAltPrefix)
    )
    const thisMonthRevenue = thisMonthVisits.reduce((sum, v) => sum + (Number(v.price) || 0), 0)

    // Top spending customers
    const topProfiles = [...enrichedProfiles.value]
      .filter((p) => p.profile.totalSpent > 0)
      .sort((a, b) => b.profile.totalSpent - a.profile.totalSpent)
      .slice(0, 5)

    // Top popular services
    const serviceCounts: Record<string, { count: number; revenue: number }> = {}
    for (const v of relevantVisits) {
      const name = v.serviceName.trim() || 'خدمت متفرقه'
      if (!serviceCounts[name]) {
        serviceCounts[name] = { count: 0, revenue: 0 }
      }
      serviceCounts[name].count += 1
      serviceCounts[name].revenue += Number(v.price) || 0
    }

    const topServices = Object.entries(serviceCounts)
      .map(([serviceName, data]) => ({ serviceName, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      totalRevenue,
      thisMonthRevenue,
      totalVisitsCount,
      averageVisitValue,
      topProfiles,
      topServices,
    }
  })

  // Action: Save or update customer profile
  async function saveProfile(
    personId: string,
    preferences: Record<string, any>,
    businessType = activeBusinessType.value
  ): Promise<CustomerProfile> {
    let profile = getProfileByPersonId(personId)

    if (profile) {
      profile.preferences = { ...profile.preferences, ...preferences }
      profile.businessType = businessType
      profile.updatedAt = new Date().toISOString()
      await customerRepository.saveProfile(profile)
    } else {
      profile = {
        id: 'cust-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        personId,
        businessType,
        totalSpent: 0,
        preferences,
        photos: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await customerRepository.saveProfile(profile)
      profiles.value.push(profile)
    }

    // Refresh memory list
    await loadAll()
    return profile
  }

  // Action: Log visit
  async function logVisit(
    personId: string,
    visitData: {
      date: string
      serviceName: string
      price: number
      notes?: string
      photoUrl?: string
      nextDueDate?: string
    }
  ): Promise<CustomerVisit> {
    let profile = getProfileByPersonId(personId)
    if (!profile) {
      profile = await saveProfile(personId, {})
    }

    const newVisit: CustomerVisit = {
      id: 'visit-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      personId,
      customerProfileId: profile.id,
      date: visitData.date,
      serviceName: visitData.serviceName,
      price: Number(visitData.price) || 0,
      notes: visitData.notes,
      photoUrl: visitData.photoUrl,
      nextDueDate: visitData.nextDueDate,
      createdAt: new Date().toISOString(),
    }

    await customerRepository.saveVisit(newVisit)
    await loadAll()
    return newVisit
  }

  // Action: Delete visit
  async function deleteVisit(visitId: string) {
    await customerRepository.deleteVisit(visitId)
    await loadAll()
  }

  // Action: Add photo to profile gallery
  async function addPhotoToProfile(personId: string, photoDataUrl: string) {
    let profile = getProfileByPersonId(personId)
    if (!profile) {
      profile = await saveProfile(personId, {})
    }
    if (!profile.photos) {
      profile.photos = []
    }
    profile.photos.push(photoDataUrl)
    await customerRepository.saveProfile(profile)
    await loadAll()
  }

  // Action: Remove photo from profile gallery
  async function removePhotoFromProfile(personId: string, index: number) {
    const profile = getProfileByPersonId(personId)
    if (profile && profile.photos && profile.photos[index]) {
      profile.photos.splice(index, 1)
      await customerRepository.saveProfile(profile)
      await loadAll()
    }
  }

  // Action: Link referral in relationship store
  async function setCustomerReferrer(personId: string, referrerPersonId: string) {
    // Remove old referral if any
    const existing = relationStore.relationships.find(
      (r) => r.targetPersonId === personId && r.type === 'referral'
    )
    if (existing) {
      await relationStore.deleteRelationship(existing.id)
    }

    if (referrerPersonId && referrerPersonId !== personId) {
      await relationStore.addRelationship({
        sourcePersonId: referrerPersonId,
        targetPersonId: personId,
        type: 'referral',
        strength: 4,
        notes: 'معرف مشتری کسب‌وکار',
      })
    }
  }

  return {
    profiles,
    visits,
    isLoading,
    activeBusinessType,
    isPrivacyMasked,
    searchQuery,
    preferenceFilterKey,
    preferenceFilterVal,
    currentTemplate,
    allTemplates,
    enrichedProfiles,
    filteredProfiles,
    dueRepeatCustomers,
    dormantCustomers,
    analytics,
    loadAll,
    setBusinessType,
    togglePrivacyMask,
    getProfileByPersonId,
    getVisitsForPerson,
    saveProfile,
    logVisit,
    deleteVisit,
    addPhotoToProfile,
    removePhotoFromProfile,
    setCustomerReferrer,
  }
})
