<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useNuxtTable } from '../composables/useNuxtTable'
import type {
  NuxtTableClassNames,
  NuxtTableColumn,
  NuxtTableColumnOrderChange,
  TableRow,
} from '../types/table'

const props = withDefaults(
  defineProps<{
    columns: NuxtTableColumn[]
    rows: TableRow[]
    storageKey?: string
    rowKey?: string | ((row: TableRow, index: number) => string | number)
    title?: string
    showToolbar?: boolean
    enableColumnDnd?: boolean
    enableColumnResize?: boolean
    classNames?: Partial<NuxtTableClassNames>
  }>(),
  {
    storageKey: 'nuxt-table',
    rowKey: 'id',
    title: 'Table',
    showToolbar: true,
    enableColumnDnd: false,
    enableColumnResize: true,
  },
)

const emit = defineEmits<{
  columnOrderChange: [payload: NuxtTableColumnOrderChange]
}>()

const defaultClassNames: NuxtTableClassNames = {
  root: 'nuxt-table',
  toolbar: 'nuxt-table__toolbar',
  toolbarTitle: 'nuxt-table__toolbar-title',
  toolbarActions: 'nuxt-table__toolbar-actions',
  toolbarButton: 'nuxt-table__toolbar-button',
  columnManager: 'nuxt-table__column-manager',
  columnManagerTitle: 'nuxt-table__column-manager-title',
  columnManagerItem: 'nuxt-table__column-manager-item',
  tableWrapper: 'nuxt-table__wrapper',
  table: 'nuxt-table__table',
  tableHead: 'nuxt-table__head',
  tableBody: 'nuxt-table__body',
  bodyRow: 'nuxt-table__body-row',
  emptyCell: 'nuxt-table__empty-cell',
  headerCell: 'nuxt-table__header-cell',
  headerCellDragSource: 'nuxt-table__header-cell--drag-source',
  headerCellDragOver: 'nuxt-table__header-cell--drag-over',
  headerTop: 'nuxt-table__header-top',
  headerLabel: 'nuxt-table__header-label',
  sortButton: 'nuxt-table__sort-button',
  filterInput: 'nuxt-table__filter-input',
  resizeHandle: 'nuxt-table__resize-handle',
  bodyCell: 'nuxt-table__body-cell',
}

const mergedClassNames = computed<NuxtTableClassNames>(() => {
  return {
    ...defaultClassNames,
    ...(props.classNames ?? {}),
  }
})

const {
  orderedColumns,
  visibleColumns,
  sortedRows,
  filters,
  isColumnManagerOpen,
  enabledColumnKeys,
  dragSourceColumnKey,
  dragOverColumnKey,
  getSortDirection,
  toggleSort,
  setFilter,
  clearAllFilters,
  toggleColumn,
  resetColumns,
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
  columns: toRef(props, 'columns'),
  rows: toRef(props, 'rows'),
  storageKey: toRef(props, 'storageKey'),
  rowKey: toRef(props, 'rowKey'),
  enableColumnDnd: toRef(props, 'enableColumnDnd'),
  onColumnOrderChange: (payload) => {
    emit('columnOrderChange', payload)
  },
})
</script>

<template>
  <div :class="mergedClassNames.root">
    <div v-if="props.showToolbar" :class="mergedClassNames.toolbar">
      <h2 :class="mergedClassNames.toolbarTitle">{{ props.title }}</h2>

      <div :class="mergedClassNames.toolbarActions">
        <button
          type="button"
          :class="mergedClassNames.toolbarButton"
          @click="isColumnManagerOpen = !isColumnManagerOpen"
        >
          Columns
        </button>
        <button
          type="button"
          :class="mergedClassNames.toolbarButton"
          @click="clearAllFilters"
        >
          Clear Filters
        </button>
        <button
          type="button"
          :class="mergedClassNames.toolbarButton"
          @click="resetColumns"
        >
          Reset Columns
        </button>

        <div
          v-if="isColumnManagerOpen"
          :class="mergedClassNames.columnManager"
        >
          <p :class="mergedClassNames.columnManagerTitle">Enable Columns</p>
          <label
            v-for="column in orderedColumns"
            :key="`manager-${column.key}`"
            :class="mergedClassNames.columnManagerItem"
          >
            <input
              type="checkbox"
              :checked="enabledColumnKeys.includes(column.key)"
              @change="toggleColumn(column.key)"
            >
            <span>{{ column.label }}</span>
          </label>
        </div>
      </div>
    </div>

    <div :class="mergedClassNames.tableWrapper">
      <table :class="mergedClassNames.table">
        <thead :class="mergedClassNames.tableHead">
          <tr>
            <NuxtTableHeaderCell
              v-for="column in visibleColumns"
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
            v-for="(row, rowIndex) in sortedRows"
            :key="resolveRowKey(row, rowIndex)"
            :class="mergedClassNames.bodyRow"
          >
            <NuxtTableBodyCell
              v-for="column in visibleColumns"
              :key="`${resolveRowKey(row, rowIndex)}-${column.key}`"
              :row="row"
              :row-key="resolveRowKey(row, rowIndex)"
              :column="column"
              :value="resolveDisplayValue(row, column)"
              :column-style="getColumnStyle(column.key)"
              :class-names="mergedClassNames"
            />
          </tr>
          <tr v-if="sortedRows.length === 0">
            <td
              :colspan="Math.max(visibleColumns.length, 1)"
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
