import {
  createVaporApp,
  // vaporInteropPlugin,
} from 'vue'

const modules = import.meta.glob<any>('./src/*.tsx')
const mod = (
  modules[`./src${location.pathname}.tsx`] || modules['./src/App.tsx']
)()

mod.then(({ default: mod }) => {
  const app = createVaporApp(mod)
    // app.use(vaporInteropPlugin).
    .mount('#app')

  // @ts-expect-error
  globalThis.unmount = () => {
    // @ts-expect-error
    app.unmount()
  }
})
