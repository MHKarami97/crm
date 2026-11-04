<script setup lang="ts">
import { useRoute } from 'vue-router'
import { Users, Network, Settings } from 'lucide-vue-next'

const route = useRoute()

const navItems = [
  {
    path: '/people',
    name: 'People',
    label: 'مخاطبان',
    icon: Users,
  },
  {
    path: '/graph',
    name: 'Graph',
    label: 'گراف روابط',
    icon: Network,
  },
  {
    path: '/settings',
    name: 'Settings',
    label: 'تنظیمات',
    icon: Settings,
  },
]
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 bottom-nav-safe transition-all"
  >
    <div class="max-w-md mx-auto px-4 flex items-center justify-around h-14">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        :class="[
          'flex flex-col items-center justify-center min-w-[64px] min-h-[48px] px-2 py-1 rounded-xl transition-all',
          route.path.startsWith(item.path)
            ? 'text-primary-700 dark:text-primary-400 font-bold scale-105'
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium',
        ]"
      >
        <component
          :is="item.icon"
          class="w-5 h-5 mb-0.5 transition-transform"
          :stroke-width="route.path.startsWith(item.path) ? 2.25 : 1.75"
        />
        <span class="text-[11px] leading-tight">
          {{ item.label }}
        </span>
      </router-link>
    </div>
  </nav>
</template>
