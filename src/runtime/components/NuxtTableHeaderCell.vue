<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import type { NuxtTableClassNames, NuxtTableColumn } from '../types/table'

const props = defineProps<{
  column: NuxtTableColumn
  filterValue: unknown
  columnStyle: Record<string, string | undefined>
  sortDirection: 'asc' | 'desc' | null
  isDragSource: boolean
  isDragOver: boolean
  isDndEnabled: boolean
  isResizeEnabled: boolean
  classNames: NuxtTableClassNames
  setHeaderElement: (
    columnKey: string,
    element: Element | ComponentPublicInstance | null,
  ) => void
}>()

const emit = defineEmits<{
  dragStart: [columnKey: string]
  dragOver: [columnKey: string]
  dragLeave: [columnKey: string]
  drop: [columnKey: string]
  dragEnd: []
  toggleSort: [column: NuxtTableColumn]
  setFilter: [columnKey: string, value: unknown]
  resizeStart: [event: MouseEvent, columnKey: string]
}>()
</script>

<template>
  <th
    :ref="(element) => props.setHeaderElement(props.column.key, element)"
    :style="props.columnStyle"
    :class="[
      props.classNames.headerCell,
      props.column.headerClassName,
      props.isDragSource ? props.classNames.headerCellDragSource : '',
      props.isDragOver && !props.isDragSource ? props.classNames.headerCellDragOver : '',
    ]"
    :draggable="props.isDndEnabled"
    @dragstart="props.isDndEnabled ? emit('dragStart', props.column.key) : undefined"
    @dragover.prevent="props.isDndEnabled ? emit('dragOver', props.column.key) : undefined"
    @dragenter.prevent="props.isDndEnabled ? emit('dragOver', props.column.key) : undefined"
    @dragleave="props.isDndEnabled ? emit('dragLeave', props.column.key) : undefined"
    @drop="props.isDndEnabled ? emit('drop', props.column.key) : undefined"
    @dragend="props.isDndEnabled ? emit('dragEnd') : undefined"
  >
    <div :class="props.classNames.headerTop">
      <span :class="props.classNames.headerLabel">{{ props.column.label }}</span>
      <button
        v-if="props.column.sortable"
        type="button"
        :class="props.classNames.sortButton"
        @click="emit('toggleSort', props.column)"
      >
        <span v-if="props.sortDirection === 'asc'">Asc</span>
        <span v-else-if="props.sortDirection === 'desc'">Desc</span>
        <span v-else>Sort</span>
      </button>
    </div>

    <component
      :is="props.column.filterComponent"
      v-if="props.column.filterComponent"
      :model-value="props.filterValue"
      :column="props.column"
      @update:model-value="emit('setFilter', props.column.key, $event)"
    />
    <input
      v-else-if="props.column.filterable"
      :value="String(props.filterValue ?? '')"
      type="text"
      :class="props.classNames.filterInput"
      :placeholder="`Filter ${props.column.label}`"
      @input="emit('setFilter', props.column.key, ($event.target as HTMLInputElement).value)"
    >

    <div
      v-if="props.isResizeEnabled"
      :class="props.classNames.resizeHandle"
      @mousedown.stop.prevent="emit('resizeStart', $event, props.column.key)"
    />
  </th>
</template>
