<script setup lang="ts">
import type { NuxtTableClassNames, NuxtTableColumn, TableRow } from '../types/table'

const props = defineProps<{
  row: TableRow
  column: NuxtTableColumn
  rowKey: string | number
  value: unknown
  columnStyle: Record<string, string | undefined>
  classNames: NuxtTableClassNames
}>()
</script>

<template>
  <td
    :key="`${props.rowKey}-${props.column.key}`"
    :style="props.columnStyle"
    :class="[props.classNames.bodyCell, props.column.cellClassName]"
  >
    <component
      :is="props.column.cellComponent"
      v-if="props.column.cellComponent"
      :row="props.row"
      :column="props.column"
      :value="props.value"
    />
    <span v-else>{{ props.value }}</span>
  </td>
</template>
