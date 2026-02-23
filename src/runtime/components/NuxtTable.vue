<script setup lang="ts">
import {
  computed,
  getCurrentInstance,
  onBeforeUpdate,
  shallowRef,
  toRef,
} from "vue";
import { useNuxtTable } from "../composables/useNuxtTable";
import type {
  NuxtTableClassNames,
  NuxtTableColumn,
  NuxtTableColumnOrderChange,
  NuxtTableManualFilterChange,
  NuxtTableManualSortChange,
  TableRow,
} from "../types/table";

const props = withDefaults(
  defineProps<{
    columns: NuxtTableColumn[];
    rows: TableRow[];
    enabledColumns?: string[];
    storageKey?: string;
    rowKey?: string | ((row: TableRow, index: number) => string | number);
    title?: string;
    showToolbar?: boolean;
    enableColumnDnd?: boolean;
    enableColumnResize?: boolean;
    classNames?: Partial<NuxtTableClassNames>;
  }>(),
  {
    storageKey: "nuxt-table",
    rowKey: "id",
    title: "Table",
    showToolbar: true,
    enableColumnDnd: false,
    enableColumnResize: true,
  },
);

const emit = defineEmits<{
  columnOrderChange: [payload: NuxtTableColumnOrderChange];
  manualSortChange: [payload: NuxtTableManualSortChange];
  manualFilterChange: [payload: NuxtTableManualFilterChange];
}>();
const instance = getCurrentInstance();
const vnodeProps = shallowRef<Record<string, unknown> | null>(
  (instance?.vnode.props as Record<string, unknown> | null | undefined) ?? null,
);

onBeforeUpdate(() => {
  vnodeProps.value =
    (instance?.vnode.props as Record<string, unknown> | null | undefined) ??
    null;
});

const hasManualSortChangeListener = computed(() => {
  return Boolean(vnodeProps.value?.onManualSortChange);
});

const hasManualFilterChangeListener = computed(() => {
  return Boolean(vnodeProps.value?.onManualFilterChange);
});

const defaultClassNames: NuxtTableClassNames = {
  root: "nuxt-table",
  toolbar: "nuxt-table__toolbar",
  toolbarTitle: "nuxt-table__toolbar-title",
  toolbarActions: "nuxt-table__toolbar-actions",
  toolbarButton: "nuxt-table__toolbar-button",
  columnManager: "nuxt-table__column-manager",
  columnManagerTitle: "nuxt-table__column-manager-title",
  columnManagerItem: "nuxt-table__column-manager-item",
  tableWrapper: "nuxt-table__wrapper",
  table: "nuxt-table__table",
  tableHead: "nuxt-table__head",
  tableBody: "nuxt-table__body",
  bodyRow: "nuxt-table__body-row",
  emptyCell: "nuxt-table__empty-cell",
  headerCell: "nuxt-table__header-cell",
  headerCellDragSource: "nuxt-table__header-cell--drag-source",
  headerCellDragOver: "nuxt-table__header-cell--drag-over",
  headerTop: "nuxt-table__header-top",
  headerLabel: "nuxt-table__header-label",
  sortButton: "nuxt-table__sort-button",
  filterInput: "nuxt-table__filter-input",
  resizeHandle: "nuxt-table__resize-handle",
  bodyCell: "nuxt-table__body-cell",
};

const mergedClassNames = computed<NuxtTableClassNames>(() => {
  return {
    ...defaultClassNames,
    ...(props.classNames ?? {}),
  };
});

const {
  orderedColumns,
  visibleColumns,
  sortedRows,
  filters,
  dragSourceColumnKey,
  dragOverColumnKey,
  getSortDirection,
  toggleSort,
  setFilter,
  onHeaderDragStart,
  onHeaderDragOver,
  onHeaderDragLeave,
  onHeaderDrop,
  onHeaderDragEnd,
  getColumnStyle,
  startColumnResize,
  setHeaderElement,
  resolveDisplayValue,
  resolveRowKey,
} = useNuxtTable({
  columns: toRef(props, "columns"),
  rows: toRef(props, "rows"),
  storageKey: toRef(props, "storageKey"),
  rowKey: toRef(props, "rowKey"),
  enableColumnDnd: toRef(props, "enableColumnDnd"),
  isManualSortMode: hasManualSortChangeListener,
  isManualFilterMode: hasManualFilterChangeListener,
  onColumnOrderChange: (payload) => {
    emit("columnOrderChange", payload);
  },
  onManualSortChange: (payload) => {
    emit("manualSortChange", payload);
  },
  onManualFilterChange: (payload) => {
    emit("manualFilterChange", payload);
  },
});

const displayedColumns = computed(() => {
  if (!props.enabledColumns) {
    return visibleColumns.value;
  }

  const enabledKeySet = new Set(props.enabledColumns);
  return orderedColumns.value.filter((column) => enabledKeySet.has(column.key));
});

const keyedRows = computed(() => {
  return sortedRows.value.map((row, rowIndex) => ({
    row,
    key: resolveRowKey(row, rowIndex),
  }));
});
</script>

<template>
  <div :class="mergedClassNames.root">
    <div :class="mergedClassNames.tableWrapper">
      <table :class="mergedClassNames.table">
        <thead :class="mergedClassNames.tableHead">
          <tr>
            <NuxtTableHeaderCell
              v-for="column in displayedColumns"
              :key="column.key"
              :column="column"
              :filter-value="filters[column.key]"
              :column-style="getColumnStyle(column.key)"
              :sort-direction="getSortDirection(column.key)"
              :is-drag-source="dragSourceColumnKey === column.key"
              :is-drag-over="dragOverColumnKey === column.key"
              :is-dnd-enabled="props.enableColumnDnd"
              :is-resize-enabled="props.enableColumnResize"
              :class-names="mergedClassNames"
              :set-header-element="setHeaderElement"
              @drag-start="onHeaderDragStart"
              @drag-over="onHeaderDragOver"
              @drag-leave="onHeaderDragLeave"
              @drop="onHeaderDrop"
              @drag-end="onHeaderDragEnd"
              @toggle-sort="toggleSort"
              @set-filter="setFilter"
              @resize-start="startColumnResize"
            />
          </tr>
        </thead>
        <tbody :class="mergedClassNames.tableBody">
          <tr
            v-for="rowEntry in keyedRows"
            :key="rowEntry.key"
            :class="mergedClassNames.bodyRow"
          >
            <NuxtTableBodyCell
              v-for="column in displayedColumns"
              :key="`${rowEntry.key}-${column.key}`"
              :row="rowEntry.row"
              :row-key="rowEntry.key"
              :column="column"
              :value="resolveDisplayValue(rowEntry.row, column)"
              :column-style="getColumnStyle(column.key)"
              :class-names="mergedClassNames"
            />
          </tr>
          <tr v-if="keyedRows.length === 0">
            <td
              :colspan="Math.max(displayedColumns.length, 1)"
              :class="mergedClassNames.emptyCell"
            >
              No rows match the current filters.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
