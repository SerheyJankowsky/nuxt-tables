import {
  addComponentsDir,
  addImportsDir,
  createResolver,
  defineNuxtModule,
} from "@nuxt/kit";

export interface ModuleOptions {
  injectDefaultStyles: boolean;
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "@serhiitupilow/nuxt-table",
    configKey: "nuxtTable",
  },
  defaults: {
    injectDefaultStyles: true,
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);

    addComponentsDir({
      path: resolver.resolve("./runtime/components"),
      prefix: "",
      pathPrefix: false,
      global: true,
      extensions: ["vue"],
      transpile: true,
    });

    addImportsDir(resolver.resolve("./runtime/composables"));

    if (options.injectDefaultStyles) {
      const stylesPath = resolver.resolve("./runtime/assets/styles.css");

      if (!nuxt.options.css.includes(stylesPath)) {
        nuxt.options.css.push(stylesPath);
      }
    }
  },
});
