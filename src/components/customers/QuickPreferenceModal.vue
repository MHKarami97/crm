<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Modal from '@/components/common/Modal.vue'
import { useCustomerStore } from '@/stores/useCustomerStore'
import { usePersonStore } from '@/stores/usePersonStore'
import { useRelationshipStore } from '@/stores/useRelationshipStore'
import { BUSINESS_TEMPLATES, type BusinessType } from '@/domain/businessTemplates'
import { Camera, Trash2, UserPlus, Sparkles } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
  personId: string
  businessType?: BusinessType
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}>()

const customerStore = useCustomerStore()
const personStore = usePersonStore()
const relationshipStore = useRelationshipStore()

const currentType = computed<BusinessType>(
  () => props.businessType || customerStore.activeBusinessType
)
const template = computed(() => BUSINESS_TEMPLATES[currentType.value])

const person = computed(() =>
  personStore.people.find((p) => p.id === props.personId)
)

const preferences = ref<Record<string, any>>({})
const photos = ref<string[]>([])
const selectedReferrerId = ref<string>('')
const isSaving = ref(false)

watch(
  () => props.modelValue,
  (open) => {
    if (open && props.personId) {
      loadCustomerData()
    }
  },
  { immediate: true }
)

function loadCustomerData() {
  const profile = customerStore.getProfileByPersonId(props.personId)
  if (profile) {
    preferences.value = { ...(profile.preferences || {}) }
    photos.value = [...(profile.photos || [])]
  } else {
    preferences.value = {}
    photos.value = []
  }

  // Find existing referrer
  const referralRel = relationshipStore.relationships.find(
    (r) => r.targetPersonId === props.personId && (r.type === 'referral' || r.type === 'colleague')
  )
  selectedReferrerId.value = referralRel ? referralRel.sourcePersonId : ''
}

const otherPeople = computed(() =>
  personStore.people.filter((p) => p.id !== props.personId)
)

// Compress and add photo
function handlePhotoUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || !input.files[0]) return

  const file = input.files[0]
  const reader = new FileReader()

  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const maxDim = 800
      let width = img.width
      let height = img.height

      if (width > height && width > maxDim) {
        height = Math.round((height * maxDim) / width)
        width = maxDim
      } else if (height > maxDim) {
        width = Math.round((width * maxDim) / height)
        height = maxDim
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8)
        photos.value.push(compressedDataUrl)
      }
    }
    img.src = e.target?.result as string
  }

  reader.readAsDataURL(file)
  input.value = ''
}

function removePhoto(idx: number) {
  photos.value.splice(idx, 1)
}

async function handleSave() {
  if (!props.personId) return
  isSaving.value = true
  try {
    const profile = await customerStore.saveProfile(
      props.personId,
      preferences.value,
      currentType.value
    )

    // Save photos
    profile.photos = [...photos.value]
    await customerStore.loadAll()

    // Save referrer
    if (selectedReferrerId.value) {
      await customerStore.setCustomerReferrer(props.personId, selectedReferrerId.value)
    }

    emit('saved')
    emit('update:modelValue', false)
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <Modal
    :is-open="modelValue"
    @close="emit('update:modelValue', false)"
    :title="`ترجیحات مشتری: ${person?.name || ''}`"
    max-width="md"
  >
    <div class="space-y-4 max-h-[70vh] overflow-y-auto px-1 py-1">
      <!-- Business Info Badge -->
      <div
        class="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300"
      >
        <Sparkles class="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />
        <span>قالب کسب‌وکار: <strong>{{ template.title }}</strong></span>
      </div>

      <!-- Referrer Selector -->
      <div>
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
          <UserPlus class="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
          <span>معرف این مشتری (اختیاری)</span>
        </label>
        <select
          v-model="selectedReferrerId"
          class="w-full text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:outline-none"
        >
          <option value="">بدون معرف (مراجعه مستقیم)</option>
          <option
            v-for="p in otherPeople"
            :key="p.id"
            :value="p.id"
          >
            {{ p.name }}
          </option>
        </select>
        <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
          معرف به‌صورت خودکار در گراف روابط ثبت و پیوند داده می‌شود.
        </p>
      </div>

      <!-- Dynamic Template Fields -->
      <div class="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div
          v-for="field in template.fields"
          :key="field.key"
          class="space-y-1"
        >
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-200">
            {{ field.label }}
          </label>

          <!-- Select Field -->
          <select
            v-if="field.type === 'select'"
            v-model="preferences[field.key]"
            class="w-full text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:outline-none"
          >
            <option value="">انتخاب کنید...</option>
            <option
              v-for="opt in field.options"
              :key="opt"
              :value="opt"
            >
              {{ opt }}
            </option>
          </select>

          <!-- Textarea Field -->
          <textarea
            v-else-if="field.type === 'textarea'"
            v-model="preferences[field.key]"
            rows="2"
            class="w-full text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none"
            :placeholder="field.description || ''"
          ></textarea>

          <!-- Number Field -->
          <input
            v-else-if="field.type === 'number'"
            type="number"
            v-model.number="preferences[field.key]"
            class="w-full text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            :placeholder="field.description || ''"
          />

          <!-- Standard Text Input -->
          <input
            v-else
            type="text"
            v-model="preferences[field.key]"
            class="w-full text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            :placeholder="field.description || ''"
          />

          <p
            v-if="field.description && field.type !== 'textarea'"
            class="text-[11px] text-slate-400 dark:text-slate-500"
          >
            {{ field.description }}
          </p>
        </div>
      </div>

      <!-- Photo Gallery Section -->
      <div class="pt-3 border-t border-slate-100 dark:border-slate-800">
        <div class="flex items-center justify-between mb-2">
          <label class="text-xs font-semibold text-slate-700 dark:text-slate-200">
            گالری عکس‌ها و نمونه‌کار مشتری
          </label>
          <label
            class="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 cursor-pointer font-medium hover:underline"
          >
            <Camera class="w-4 h-4" />
            <span>افزودن عکس</span>
            <input
              type="file"
              accept="image/*"
              class="hidden"
              @change="handlePhotoUpload"
            />
          </label>
        </div>

        <div
          v-if="photos.length > 0"
          class="grid grid-cols-3 gap-2"
        >
          <div
            v-for="(photo, idx) in photos"
            :key="idx"
            class="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
          >
            <img
              :src="photo"
              alt="عکس مشتری"
              class="w-full h-full object-cover"
            />
            <button
              type="button"
              @click="removePhoto(idx)"
              class="absolute top-1 right-1 p-1 rounded-full bg-red-600/80 text-white hover:bg-red-700 transition"
              title="حذف عکس"
            >
              <Trash2 class="w-3 h-3" />
            </button>
          </div>
        </div>
        <p
          v-else
          class="text-xs text-slate-400 dark:text-slate-500 text-center py-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl"
        >
          عکسی ثبت نشده است. (مثلاً مدل مو، لباس پرو شده یا وضعیت خودرو)
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <button
          type="button"
          @click="emit('update:modelValue', false)"
          class="px-4 py-2 text-sm rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          انصراف
        </button>
        <button
          type="button"
          @click="handleSave"
          :disabled="isSaving"
          class="px-5 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 active:scale-95 rounded-xl shadow-sm transition disabled:opacity-50"
        >
          {{ isSaving ? 'در حال ذخیره...' : 'ذخیره ترجیحات' }}
        </button>
      </div>
    </template>
  </Modal>
</template>
