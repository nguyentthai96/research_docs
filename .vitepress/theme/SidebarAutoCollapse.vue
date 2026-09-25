<script setup>
import { onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vitepress'

const route = useRoute()

/**
 * Auto-collapse logic:
 * - Find all top-level VPSidebarItem.level-0 elements
 * - If a group contains the active link (.is-active), expand it
 * - Otherwise, collapse it by clicking its caret
 */
function autoCollapseSidebar() {
  const groups = document.querySelectorAll('.VPSidebarItem.level-0.collapsible')
  
  groups.forEach((group) => {
    const hasActiveChild = group.querySelector('.is-active') !== null
    const hasActiveLink = group.classList.contains('has-active') || group.classList.contains('is-active')
    const isCollapsed = group.classList.contains('collapsed')
    const shouldBeActive = hasActiveChild || hasActiveLink

    if (shouldBeActive && isCollapsed) {
      // Expand this group — click its caret
      const caret = group.querySelector(':scope > .item .caret')
      if (caret) caret.click()
    } else if (!shouldBeActive && !isCollapsed) {
      // Collapse this group — click its caret
      const caret = group.querySelector(':scope > .item .caret')
      if (caret) caret.click()
    }
  })
}

onMounted(() => {
  // Initial run after DOM is ready
  setTimeout(autoCollapseSidebar, 300)
})

// Re-run on every route change
watch(() => route.path, () => {
  nextTick(() => {
    setTimeout(autoCollapseSidebar, 100)
  })
})
</script>

<template>
  <!-- Renderless component — no UI -->
</template>
