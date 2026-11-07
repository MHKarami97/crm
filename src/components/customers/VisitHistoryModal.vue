<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'
import { useCustomerStore } from '@/stores/useCustomerStore'
import { usePersonStore } from '@/stores/usePersonStore'
import { getTodayShamsiString, formatShortShamsi, gregorianToShamsi, shamsiToGregorian } from '@/utils/jalali'
import { formatMaskedPrice, toPersianDigits } from '@/utils/format'
import { Plus, Trash2, Calendar, DollarSign, Clock, Camera, FileText } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
  personId: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const customerStore = useCustomerStore()
const personStore = usePersonStore()

const person = computed(() =>
  personStore.people.find((p) => p.id === props.personId)
)

const customerProfile = computed(() =>
  customerStore.getProfileByPersonId(props.personId)
)

const visits = computed(() =>
  customerStore.getVisitsForPerson(props.personId)
)

// Form state for adding new visit
const showAddForm = ref(false)
const visitDate = ref('')
const serviceName = ref('')
const price = ref<number | ''>('')
const notes = ref('')
const photoUrl = ref('')
const nextDueDate = ref('')
const isSubmitting = ref(false)
const previewImage = ref<string | null>(null)

// Quick suggestions based on template
const serviceSuggestions = computed(() => {
  switch (customerStore.activeBusinessType) {
    case 'haircut':
      return ['کوتاهی مو', 'اصلاح و فید', 'رنگ و لایت', 'کراتین و احیا', 'پاکسازی پوست']
    case 'boutique':
      return ['مانتو / پالتو', 'شلوار جین', 'پیراهن مجلسی', 'شومیز / تاپ', 'کفش و کیف']
    case 'auto':
      return ['تعویض روغن و فیلترها', 'سرویس لنت و ترمز', 'دیاگ و تنظیم موتور', 'جلوبندی و کمک‌فنر']
    default:
      return ['خدمت عمومی', 'خرید کالا', 'مشاوره', 'پشتیبانی']
  }
})

// Auto-calculate next due date based on template repeat interval
function calculateSuggestedDueDate(baseDateStr: string) {
  const repeatDays = customerStore.currentTemplate.defaultRepeatDays || 28
  const parts = baseDateStr.split(/[-/]/).map(Number)
  if (parts.length >= 3) {
    try {
      const g = shamsiToGregorian(parts[0], parts[1], parts[2])
      const futureG = new Date(g.getTime() + repeatDays * 24 * 60 * 60 * 1000)
      const s = gregorianToShamsi(futureG)
      const m = String(s.jm).padStart(2, '0')
      const d = String(s.jd).padStart(2, '0')
      return `${s.jy}-${m}-${d}`
    } catch {
      return ''
    }
  }
  return ''
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      resetForm()
      showAddForm.value = visits.value.length === 0
    }
  }
)

function resetForm() {
  visitDate.value = getTodayShamsiString()
  serviceName.value = ''
  price.value = ''
  notes.value = ''
  photoUrl.value = ''
  nextDueDate.value = calculateSuggestedDueDate(visitDate.value)
}

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
        photoUrl.value = canvas.toDataURL('image/jpeg', 0.8)
      }
    }
    img.src = e.target?.result as string
  }
  reader.readAsDataURL(file)
  input.value = ''
}

async function handleAddVisit() {
  if (!serviceName.value.trim() || !visitDate.value.trim()) return

  isSubmitting.value = true
  try {
    await customerStore.logVisit(props.personId, {
      date: visitDate.value.trim(),
      serviceName: serviceName.value.trim(),
      price: Number(price.value) || 0,
      notes: notes.value.trim() || undefined,
      photoUrl: photoUrl.value || undefined,
      nextDueDate: nextDueDate.value.trim() || undefined,
    })
    resetForm()
    showAddForm.value = false
  } finally {
    isSubmitting.value = false
  }
}

async function handleDeleteVisit(id: string) {
  if (confirm('آیا از حذف این رکورد مراجعه مطمئن هستید؟')) {
    await customerStore.deleteVisit(id)
  }
}
</script>

<template>
  <Modal
    :is-open="modelValue"
    @close="emit('update:modelValue', false)"
    :title="`سابقه مراجعات: ${person?.name || ''}`"
    max-width="md"
  >
    <div class="space-y-4 max-h-[70vh] overflow-y-auto px-1 py-1">
      <!-- Header stats summary -->
      <div
        class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
      >
        <div>
          <span class="text-xs text-slate-500 dark:text-slate-400 block">مجموع پرداخت‌ها</span>
          <span class="text-base font-bold text-primary-700 dark:text-primary-300">
            {{ formatMaskedPrice(customerProfile?.totalSpent || 0, customerStore.isPrivacyMasked) }}
          </span>
        </div>
        <div class="text-left">
          <span class="text-xs text-slate-500 dark:text-slate-400 block">تعداد دفعات مراجعه</span>
          <span class="text-base font-bold text-slate-800 dark:text-slate-100">
            {{ toPersianDigits(visits.length) }} بار
          </span>
        </div>
      </div>

      <!-- Action to toggle add visit form -->
      <div class="flex items-center justify-between">
        <h4 class="text-xs font-bold text-slate-700 dark:text-slate-300">
          لیست مراجعات و خریدها
        </h4>
        <button
          type="button"
          @click="showAddForm = !showAddForm"
          class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/40 hover:bg-primary-100 dark:hover:bg-primary-900/60 transition"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>{{ showAddForm ? 'بستن فرم ثبت' : 'ثبت مراجعه جدید' }}</span>
        </button>
      </div>

      <!-- New Visit Form -->
      <div
        v-if="showAddForm"
        class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border-2 border-primary-200 dark:border-primary-800/60 shadow-sm space-y-3 transition-all"
      >
        <div class="text-xs font-bold text-primary-800 dark:text-primary-300 flex items-center gap-1.5">
          <Calendar class="w-4 h-4" />
          <span>ثبت مراجعه / خرید جدید</span>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <!-- Date -->
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
              تاریخ (شمسی)
            </label>
            <input
              type="text"
              v-model="visitDate"
              dir="ltr"
              class="w-full text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-center"
              placeholder="1403-08-15"
            />
          </div>

          <!-- Price -->
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
              مبلغ (تومان)
            </label>
            <input
              type="number"
              v-model.number="price"
              class="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2"
              placeholder="مثلاً 350000"
            />
          </div>
        </div>

        <!-- Service Name -->
        <div>
          <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
            عنوان خدمت یا کالا *
          </label>
          <input
            type="text"
            v-model="serviceName"
            class="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2"
            placeholder="مثلاً کوتاهی و فرمول رنگ ۳..."
          />
          <!-- Quick suggestions pills -->
          <div class="flex flex-wrap gap-1 mt-1.5">
            <button
              v-for="sug in serviceSuggestions"
              :key="sug"
              type="button"
              @click="serviceName = sug"
              class="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary-100 dark:hover:bg-primary-900 transition"
            >
              {{ sug }}
            </button>
          </div>
        </div>

        <!-- Next Due Date -->
        <div>
          <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
            تاریخ مراجعه بعدی پیشنهادی (جهت یادآوری)
          </label>
          <input
            type="text"
            v-model="nextDueDate"
            dir="ltr"
            class="w-full text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-center"
            placeholder="1403-09-15"
          />
        </div>

        <!-- Notes -->
        <div>
          <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
            یادداشت، جزییات یا تغییرات در کار
          </label>
          <textarea
            v-model="notes"
            rows="2"
            class="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 resize-none"
            placeholder="جزییات کار انجام شده..."
          ></textarea>
        </div>

        <!-- Photo Attachment -->
        <div class="flex items-center gap-3">
          <label
            class="inline-flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 cursor-pointer font-medium hover:underline"
          >
            <Camera class="w-4 h-4" />
            <span>پیوست عکس فاکتور / کار</span>
            <input
              type="file"
              accept="image/*"
              class="hidden"
              @change="handlePhotoUpload"
            />
          </label>
          <div
            v-if="photoUrl"
            class="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600"
          >
            <img :src="photoUrl" class="w-full h-full object-cover" />
            <button
              type="button"
              @click="photoUrl = ''"
              class="absolute inset-0 bg-black/40 text-white flex items-center justify-center text-xs"
            >
              ×
            </button>
          </div>
        </div>

        <!-- Submit Form -->
        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            @click="showAddForm = false"
            class="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400"
          >
            انصراف
          </button>
          <button
            type="button"
            @click="handleAddVisit"
            :disabled="isSubmitting || !serviceName"
            class="px-4 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 active:scale-95 rounded-xl transition disabled:opacity-50"
          >
            {{ isSubmitting ? 'در حال ثبت...' : 'ثبت نهایی' }}
          </button>
        </div>
      </div>

      <!-- Past Visits List Timeline -->
      <div v-if="visits.length > 0" class="space-y-2.5">
        <div
          v-for="v in visits"
          :key="v.id"
          class="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 relative"
        >
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {{ v.serviceName }}
                </span>
                <span
                  class="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                >
                  {{ formatMaskedPrice(v.price, customerStore.isPrivacyMasked) }}
                </span>
              </div>
              <div class="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                <span class="flex items-center gap-1 font-mono">
                  <Calendar class="w-3 h-3" />
                  {{ toPersianDigits(v.date) }}
                </span>
                <span v-if="v.nextDueDate" class="text-primary-600 dark:text-primary-400 font-mono">
                  (موعد بعدی: {{ toPersianDigits(v.nextDueDate) }})
                </span>
              </div>
            </div>

            <!-- Delete button -->
            <button
              type="button"
              @click="handleDeleteVisit(v.id)"
              class="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
              title="حذف مراجعه"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Notes -->
          <p
            v-if="v.notes"
            class="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl"
          >
            {{ v.notes }}
          </p>

          <!-- Attached Photo Thumbnail -->
          <div v-if="v.photoUrl" class="pt-1">
            <button
              type="button"
              @click="previewImage = v.photoUrl"
              class="inline-flex items-center gap-1 text-[11px] text-primary-600 dark:text-primary-400 font-medium"
            >
              <Camera class="w-3.5 h-3.5" />
              <span>مشاهده تصویر پیوست</span>
            </button>
          </div>
        </div>
      </div>

      <div
        v-else-if="!showAddForm"
        class="py-8 text-center text-slate-400 dark:text-slate-500 text-xs"
      >
        هیچ سابقه‌ای برای این مشتری ثبت نشده است. دکمه «ثبت مراجعه جدید» را بزنید.
      </div>
    </div>

    <!-- Image Preview Modal -->
    <div
      v-if="previewImage"
      class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      @click="previewImage = null"
    >
      <div class="max-w-lg max-h-[85vh] overflow-hidden rounded-2xl bg-black">
        <img :src="previewImage" class="w-full h-full object-contain" />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <button
          type="button"
          @click="emit('update:modelValue', false)"
          class="px-5 py-2 text-sm rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          بستن
        </button>
      </div>
    </template>
  </Modal>
</template>
