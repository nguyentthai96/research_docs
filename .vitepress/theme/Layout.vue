<script setup>
import DefaultTheme from 'vitepress/theme'
import SidebarToggle from './SidebarToggle.vue'
import SidebarAutoCollapse from './SidebarAutoCollapse.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #sidebar-nav-before>
      <SidebarToggle />
      <SidebarAutoCollapse />
    </template>
  </Layout>
</template>
