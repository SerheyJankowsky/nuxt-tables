import {
  addComponentsDir,
  addCss,
  addImportsDir,
  createResolver,
  defineNuxtModule,
} from '@nuxt/kit'

export interface ModuleOptions {
  injectDefaultStyles: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-table',
    configKey: 'nuxtTable',
  },
  defaults: {
    injectDefaultStyles: true,
  },
  setup(options) {
    const resolver = createResolver(import.meta.url)

    addComponentsDir({
      path: resolver.resolve('./runtime/components'),
      prefix: '',
      pathPrefix: false,
      global: true,
      extensions: ['vue'],
      transpile: true,
    })

    addImportsDir(resolver.resolve('./runtime/composables'))

    if (options.injectDefaultStyles) {
      addCss(resolver.resolve('./runtime/assets/styles.css'))
    }
  },
})
