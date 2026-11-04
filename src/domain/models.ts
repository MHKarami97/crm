export interface Person {
  id: string
  name: string
  avatarUrl?: string
  phones: string[]
  emails: string[]
  tags: string[]
  notes?: string
  customFields: Record<string, any>
  createdAt: string
  updatedAt: string
  archived?: boolean
}

export interface Relationship {
  id: string
  sourcePersonId: string
  targetPersonId: string
  type: string // e.g. 'دوست', 'همکار', 'معرف', 'مشتری', 'خانواده', 'تأمین‌کننده', 'هم‌کلاسی'
  strength: number // 1 to 5 (1: ضعیف، 5: بسیار صمیمی/عمیق)
  startDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'rating'
  | 'url'
  | 'phone'

export type FieldGroup =
  | 'identity' // هویت (مانند نام مستعار، کدملی)
  | 'contact' // تماس (آدرس، شبکه‌های اجتماعی)
  | 'career' // شغل (شرکت، سمت، صنعت)
  | 'acquaintance' // آشنایی (نحوه آشنایی، معرف اولیه)
  | 'personal' // شخصی (تاریخ تولد، سالگرد، علاقه‌مندی‌ها)
  | 'notes' // یادداشت
  | 'customer' // مشتری و کسب‌وکار

export interface FieldDefinition {
  id: string
  key: string
  label: string
  type: FieldType
  options?: string[] // For select and multiselect
  group: FieldGroup
  section: 'people' | 'customer'
  builtin: boolean
  archived: boolean
  order: number
  description?: string
}

export interface Tag {
  id: string
  name: string
  color: string
}

export interface Interaction {
  id: string
  personId: string
  type: 'call' | 'meeting' | 'message' | 'event' | 'purchase'
  date: string
  summary: string
  notes?: string
  createdAt: string
}

export interface CustomerProfile {
  id: string
  personId: string
  businessType: 'haircut' | 'boutique' | 'auto' | 'general'
  loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'vip'
  totalSpent: number
  lastVisitDate?: string
  nextServiceDueDate?: string
  preferences: Record<string, any>
  photos: string[]
  createdAt: string
  updatedAt: string
}

export interface CustomerVisit {
  id: string
  personId: string
  customerProfileId: string
  date: string // e.g. Shamsi string 1403/08/15
  serviceName: string
  price: number
  notes?: string
  photoUrl?: string
  nextDueDate?: string
  createdAt: string
}
