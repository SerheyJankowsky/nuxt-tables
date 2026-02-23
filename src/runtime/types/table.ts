import type { Component, Ref } from "vue";

export type TableRow = Record<string, any>;
export type ValueResolver = string | ((row: TableRow) => unknown);

export interface NuxtTableColumn {
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

export interface NuxtTableColumnOrderChange {
  order: string[];
  movedKey: string;
  fromIndex: number;
  toIndex: number;
}

export interface NuxtTableManualSortChange {
  columnKey: string;
  direction: "asc" | "desc" | null;
  column: NuxtTableColumn;
  rows: TableRow[];
  filters: Record<string, unknown>;
}

export interface NuxtTableManualFilterChange {
  columnKey: string;
  value: unknown;
  column: NuxtTableColumn;
  rows: TableRow[];
  filters: Record<string, unknown>;
}

export interface NuxtTableClassNames {
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

export interface UseNuxtTableOptions {
  columns: Ref<NuxtTableColumn[]>;
  rows: Ref<TableRow[]>;
  storageKey: Ref<string>;
  rowKey: Ref<string | ((row: TableRow, index: number) => string | number)>;
  enableColumnDnd: Ref<boolean>;
  onColumnOrderChange?: (payload: NuxtTableColumnOrderChange) => void;
  onManualSortChange?: (payload: NuxtTableManualSortChange) => void;
  onManualFilterChange?: (payload: NuxtTableManualFilterChange) => void;
}
