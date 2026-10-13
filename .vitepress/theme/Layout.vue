<script setup>
import DefaultTheme from 'vitepress/theme'
import SidebarToggle from './SidebarToggle.vue'
import SidebarAutoCollapse from './SidebarAutoCollapse.vue'
import TTSPlayer from './components/TTSPlayer.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #sidebar-nav-before>
      <SidebarToggle />
      <SidebarAutoCollapse />
    </template>
    <template #doc-after>
      <TTSPlayer />
    </template>
  </Layout>
</template>
