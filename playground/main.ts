import { createVaporApp } from 'vue/vapor'

const modules = import.meta.glob<any>('./*.(vue|js)')
const mod = (modules[`.${location.pathname}.vue`] || modules['./App.vue'])()

mod.then(({ default: mod }) => {
  const app = createVaporApp(mod)
  app.mount('#app')

  // @ts-expect-error
  globalThis.unmount = () => {
    app.unmount()
  }
})
