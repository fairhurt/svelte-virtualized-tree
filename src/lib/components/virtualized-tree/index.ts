import type { TreeItem, TreeItemData, VirtualizedTreeOptions, TreeItemAccessorKey, VirtualizedTreeIcons } from "./types";
/**
 * Represents a virtualized tree structure for efficiently rendering large tree data.
 *
 * @template T - The type of the tree item.
 */
class VirtualizedTree<T> {
    data: TreeItem<T>[];
    options?: VirtualizedTreeOptions<T>;
    accessorKey: TreeItemAccessorKey<T>;
    icons?: VirtualizedTreeIcons;
    selectedId?: string | number ;
    visibleNodes: TreeItem<T>[] = [];
    constructor({ data, accessorKey, options, icons }: { data: TreeItem<T>[]; accessorKey: TreeItemAccessorKey<T>; icons?: VirtualizedTreeIcons; options?: VirtualizedTreeOptions<T> }) {
        this.data = data;
        this.options = options;
        this.accessorKey = accessorKey;
        this.icons = icons;
        this.selectedId = undefined; // Initialize selectedId to undefined
    }

    /**
     * Retrieves the display value of a tree item at the specified index.
     *
     * @template T - The type of the tree item.
     * @param {number} index - The index of the tree item in the data array.
     * @returns {TreeItem<T>[keyof TreeItem<T>]} - The display value of the tree item.
     */
    getDisplayValue(index: number): T[keyof T] {
        return this.data[index][this.accessorKey] as T[keyof T];
    }

    getSelectedId(): string | number | undefined {
        return this.selectedId;
    }

    setSelectedId(id: string | number): void {
        this.selectedId = id;
    }
    
}

/**
 * Creates a new instance of a virtualized tree.
 *
 * @template T - The type of the data items in the tree.
 * @param {TreeItem<T>[]} data - An array of tree items to be used as the data source.
 * @param {VirtualizedTreeOptions<T>} options - Configuration options for the virtualized tree.
 * @returns {VirtualizedTree<T>} A new instance of a virtualized tree.
 */
function createVirtualizedTree<T>({ data, accessorKey, options, icons }: { data: TreeItem<T>[]; accessorKey: TreeItemAccessorKey<T>; icons?: VirtualizedTreeIcons; options?: VirtualizedTreeOptions<T> }): VirtualizedTree<T> {
    return new VirtualizedTree({ data, accessorKey, icons, options });
}

export { VirtualizedTree, createVirtualizedTree };