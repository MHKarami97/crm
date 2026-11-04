import { db } from '../AppDatabase'
import type { CustomerProfile, CustomerVisit } from '@/domain/models'
import { toCleanData } from '@/utils/cleanData'

export class CustomerRepository {
  async getProfileByPersonId(personId: string): Promise<CustomerProfile | undefined> {
    return db.customerProfiles.where('personId').equals(personId).first()
  }

  async getProfileById(id: string): Promise<CustomerProfile | undefined> {
    return db.customerProfiles.get(id)
  }

  async getAllProfiles(): Promise<CustomerProfile[]> {
    return db.customerProfiles.toArray()
  }

  async saveProfile(profile: CustomerProfile): Promise<string> {
    profile.updatedAt = new Date().toISOString()
    const cleanProfile = toCleanData(profile)
    await db.customerProfiles.put(cleanProfile)
    return cleanProfile.id
  }

  async deleteProfile(profileId: string): Promise<void> {
    await db.transaction('rw', [db.customerProfiles, db.customerVisits], async () => {
      await db.customerVisits.where('customerProfileId').equals(profileId).delete()
      await db.customerProfiles.delete(profileId)
    })
  }

  async getAllVisits(): Promise<CustomerVisit[]> {
    return db.customerVisits.orderBy('date').reverse().toArray()
  }

  async getVisitsByPersonId(personId: string): Promise<CustomerVisit[]> {
    const visits = await db.customerVisits.where('personId').equals(personId).toArray()
    return visits.sort((a, b) => b.date.localeCompare(a.date))
  }

  async getVisitsByProfileId(customerProfileId: string): Promise<CustomerVisit[]> {
    const visits = await db.customerVisits.where('customerProfileId').equals(customerProfileId).toArray()
    return visits.sort((a, b) => b.date.localeCompare(a.date))
  }

  async saveVisit(visit: CustomerVisit): Promise<string> {
    const cleanVisit = toCleanData(visit)
    await db.customerVisits.put(cleanVisit)

    // Recalculate customer totalSpent and lastVisitDate
    const profile = await db.customerProfiles.get(visit.customerProfileId)
    if (profile) {
      const allVisits = await db.customerVisits.where('customerProfileId').equals(visit.customerProfileId).toArray()
      profile.totalSpent = allVisits.reduce((sum, v) => sum + (Number(v.price) || 0), 0)
      const latest = allVisits.sort((a, b) => b.date.localeCompare(a.date))[0]
      if (latest) {
        profile.lastVisitDate = latest.date
      }
      if (visit.nextDueDate) {
        profile.nextServiceDueDate = visit.nextDueDate
      }
      profile.updatedAt = new Date().toISOString()
      await db.customerProfiles.put(toCleanData(profile))
    }

    return cleanVisit.id
  }

  async deleteVisit(visitId: string): Promise<void> {
    const visit = await db.customerVisits.get(visitId)
    if (visit) {
      await db.customerVisits.delete(visitId)
      const profile = await db.customerProfiles.get(visit.customerProfileId)
      if (profile) {
        const remainingVisits = await db.customerVisits.where('customerProfileId').equals(visit.customerProfileId).toArray()
        profile.totalSpent = remainingVisits.reduce((sum, v) => sum + (Number(v.price) || 0), 0)
        const latest = remainingVisits.sort((a, b) => b.date.localeCompare(a.date))[0]
        profile.lastVisitDate = latest ? latest.date : undefined
        profile.updatedAt = new Date().toISOString()
        await db.customerProfiles.put(toCleanData(profile))
      }
    }
  }
}

export const customerRepository = new CustomerRepository()
