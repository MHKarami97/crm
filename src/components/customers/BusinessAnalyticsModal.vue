<script setup lang="ts">
import { computed } from 'vue'
import Modal from '@/components/common/Modal.vue'
import { useCustomerStore } from '@/stores/useCustomerStore'
import { formatMaskedPrice, toPersianDigits } from '@/utils/format'
import { BarChart3, TrendingUp, Users, DollarSign, Award, Star } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'selectCustomer', personId: string): void
}>()

const customerStore = useCustomerStore()

const analytics = computed(() => customerStore.analytics)
const isMasked = computed(() => customerStore.isPrivacyMasked)
</script>

<template>
  <Modal
    :is-open="modelValue"
    @close="emit('update:modelValue', false)"
    title="گزارش و تحلیل کسب‌وکار"
    max-width="md"
  >
    <div class="space-y-4 max-h-[70vh] overflow-y-auto px-1 py-1">
      <!-- 4 Metric Cards -->
      <div class="grid grid-cols-2 gap-2.5">
        <!-- Monthly Revenue -->
        <div
          class="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800 space-y-1"
        >
          <div class="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
            <TrendingUp class="w-3.5 h-3.5" />
            <span>درآمد ماه جاری</span>
          </div>
          <div class="text-base font-bold text-emerald-900 dark:text-emerald-100">
            {{ formatMaskedPrice(analytics.thisMonthRevenue, isMasked) }}
          </div>
        </div>

        <!-- Total Revenue -->
        <div
          class="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 space-y-1"
        >
          <div class="flex items-center gap-1.5 text-[11px] font-semibold text-blue-800 dark:text-blue-300">
            <DollarSign class="w-3.5 h-3.5" />
            <span>مجموع درآمد کل</span>
          </div>
          <div class="text-base font-bold text-blue-900 dark:text-blue-100">
            {{ formatMaskedPrice(analytics.totalRevenue, isMasked) }}
          </div>
        </div>

        <!-- Total Visits -->
        <div
          class="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1"
        >
          <div class="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            <Users class="w-3.5 h-3.5" />
            <span>تعداد مراجعات</span>
          </div>
          <div class="text-base font-bold text-slate-900 dark:text-slate-100">
            {{ toPersianDigits(analytics.totalVisitsCount) }} مرتبه
          </div>
        </div>

        <!-- Average Ticket -->
        <div
          class="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1"
        >
          <div class="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            <BarChart3 class="w-3.5 h-3.5" />
            <span>میانگین هر فاکتور</span>
          </div>
          <div class="text-base font-bold text-slate-900 dark:text-slate-100">
            {{ formatMaskedPrice(analytics.averageVisitValue, isMasked) }}
          </div>
        </div>
      </div>

      <!-- Top Spending Customers -->
      <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
        <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Award class="w-4 h-4 text-amber-500" />
          <span>مشتریان برتر بر اساس مجموع خرید</span>
        </h4>

        <div v-if="analytics.topProfiles.length > 0" class="space-y-2">
          <div
            v-for="(item, idx) in analytics.topProfiles"
            :key="item.profile.id"
            @click="emit('selectCustomer', item.profile.personId); emit('update:modelValue', false)"
            class="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-750 transition cursor-pointer"
          >
            <div class="flex items-center gap-2">
              <span
                class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                :class="idx === 0 ? 'bg-amber-400 text-amber-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'"
              >
                {{ toPersianDigits(idx + 1) }}
              </span>
              <span class="text-xs font-bold text-slate-900 dark:text-slate-100">
                {{ item.person?.name }}
              </span>
            </div>
            <span class="text-xs font-bold text-primary-700 dark:text-primary-300">
              {{ formatMaskedPrice(item.profile.totalSpent, isMasked) }}
            </span>
          </div>
        </div>

        <div v-else class="text-center py-4 text-xs text-slate-400 dark:text-slate-500">
          هنوز رکوردی ثبت نشده است.
        </div>
      </div>

      <!-- Most Popular Services -->
      <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
        <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Star class="w-4 h-4 text-primary-500" />
          <span>پرطرفدارترین خدمات و کالاها</span>
        </h4>

        <div v-if="analytics.topServices.length > 0" class="space-y-2">
          <div
            v-for="serv in analytics.topServices"
            :key="serv.serviceName"
            class="space-y-1"
          >
            <div class="flex items-center justify-between text-xs">
              <span class="font-medium text-slate-800 dark:text-slate-200">{{ serv.serviceName }}</span>
              <span class="text-[11px] text-slate-500 dark:text-slate-400">
                {{ toPersianDigits(serv.count) }} بار ({{ formatMaskedPrice(serv.revenue, isMasked) }})
              </span>
            </div>
            <!-- Simple relative bar -->
            <div class="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <div
                class="h-full bg-primary-600 rounded-full transition-all"
                :style="{
                  width: `${Math.min(100, Math.round((serv.count / (analytics.totalVisitsCount || 1)) * 100))}%`
                }"
              ></div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-4 text-xs text-slate-400 dark:text-slate-500">
          هنوز خدمتی ثبت نشده است.
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
