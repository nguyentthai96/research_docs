import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import './custom.css'
import TTSPlayer from './components/TTSPlayer.vue'
import { h } from 'vue'
import type { Theme } from 'vitepress'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(Layout, null, {
      'doc-after': () => h(TTSPlayer),
    })
  },
  enhanceApp({ app }) {
    app.component('TTSPlayer', TTSPlayer)
  },
} satisfies Theme
