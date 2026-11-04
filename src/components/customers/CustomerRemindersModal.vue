<script setup lang="ts">
import { ref, computed } from 'vue'
import Modal from '@/components/common/Modal.vue'
import { useCustomerStore } from '@/stores/useCustomerStore'
import { toPersianDigits, formatPhoneNumber } from '@/utils/format'
import { Bell, Clock, Phone, MessageCircle, AlertTriangle, UserX, Calendar } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'selectCustomer', personId: string): void
}>()

const customerStore = useCustomerStore()

const activeTab = ref<'due' | 'dormant'>('due')

const dueList = computed(() => customerStore.dueRepeatCustomers)
const dormantList = computed(() => customerStore.dormantCustomers)
</script>

<template>
  <Modal
    :is-open="modelValue"
    @close="emit('update:modelValue', false)"
    title="یادآوری‌های پیگیری مشتریان"
    max-width="md"
  >
    <div class="space-y-4 max-h-[70vh] overflow-y-auto px-1 py-1">
      <!-- Tabs -->
      <div class="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl gap-1">
        <button
          type="button"
          @click="activeTab = 'due'"
          :class="[
            'flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5',
            activeTab === 'due'
              ? 'bg-white dark:bg-slate-700 text-primary-700 dark:text-primary-300 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700',
          ]"
        >
          <Clock class="w-3.5 h-3.5" />
          <span>موعد تکرار مراجعه</span>
          <span
            v-if="dueList.length > 0"
            class="px-1.5 py-0.2 text-[10px] rounded-full bg-rose-500 text-white font-mono"
          >
            {{ toPersianDigits(dueList.length) }}
          </span>
        </button>

        <button
          type="button"
          @click="activeTab = 'dormant'"
          :class="[
            'flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5',
            activeTab === 'dormant'
              ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700',
          ]"
        >
          <UserX class="w-3.5 h-3.5" />
          <span>مشتریان غیرفعال</span>
          <span
            v-if="dormantList.length > 0"
            class="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-500 text-white font-mono"
          >
            {{ toPersianDigits(dormantList.length) }}
          </span>
        </button>
      </div>

      <!-- Tab 1: Due for Repeat Visit -->
      <div v-if="activeTab === 'due'" class="space-y-2.5">
        <div
          v-if="dueList.length > 0"
          v-for="item in dueList"
          :key="item.profile.id"
          class="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-xs"
        >
          <div
            class="cursor-pointer flex-1"
            @click="emit('selectCustomer', item.profile.personId); emit('update:modelValue', false)"
          >
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-900 dark:text-slate-100">
                {{ item.person?.name }}
              </span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-semibold border border-rose-200 dark:border-rose-800">
                موعد تکرار خدمت
              </span>
            </div>
            <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <span v-if="item.profile.lastVisitDate">
                آخرین مراجعه: {{ toPersianDigits(item.profile.lastVisitDate) }}
              </span>
              <span v-if="item.lastVisitDaysAgo !== null">
                ({{ toPersianDigits(item.lastVisitDaysAgo) }} روز پیش)
              </span>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div class="flex items-center gap-1 shrink-0">
            <a
              v-if="item.person?.customFields?.phone"
              :href="`tel:${item.person.customFields.phone}`"
              class="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 transition"
              title="تماس"
            >
              <Phone class="w-3.5 h-3.5" />
            </a>
            <a
              v-if="item.person?.customFields?.phone"
              :href="`sms:${item.person.customFields.phone}`"
              class="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 transition"
              title="ارسال پیامک"
            >
              <MessageCircle class="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div
          v-else
          class="py-10 text-center text-slate-400 dark:text-slate-500 text-xs"
        >
          هیچ مشتری در حال حاضر در موعد تکرار قرار ندارد. همه چیز به‌روز است!
        </div>
      </div>

      <!-- Tab 2: Dormant Customers -->
      <div v-if="activeTab === 'dormant'" class="space-y-2.5">
        <p class="text-[11px] text-slate-500 dark:text-slate-400">
          مشتریانی که بیش از ۴۵ روز است مراجعه نکرده‌اند و نیاز به پیگیری و ارتباط مجدد دارند:
        </p>

        <div
          v-if="dormantList.length > 0"
          v-for="item in dormantList"
          :key="item.profile.id"
          class="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-xs"
        >
          <div
            class="cursor-pointer flex-1"
            @click="emit('selectCustomer', item.profile.personId); emit('update:modelValue', false)"
          >
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-900 dark:text-slate-100">
                {{ item.person?.name }}
              </span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-semibold border border-amber-200 dark:border-amber-800">
                {{ toPersianDigits(item.lastVisitDaysAgo) }} روز بدون مراجعه
              </span>
            </div>
            <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              آخرین مراجعه: {{ item.profile.lastVisitDate ? toPersianDigits(item.profile.lastVisitDate) : 'نامشخص' }}
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div class="flex items-center gap-1 shrink-0">
            <a
              v-if="item.person?.customFields?.phone"
              :href="`tel:${item.person.customFields.phone}`"
              class="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 transition"
              title="تماس پیگیری"
            >
              <Phone class="w-3.5 h-3.5" />
            </a>
            <a
              v-if="item.person?.customFields?.phone"
              :href="`sms:${item.person.customFields.phone}?body=سلام ${item.person.name} عزیز، وقت بخیر! مدتی است شما را ندیده‌ایم...`"
              class="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 transition"
              title="پیامک بازگشت مشتری"
            >
              <MessageCircle class="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div
          v-else
          class="py-10 text-center text-slate-400 dark:text-slate-500 text-xs"
        >
          مشتری غیرفعالی در این بازه وجود ندارد.
        </div>
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
