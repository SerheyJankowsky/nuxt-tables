# @serhiitupilow/nuxt-table

Nuxt module that provides a single `NuxtTable` component with:

- sorting
- filtering
- column visibility manager
- column resize
- optional drag-and-drop column reordering
- class-based styling (no Tailwind classes in component templates)

## Install

Use any package manager:

```bash
npm i @serhiitupilow/nuxt-table
# or
yarn add @serhiitupilow/nuxt-table
# or
bun add @serhiitupilow/nuxt-table
# or
pnpm add @serhiitupilow/nuxt-table
```

## Nuxt config

```ts
export default defineNuxtConfig({
  modules: ["@serhiitupilow/nuxt-table"],
});
```

Optional module config:

```ts
export default defineNuxtConfig({
  modules: ["@serhiitupilow/nuxt-table"],
  nuxtTable: {
    injectDefaultStyles: true,
  },
});
```

## Usage

```vue
<script setup lang="ts">
import type { NuxtTableColumn } from "@serhiitupilow/nuxt-table/dist/runtime/types/table";

const columns: NuxtTableColumn[] = [
  { key: "id", label: "ID", sortable: true, filterable: true },
  { key: "name", label: "Name", sortable: true, filterable: true },
  { key: "status", label: "Status", sortable: true, filterable: true },
];

const rows = [
  { id: 1, name: "Alice", status: "active" },
  { id: 2, name: "Bob", status: "paused" },
];

function onColumnOrderChange(payload: {
  order: string[];
  movedKey: string;
  fromIndex: number;
  toIndex: number;
}) {
  console.log("new order", payload.order);
}
</script>

<template>
  <NuxtTable
    :columns="columns"
    :rows="rows"
    storage-key="users-table"
    :enable-column-dnd="true"
    @column-order-change="onColumnOrderChange"
  />
</template>
```

## Styling

`NuxtTable` uses semantic class names (like `nuxt-table__header-cell`) and receives a `classNames` prop for overrides.

You can style globally in your project CSS:

```css
.nuxt-table__header-cell {
  background: #f8fafc;
}
```

Or override class names from props:

```vue
<NuxtTable
  :columns="columns"
  :rows="rows"
  :class-names="{ table: 'my-table', headerCell: 'my-header-cell' }"
/>
```
