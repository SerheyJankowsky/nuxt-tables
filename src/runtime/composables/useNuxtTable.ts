import type { ComponentPublicInstance } from "vue";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import type {
  NuxtTableColumn,
  NuxtTableColumnOrderChange,
  TableRow,
  UseNuxtTableOptions,
  ValueResolver,
} from "../types/table";

const MIN_COLUMN_WIDTH = 140;

export function useNuxtTable(options: UseNuxtTableOptions) {
  const columnOrder = ref<string[]>([]);
  const enabledColumnKeys = ref<string[]>([]);
  const sortState = ref<{ key: string; direction: "asc" | "desc" } | null>(
    null,
  );
  const filters = ref<Record<string, unknown>>({});
  const dragSourceColumnKey = ref<string | null>(null);
  const dragOverColumnKey = ref<string | null>(null);
  const hasLoadedPersistence = ref(false);
  const headerElements = ref<Record<string, HTMLTableCellElement | null>>({});
  const columnWidths = ref<Record<string, number>>({});
  const activeResize = ref<{
    columnKey: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  const availableColumnKeys = computed(() =>
    options.columns.value.map((column) => column.key),
  );

  const columnsByKey = computed(() => {
    return new Map(options.columns.value.map((column) => [column.key, column]));
  });

  const orderedColumns = computed(() => {
    return columnOrder.value
      .map((columnKey) => columnsByKey.value.get(columnKey))
      .filter((column): column is NuxtTableColumn => Boolean(column));
  });

  const visibleColumns = computed(() => {
    return orderedColumns.value.filter((column) =>
      enabledColumnKeys.value.includes(column.key),
    );
  });

  const filteredRows = computed(() => {
    return options.rows.value.filter((row) => {
      return orderedColumns.value.every((column) => {
        const filterValue = filters.value[column.key];

        if (!isFilterActive(filterValue)) {
          return true;
        }

        const customFilterFunction = column.filterFunction ?? column.filterFn;
        if (customFilterFunction) {
          return true;
        }

        const candidate = resolveColumnValue(
          row,
          column.filterKey ?? column.key,
        );
        const candidateText = String(candidate ?? "").toLowerCase();
        const filterText = String(filterValue ?? "").toLowerCase();
        return candidateText.includes(filterText);
      });
    });
  });

  const sortedRows = computed(() => {
    if (!sortState.value) {
      return filteredRows.value;
    }

    const activeColumn = columnsByKey.value.get(sortState.value.key);
    if (!activeColumn) {
      return filteredRows.value;
    }

    const sortDirection = sortState.value.direction;
    const directionMultiplier = sortDirection === "asc" ? 1 : -1;
    const accessor = activeColumn.sortKey ?? activeColumn.key;
    const customSortFunction = activeColumn.sortFunction;

    if (customSortFunction) {
      return filteredRows.value;
    }

    return [...filteredRows.value].sort((leftRow, rightRow) => {
      const leftValue = resolveColumnValue(leftRow, accessor);
      const rightValue = resolveColumnValue(rightRow, accessor);
      return compareValues(leftValue, rightValue) * directionMultiplier;
    });
  });

  onMounted(() => {
    initializeColumnState();
    loadPersistedState();
    hasLoadedPersistence.value = true;
  });

  watch(
    () => options.columns.value,
    () => {
      initializeColumnState();
    },
    { deep: true },
  );

  watch(
    [columnOrder, enabledColumnKeys, columnWidths],
    () => {
      if (!hasLoadedPersistence.value || !import.meta.client) {
        return;
      }

      localStorage.setItem(
        buildStorageKey("order"),
        JSON.stringify(columnOrder.value),
      );
      localStorage.setItem(
        buildStorageKey("enabledColumns"),
        JSON.stringify(enabledColumnKeys.value),
      );
      localStorage.setItem(
        buildStorageKey("widths"),
        JSON.stringify(columnWidths.value),
      );
    },
    { deep: true },
  );

  onBeforeUnmount(() => {
    stopResizing();
  });

  function initializeColumnState() {
    const currentKeys = availableColumnKeys.value;

    if (!columnOrder.value.length) {
      columnOrder.value = [...currentKeys];
    } else {
      const currentKeySet = new Set(currentKeys);
      const keptKeys = columnOrder.value.filter((key) =>
        currentKeySet.has(key),
      );
      const newKeys = currentKeys.filter((key) => !keptKeys.includes(key));
      columnOrder.value = [...keptKeys, ...newKeys];
    }

    if (!enabledColumnKeys.value.length) {
      enabledColumnKeys.value = [...currentKeys];
    } else {
      const currentKeySet = new Set(currentKeys);
      const keptEnabledKeys = enabledColumnKeys.value.filter((key) =>
        currentKeySet.has(key),
      );
      const missingEnabledKeys = currentKeys.filter(
        (key) => !keptEnabledKeys.includes(key),
      );
      enabledColumnKeys.value = [...keptEnabledKeys, ...missingEnabledKeys];
    }

    const nextFilters: Record<string, unknown> = {};
    for (const key of currentKeys) {
      nextFilters[key] = filters.value[key] ?? "";
    }
    filters.value = nextFilters;

    const nextWidths: Record<string, number> = {};
    for (const key of currentKeys) {
      const width = columnWidths.value[key];
      if (typeof width === "number" && Number.isFinite(width)) {
        nextWidths[key] = width;
      }
    }
    columnWidths.value = nextWidths;
  }

  function loadPersistedState() {
    if (!import.meta.client) {
      return;
    }

    try {
      const persistedOrder = localStorage.getItem(buildStorageKey("order"));
      if (persistedOrder) {
        const parsedOrder = JSON.parse(persistedOrder);
        if (Array.isArray(parsedOrder)) {
          const validPersistedOrder = parsedOrder.filter(
            (key: unknown): key is string => {
              return (
                typeof key === "string" &&
                availableColumnKeys.value.includes(key)
              );
            },
          );

          const missingKeys = availableColumnKeys.value.filter(
            (key) => !validPersistedOrder.includes(key),
          );
          columnOrder.value = [...validPersistedOrder, ...missingKeys];
        }
      }

      const persistedEnabledColumns = localStorage.getItem(
        buildStorageKey("enabledColumns"),
      );
      if (persistedEnabledColumns) {
        const parsedEnabledColumns = JSON.parse(persistedEnabledColumns);
        if (Array.isArray(parsedEnabledColumns)) {
          enabledColumnKeys.value = parsedEnabledColumns.filter(
            (key: unknown): key is string => {
              return (
                typeof key === "string" &&
                availableColumnKeys.value.includes(key)
              );
            },
          );
        }
      }

      const persistedWidths = localStorage.getItem(buildStorageKey("widths"));
      if (persistedWidths) {
        const parsedWidths = JSON.parse(persistedWidths);
        if (parsedWidths && typeof parsedWidths === "object") {
          const nextWidths: Record<string, number> = {};
          for (const key of availableColumnKeys.value) {
            const width = (parsedWidths as Record<string, unknown>)[key];
            if (
              typeof width === "number" &&
              Number.isFinite(width) &&
              width >= MIN_COLUMN_WIDTH
            ) {
              nextWidths[key] = width;
            }
          }
          columnWidths.value = nextWidths;
        }
      }
    } catch {
      columnOrder.value = [...availableColumnKeys.value];
      enabledColumnKeys.value = [...availableColumnKeys.value];
      columnWidths.value = {};
    }
  }

  function buildStorageKey(segment: string) {
    return `${options.storageKey.value}:${segment}`;
  }

  function getSortDirection(columnKey: string) {
    if (sortState.value?.key !== columnKey) {
      return null;
    }
    return sortState.value.direction;
  }

  function toggleSort(column: NuxtTableColumn) {
    if (!column.sortable) {
      return;
    }

    if (!sortState.value || sortState.value.key !== column.key) {
      sortState.value = { key: column.key, direction: "asc" };
      if (column.sortFunction) {
        options.onManualSortChange?.({
          columnKey: column.key,
          direction: "asc",
          column,
          rows: [...options.rows.value],
          filters: { ...filters.value },
        });
      }
      return;
    }

    if (sortState.value.direction === "asc") {
      sortState.value = { key: column.key, direction: "desc" };
      if (column.sortFunction) {
        options.onManualSortChange?.({
          columnKey: column.key,
          direction: "desc",
          column,
          rows: [...options.rows.value],
          filters: { ...filters.value },
        });
      }
      return;
    }

    sortState.value = null;
    if (column.sortFunction) {
      options.onManualSortChange?.({
        columnKey: column.key,
        direction: null,
        column,
        rows: [...options.rows.value],
        filters: { ...filters.value },
      });
    }
  }

  function setFilter(columnKey: string, value: unknown) {
    filters.value[columnKey] = value;

    const column = columnsByKey.value.get(columnKey);
    if (!column) {
      return;
    }

    const customFilterFunction = column.filterFunction ?? column.filterFn;
    if (!customFilterFunction) {
      return;
    }

    options.onManualFilterChange?.({
      columnKey,
      value,
      column,
      rows: [...options.rows.value],
      filters: { ...filters.value },
    });
  }

  function toggleColumn(columnKey: string) {
    if (enabledColumnKeys.value.includes(columnKey)) {
      if (enabledColumnKeys.value.length === 1) {
        return;
      }
      enabledColumnKeys.value = enabledColumnKeys.value.filter(
        (key) => key !== columnKey,
      );
      return;
    }

    enabledColumnKeys.value = [...enabledColumnKeys.value, columnKey];
  }
  function onHeaderDragStart(columnKey: string) {
    if (!options.enableColumnDnd.value || activeResize.value) {
      return;
    }
    dragSourceColumnKey.value = columnKey;
  }

  function onHeaderDragOver(columnKey: string) {
    if (!options.enableColumnDnd.value) {
      return;
    }
    if (!dragSourceColumnKey.value || dragSourceColumnKey.value === columnKey) {
      return;
    }
    dragOverColumnKey.value = columnKey;
  }

  function onHeaderDragLeave(columnKey: string) {
    if (dragOverColumnKey.value === columnKey) {
      dragOverColumnKey.value = null;
    }
  }

  async function onHeaderDrop(targetColumnKey: string) {
    if (!options.enableColumnDnd.value) {
      dragSourceColumnKey.value = null;
      dragOverColumnKey.value = null;
      return;
    }

    if (
      !dragSourceColumnKey.value ||
      dragSourceColumnKey.value === targetColumnKey
    ) {
      dragSourceColumnKey.value = null;
      dragOverColumnKey.value = null;
      return;
    }

    const beforeRects = getHeaderRects();

    const sourceIndex = columnOrder.value.indexOf(dragSourceColumnKey.value);
    const targetIndex = columnOrder.value.indexOf(targetColumnKey);

    if (sourceIndex < 0 || targetIndex < 0) {
      dragSourceColumnKey.value = null;
      dragOverColumnKey.value = null;
      return;
    }

    const nextOrder = [...columnOrder.value];
    const [moved] = nextOrder.splice(sourceIndex, 1);
    if (!moved) {
      dragSourceColumnKey.value = null;
      dragOverColumnKey.value = null;
      return;
    }
    nextOrder.splice(targetIndex, 0, moved);
    columnOrder.value = nextOrder;

    await nextTick();
    animateHeaderReorder(beforeRects);

    const payload: NuxtTableColumnOrderChange = {
      order: [...nextOrder],
      movedKey: moved,
      fromIndex: sourceIndex,
      toIndex: targetIndex,
    };

    options.onColumnOrderChange?.(payload);

    dragSourceColumnKey.value = null;
    dragOverColumnKey.value = null;
  }

  function onHeaderDragEnd() {
    dragSourceColumnKey.value = null;
    dragOverColumnKey.value = null;
  }

  function getColumnStyle(columnKey: string) {
    const width = columnWidths.value[columnKey];
    if (!width) {
      return {};
    }

    const safeWidth = Math.max(MIN_COLUMN_WIDTH, width);
    return {
      width: `${safeWidth}px`,
      minWidth: `${safeWidth}px`,
    };
  }

  function startColumnResize(event: MouseEvent, columnKey: string) {
    if (!import.meta.client) {
      return;
    }

    const currentWidth =
      columnWidths.value[columnKey] ??
      headerElements.value[columnKey]?.getBoundingClientRect().width ??
      MIN_COLUMN_WIDTH;

    activeResize.value = {
      columnKey,
      startX: event.clientX,
      startWidth: Math.max(MIN_COLUMN_WIDTH, currentWidth),
    };

    window.addEventListener("mousemove", onColumnResizeMove);
    window.addEventListener("mouseup", onColumnResizeEnd);
  }

  function onColumnResizeMove(event: MouseEvent) {
    if (!activeResize.value) {
      return;
    }

    const delta = event.clientX - activeResize.value.startX;
    const nextWidth = Math.max(
      MIN_COLUMN_WIDTH,
      Math.round(activeResize.value.startWidth + delta),
    );
    columnWidths.value = {
      ...columnWidths.value,
      [activeResize.value.columnKey]: nextWidth,
    };
  }

  function onColumnResizeEnd() {
    stopResizing();
  }

  function stopResizing() {
    if (!import.meta.client) {
      return;
    }

    activeResize.value = null;
    window.removeEventListener("mousemove", onColumnResizeMove);
    window.removeEventListener("mouseup", onColumnResizeEnd);
  }

  function setHeaderElement(
    columnKey: string,
    element: Element | ComponentPublicInstance | null,
  ) {
    headerElements.value[columnKey] =
      element instanceof HTMLTableCellElement ? element : null;
  }

  function getHeaderRects() {
    const rectMap = new Map<string, DOMRect>();
    for (const column of visibleColumns.value) {
      const element = headerElements.value[column.key];
      if (element) {
        rectMap.set(column.key, element.getBoundingClientRect());
      }
    }
    return rectMap;
  }

  function animateHeaderReorder(beforeRects: Map<string, DOMRect>) {
    if (
      !import.meta.client ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    for (const [columnKey, beforeRect] of beforeRects.entries()) {
      const element = headerElements.value[columnKey];
      if (!element) {
        continue;
      }

      const afterRect = element.getBoundingClientRect();
      const deltaX = beforeRect.left - afterRect.left;
      if (Math.abs(deltaX) < 1) {
        continue;
      }

      element.animate(
        [
          { transform: `translateX(${deltaX}px)` },
          { transform: "translateX(0)" },
        ],
        {
          duration: 220,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        },
      );
    }
  }

  function resolveDisplayValue(row: TableRow, column: NuxtTableColumn) {
    const value = resolveColumnValue(row, column.key);
    if (column.formatter) {
      return column.formatter(value, row);
    }
    return value;
  }

  function resolveRowKey(row: TableRow, index: number) {
    if (typeof options.rowKey.value === "function") {
      return options.rowKey.value(row, index);
    }
    return row[options.rowKey.value] ?? index;
  }

  function resolveColumnValue(row: TableRow, resolver: ValueResolver) {
    if (typeof resolver === "function") {
      return resolver(row);
    }

    const pathParts = resolver.split(".");
    let currentValue: any = row;
    for (const pathPart of pathParts) {
      if (currentValue == null) {
        return undefined;
      }
      currentValue = currentValue[pathPart];
    }
    return currentValue;
  }

  function isFilterActive(value: unknown): boolean {
    if (value == null) {
      return false;
    }

    if (typeof value === "string") {
      return value.trim().length > 0;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === "object") {
      return Object.values(value as Record<string, unknown>).some(
        (nestedValue) => isFilterActive(nestedValue),
      );
    }

    return true;
  }

  function compareValues(leftValue: unknown, rightValue: unknown) {
    if (leftValue == null && rightValue == null) {
      return 0;
    }
    if (leftValue == null) {
      return -1;
    }
    if (rightValue == null) {
      return 1;
    }

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return leftValue - rightValue;
    }

    const leftDate = leftValue instanceof Date ? leftValue.getTime() : null;
    const rightDate = rightValue instanceof Date ? rightValue.getTime() : null;
    if (leftDate !== null && rightDate !== null) {
      return leftDate - rightDate;
    }

    const leftText = String(leftValue).toLowerCase();
    const rightText = String(rightValue).toLowerCase();

    if (leftText < rightText) {
      return -1;
    }
    if (leftText > rightText) {
      return 1;
    }
    return 0;
  }

  return {
    orderedColumns,
    visibleColumns,
    sortedRows,
    filters,
    enabledColumnKeys,
    dragSourceColumnKey,
    dragOverColumnKey,
    getSortDirection,
    toggleSort,
    setFilter,
    toggleColumn,
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
  };
}
