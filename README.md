# @serhiitupilow/nuxt-table

A Nuxt module that registers a global `NuxtTable` component for data tables with:

- client-side sorting
- client-side filtering
- optional drag-and-drop column reordering
- optional column resize
- persisted column order/visibility/widths in `localStorage`
- configurable cell/header/filter rendering

## Requirements

- `nuxt >= 3.11.0`
- `vue >= 3.4.0`

## Installation

```bash
npm i @serhiitupilow/nuxt-table
# or
pnpm add @serhiitupilow/nuxt-table
# or
yarn add @serhiitupilow/nuxt-table
# or
bun add @serhiitupilow/nuxt-table
```

## Nuxt setup

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@serhiitupilow/nuxt-table"],
});
```

### Module options

```ts
export default defineNuxtConfig({
  modules: ["@serhiitupilow/nuxt-table"],
  nuxtTable: {
    injectDefaultStyles: true,
  },
});
```

| Option                | Type      | Default | Description                                                                                      |
| --------------------- | --------- | ------- | ------------------------------------------------------------------------------------------------ |
| `injectDefaultStyles` | `boolean` | `true`  | Injects bundled CSS from the module runtime. Set to `false` if you fully style classes yourself. |

## Quick start

```vue
<script setup lang="ts">
import type { NuxtTableColumn } from "@serhiitupilow/nuxt-table/runtime";

type UserRow = {
  id: number;
  name: string;
  status: "active" | "paused";
  createdAt: string;
};

const columns: NuxtTableColumn[] = [
  { key: "id", label: "ID", sortable: true, filterable: true },
  { key: "name", label: "Name", sortable: true, filterable: true },
  { key: "status", label: "Status", sortable: true, filterable: true },
  {
    key: "createdAt",
    label: "Created",
    sortable: true,
    formatter: (value) => new Date(String(value)).toLocaleDateString(),
  },
];

const rows: UserRow[] = [
  { id: 1, name: "Alice", status: "active", createdAt: "2026-02-01" },
  { id: 2, name: "Bob", status: "paused", createdAt: "2026-02-14" },
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

## Public runtime exports

```ts
import {
  useNuxtTable,
  type NuxtTableClassNames,
  type NuxtTableColumn,
  type NuxtTableColumnOrderChange,
  type NuxtTableManualFilterChange,
  type NuxtTableManualSortChange,
  type TableRow,
  type UseNuxtTableOptions,
  type ValueResolver,
} from "@serhiitupilow/nuxt-table/runtime";
```

## `NuxtTable` component API

### Props

| Prop                 | Type                                         | Default        | Description                                                             |
| -------------------- | -------------------------------------------- | -------------- | ----------------------------------------------------------------------- |
| `columns`            | `NuxtTableColumn[]`                          | required       | Column definitions.                                                     |
| `rows`               | `TableRow[]`                                 | required       | Data rows.                                                              |
| `enabledColumns`     | `string[]`                                   | `undefined`    | Explicitly controls visible columns (in the current ordered sequence).  |
| `storageKey`         | `string`                                     | `"nuxt-table"` | Prefix for persisted table UI state in `localStorage`.                  |
| `rowKey`             | `string \| (row, index) => string \| number` | `"id"`         | Unique key resolver for row rendering.                                  |
| `title`              | `string`                                     | `"Table"`      | Legacy prop kept for compatibility (not currently rendered in UI).      |
| `showToolbar`        | `boolean`                                    | `true`         | Legacy prop kept for compatibility (toolbar is not currently rendered). |
| `enableColumnDnd`    | `boolean`                                    | `false`        | Enables drag-and-drop header reordering.                                |
| `enableColumnResize` | `boolean`                                    | `true`         | Enables resize handle on header cells.                                  |
| `classNames`         | `Partial<NuxtTableClassNames>`               | `{}`           | Class overrides for semantic class hooks.                               |

### Events

| Event                  | Payload                       | Description                                                                        |
| ---------------------- | ----------------------------- | ---------------------------------------------------------------------------------- |
| `column-order-change`  | `NuxtTableColumnOrderChange`  | Emitted after successful drag-and-drop reorder.                                    |
| `manual-sort-change`   | `NuxtTableManualSortChange`   | Emitted when sorting is changed for a column with `sortFunction`.                  |
| `manual-filter-change` | `NuxtTableManualFilterChange` | Emitted when filter value changes for a column with `filterFunction` / `filterFn`. |

### Behavior notes

- Filtering is applied before sorting.
- Sorting cycles by click: `asc -> desc -> off`.
- If a column has `filterFunction` / `filterFn`, built-in filtering is disabled for that column and table emits `manual-filter-change`.
- If a column has `sortFunction`, built-in sorting is disabled for that column and table emits `manual-sort-change`.
- Column width has a minimum of `140px`.
- Empty state text: `No rows match the current filters.`
- Rendering is table-only (no built-in toolbar/summary controls).
- DnD headers use cursor states: `grab` and `grabbing`.

## Column definition (`NuxtTableColumn`)

```ts
type ValueResolver = string | ((row: TableRow) => unknown);

interface NuxtTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  sortAscComponent?: Component;
  sortDescComponent?: Component;
  sortDefaultComponent?: Component;
  sortKey?: ValueResolver;
  sortFunction?: (
    leftRow: TableRow,
    rightRow: TableRow,
    column: NuxtTableColumn,
    tableRows: TableRow[],
    direction: "asc" | "desc",
  ) => number;
  filterKey?: ValueResolver;
  formatter?: (value: unknown, row: TableRow) => string;
  filterFunction?: (
    row: TableRow,
    filterValue: unknown,
    column: NuxtTableColumn,
    tableRows: TableRow[],
  ) => boolean;
  filterFn?: (
    row: TableRow,
    filterValue: unknown,
    column: NuxtTableColumn,
    tableRows: TableRow[],
  ) => boolean;
  cellComponent?: Component;
  filterComponent?: Component;
  headerClassName?: string;
  cellClassName?: string;
}
```

### Field details

- `key`: primary accessor path for display value. Supports dot notation through resolvers (for example: `user.profile.name`) when used by `sortKey`/`filterKey`.
- `sortKey`: alternate accessor/function used for sorting.
- `sortFunction`: enables manual sort mode for that column. Table emits `manual-sort-change` and does not sort rows automatically.
- `sortAscComponent` / `sortDescComponent` / `sortDefaultComponent`: optional sort button content per state. If not provided, defaults are `Asc`, `Desc`, and `Sort`.
- `filterKey`: alternate accessor/function used for default text filtering.
- `formatter`: transforms display value for default body rendering (`<span>{{ value }}</span>`).
- `filterFunction`: enables manual filter mode for that column. Table emits `manual-filter-change` and does not filter rows automatically.
- `filterFn`: legacy alias for `filterFunction` (same manual behavior).
- `cellComponent`: custom body renderer receives `row`, `column`, and `value`.
- `filterComponent`: custom header filter renderer receives `modelValue` and `column`, and should emit `update:model-value`.

## Persistence model

State is persisted per `storageKey` in `localStorage` with keys:

- `${storageKey}:order`
- `${storageKey}:enabledColumns`
- `${storageKey}:widths`

Persisted values are validated against current `columns`; unknown keys are ignored.

## Styling

The component uses semantic class hooks. You can:

1. use injected default styles, and/or
2. override classes via `classNames`, and/or
3. provide your own global CSS.

### Default class keys (`NuxtTableClassNames`)

```ts
interface NuxtTableClassNames {
  root: string;
  toolbar: string;
  toolbarTitle: string;
  toolbarActions: string;
  toolbarButton: string;
  columnManager: string;
  columnManagerTitle: string;
  columnManagerItem: string;
  tableWrapper: string;
  table: string;
  tableHead: string;
  tableBody: string;
  bodyRow: string;
  emptyCell: string;
  headerCell: string;
  headerCellDragSource: string;
  headerCellDragOver: string;
  headerTop: string;
  headerLabel: string;
  sortButton: string;
  filterInput: string;
  resizeHandle: string;
  bodyCell: string;
}
```

> Some toolbar-related class keys remain in the public type for compatibility, even though the current component template renders only the table.

### `classNames` example

```vue
<NuxtTable
  :columns="columns"
  :rows="rows"
  :class-names="{
    table: 'my-table',
    headerCell: 'my-header-cell',
    bodyCell: 'my-body-cell',
    filterInput: 'my-filter-input',
  }"
/>
```

## Advanced examples

### Enable / disable visible columns

Use `enabledColumns` to control what is rendered.

```vue
<script setup lang="ts">
const enabledColumns = ref<string[]>(["id", "name", "status"]);

function toggleStatusColumn() {
  if (enabledColumns.value.includes("status")) {
    enabledColumns.value = enabledColumns.value.filter(
      (key) => key !== "status",
    );
    return;
  }

  enabledColumns.value = [...enabledColumns.value, "status"];
}
</script>

<template>
  <button type="button" @click="toggleStatusColumn">
    Toggle status column
  </button>

  <NuxtTable
    :columns="columns"
    :rows="rows"
    :enabled-columns="enabledColumns"
  />
</template>
```

### Custom sort state components (ASC / DESC / default)

```vue
<!-- SortAsc.vue -->
<template><span>↑ ASC</span></template>

<!-- SortDesc.vue -->
<template><span>↓ DESC</span></template>

<!-- SortIdle.vue -->
<template><span>↕ SORT</span></template>
```

```ts
import SortAsc from "~/components/SortAsc.vue";
import SortDesc from "~/components/SortDesc.vue";
import SortIdle from "~/components/SortIdle.vue";

const columns: NuxtTableColumn[] = [
  {
    key: "name",
    label: "Name",
    sortable: true,
    sortAscComponent: SortAsc,
    sortDescComponent: SortDesc,
    sortDefaultComponent: SortIdle,
  },
];
```

If these components are not provided, the table automatically uses the default labels.

### Detailed `manual-filter-change` and `manual-sort-change` flow

When `filterFunction` / `sortFunction` is set, table switches that column to manual mode and emits `manual-filter-change` / `manual-sort-change`. You control final dataset in parent component.

```vue
<script setup lang="ts">
import { computed, ref } from "vue";
import type {
  NuxtTableColumn,
  NuxtTableManualFilterChange,
  NuxtTableManualSortChange,
} from "@serhiitupilow/nuxt-table/runtime";

type TicketRow = {
  id: number;
  title: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "todo" | "in_progress" | "done";
  createdAt: string;
};

const allRows = ref<TicketRow[]>([
  {
    id: 1,
    title: "Fix auth flow",
    priority: "high",
    status: "in_progress",
    createdAt: "2026-02-18",
  },
  {
    id: 2,
    title: "Write docs",
    priority: "low",
    status: "done",
    createdAt: "2026-02-10",
  },
  {
    id: 3,
    title: "Release v1",
    priority: "critical",
    status: "todo",
    createdAt: "2026-02-20",
  },
]);

const columns: NuxtTableColumn[] = [
  { key: "id", label: "ID", sortable: true },
  { key: "title", label: "Title", sortable: true, filterable: true },
  {
    key: "status",
    label: "Status",
    filterable: true,
    filterFunction: () => true,
  },
  {
    key: "priority",
    label: "Priority",
    sortable: true,
    sortFunction: () => 0,
  },
];

const manualStatusFilter = ref<string>("");
const manualSort = ref<{ key: string; direction: "asc" | "desc" | null }>({
  key: "",
  direction: null,
});

const rows = computed(() => {
  const statusFiltered = allRows.value.filter((row) => {
    if (!manualStatusFilter.value) {
      return true;
    }

    return row.status === manualStatusFilter.value;
  });

  if (manualSort.value.key !== "priority" || !manualSort.value.direction) {
    return statusFiltered;
  }

  const rank: Record<TicketRow["priority"], number> = {
    low: 0,
    medium: 1,
    high: 2,
    critical: 3,
  };

  const directionMultiplier = manualSort.value.direction === "asc" ? 1 : -1;

  return [...statusFiltered].sort((left, right) => {
    return (rank[left.priority] - rank[right.priority]) * directionMultiplier;
  });
});

function onManualFilterChange(payload: NuxtTableManualFilterChange) {
  if (payload.columnKey !== "status") {
    return;
  }

  manualStatusFilter.value = String(payload.value ?? "").trim();
}

function onManualSortChange(payload: NuxtTableManualSortChange) {
  manualSort.value = {
    key: payload.columnKey,
    direction: payload.direction,
  };
}
</script>

<template>
  <NuxtTable
    :columns="columns"
    :rows="rows"
    @manual-filter-change="onManualFilterChange"
    @manual-sort-change="onManualSortChange"
  />
</template>
```

Notes:

- In manual mode, the table does not transform rows for that column; you pass already transformed `rows` from outside.
- Use payload `columnKey`, `value`, `direction`, `rows`, and `filters` from events to build server/client-side query logic.
- `filterFn` remains supported as a legacy alias, but `filterFunction` is preferred.

### Server-side `manual-filter-change` / `manual-sort-change` example

Use manual events to request data from backend and pass ready rows back to table.

```vue
<script setup lang="ts">
import { ref } from "vue";
import type {
  NuxtTableColumn,
  NuxtTableManualFilterChange,
  NuxtTableManualSortChange,
} from "@serhiitupilow/nuxt-table/runtime";

type UserRow = {
  id: number;
  name: string;
  status: "active" | "paused";
  createdAt: string;
};

const rows = ref<UserRow[]>([]);
const loading = ref(false);

const query = ref<{
  page: number;
  pageSize: number;
  status: string;
  sortKey: string;
  sortDirection: "asc" | "desc" | "";
}>({
  page: 1,
  pageSize: 20,
  status: "",
  sortKey: "",
  sortDirection: "",
});

const columns: NuxtTableColumn[] = [
  { key: "id", label: "ID", sortable: true },
  { key: "name", label: "Name", sortable: true, filterable: true },
  {
    key: "status",
    label: "Status",
    filterable: true,
    filterFunction: () => true,
  },
  {
    key: "createdAt",
    label: "Created",
    sortable: true,
    sortFunction: () => 0,
  },
];

async function fetchRows() {
  loading.value = true;

  try {
    const data = await $fetch<UserRow[]>("/api/users", {
      query: {
        page: query.value.page,
        pageSize: query.value.pageSize,
        status: query.value.status,
        sortKey: query.value.sortKey,
        sortDirection: query.value.sortDirection,
      },
    });

    rows.value = data;
  } finally {
    loading.value = false;
  }
}

function onManualFilterChange(payload: NuxtTableManualFilterChange) {
  if (payload.columnKey === "status") {
    query.value.status = String(payload.value ?? "").trim();
    query.value.page = 1;
  }

  fetchRows();
}

function onManualSortChange(payload: NuxtTableManualSortChange) {
  query.value.sortKey = payload.columnKey;
  query.value.sortDirection = payload.direction ?? "";
  query.value.page = 1;

  fetchRows();
}

await fetchRows();
</script>

<template>
  <NuxtTable
    :columns="columns"
    :rows="rows"
    @manual-filter-change="onManualFilterChange"
    @manual-sort-change="onManualSortChange"
  />

  <p v-if="loading">Loading...</p>
</template>
```

What happens here:

- `filterFunction` and `sortFunction` switch corresponding columns to manual mode.
- Table emits `manual-filter-change` / `manual-sort-change` instead of transforming `rows` internally.
- Parent updates query params, calls API, and passes backend result as new `rows`.

### Custom filter component

```vue
<!-- StatusFilter.vue -->
<script setup lang="ts">
const props = defineProps<{
  modelValue: unknown;
  column: { key: string; label: string };
}>();

const emit = defineEmits<{
  "update:model-value": [value: string];
}>();
</script>

<template>
  <select
    :value="String(props.modelValue ?? '')"
    @change="
      emit('update:model-value', ($event.target as HTMLSelectElement).value)
    "
  >
    <option value="">All</option>
    <option value="active">Active</option>
    <option value="paused">Paused</option>
  </select>
</template>
```

```ts
const columns: NuxtTableColumn[] = [
  {
    key: "status",
    label: "Status",
    filterable: true,
    filterComponent: StatusFilter,
  },
];
```

### Custom cell component

```vue
<!-- NameCell.vue -->
<script setup lang="ts">
const props = defineProps<{
  row: Record<string, unknown>;
  value: unknown;
}>();
</script>

<template>
  <strong>{{ props.value }}</strong>
</template>
```

```ts
const columns: NuxtTableColumn[] = [
  {
    key: "name",
    label: "Name",
    cellComponent: NameCell,
  },
];
```

## Troubleshooting

- DnD does nothing: ensure `enableColumnDnd` is `true`.
- Filters do nothing: ensure column has `filterable: true` or a `filterComponent` that emits `update:model-value`.
- Unexpected row keys: set a stable `rowKey` function for datasets without `id`.
- Style conflicts: disable `injectDefaultStyles` and provide full custom CSS.

## License

MIT
