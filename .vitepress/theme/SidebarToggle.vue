<script setup>
import { ref, onMounted, watch } from 'vue'
import { useData, useRoute, withBase } from 'vitepress'

const { frontmatter } = useData()
const route = useRoute()

const STORAGE_KEY = 'sidebar-pinned'
const isPinned = ref(false)

onMounted(() => {
  // Read initial state
  isPinned.value = localStorage.getItem(STORAGE_KEY) === 'true'
  updateBodyClass()

  // Handle keyboard shortcut
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault()
      toggleSidebar()
    }
  })
})

// VitePress route changes might clear the body class, so we re-apply it
watch(() => route.path, () => {
  setTimeout(updateBodyClass, 50)
})

function updateBodyClass() {
  // Hide sidebar pinned state entirely if on home page
  if (frontmatter.value.layout === 'home') {
    document.body.classList.remove('sidebar-pinned')
    return
  }
  
  if (isPinned.value) {
    document.body.classList.add('sidebar-pinned')
  } else {
    document.body.classList.remove('sidebar-pinned')
  }
}

function toggleSidebar() {
  isPinned.value = !isPinned.value
  localStorage.setItem(STORAGE_KEY, String(isPinned.value))
  updateBodyClass()
}
</script>

<template>
  <div class="sidebar-toggle-btn-wrapper" v-if="frontmatter.layout !== 'home'">
    <button 
      class="sidebar-toggle-btn"
      :class="{ 'is-pinned': isPinned }"
      aria-label="Toggle sidebar"
      title="Pin/Unpin sidebar (Ctrl+B)"
      @click="toggleSidebar"
    >
      <div class="icon-wrapper">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m11 17 5-5-5-5"/>
          <path d="m18 17 5-5-5-5" opacity="0.5"/>
          <line x1="5" y1="17" x2="5" y2="7" opacity="0.5"/>
        </svg>
      </div>
      <span class="toggle-text">{{ isPinned ? 'Unpin' : 'Pin' }}</span>
    </button>
  </div>
</template>

<style scoped>
.sidebar-toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--vp-c-text-2);
  padding: 4px 8px;
  margin-left: 0;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.sidebar-toggle-btn:hover {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-brand-1);
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Base state (Unpinned) - points right */
.icon-wrapper svg {
  transition: all 0.3s ease;
}

/* Pinned state - points left */
.sidebar-toggle-btn.is-pinned .icon-wrapper {
  transform: rotate(180deg);
}

.sidebar-toggle-btn.is-pinned {
  color: var(--vp-c-brand-1);
}

.toggle-text {
  font-size: 13px;
  font-weight: 500;
  opacity: 0.7;
}

.sidebar-toggle-btn:hover .toggle-text {
  opacity: 1;
}
</style>

