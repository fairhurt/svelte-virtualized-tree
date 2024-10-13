import VirtualizedTree from "./virtualized-tree.svelte";
import type { TreeItem, VirtualizedTreeOptions, TreeItemAccessorKey, VirtualizedTreeIcons } from "./types";
/**
 * Represents a virtualized tree structure for efficiently rendering large tree data.
 *
 * @template T - The type of the tree item.
 */
class VirtualizedTreeInstance<T> {
    data: TreeItem<T>[];
    options?: VirtualizedTreeOptions<T>;
    accessorKey: TreeItemAccessorKey<T>;
    icons?: VirtualizedTreeIcons;
    selectedId?: string | number ;
    visibleNodes: TreeItem<T>[] = [];
    expandedNodes: Set<number | string>;
    constructor({ data, accessorKey, options, icons }: { data: TreeItem<T>[]; accessorKey: TreeItemAccessorKey<T>; icons?: VirtualizedTreeIcons; options?: VirtualizedTreeOptions<T> }) {
        this.data = data;
        this.options = options;
        this.accessorKey = accessorKey;
        this.icons = icons;
        this.selectedId = undefined; // Initialize selectedId to undefined
        this.expandedNodes = new Set();
        this.updateVisibleNodes();
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

    /**
     * Retrieves the currently selected ID.
     *
     * @returns {string | number | undefined} The ID of the selected item, or `undefined` if no item is selected.
     */
    getSelectedId(): string | number | undefined {
        return this.selectedId;
    }

    /**
     * Sets the selected ID.
     *
     * @param id - The ID to be set as selected. Can be a string or a number.
     */
    setSelectedId(id: string | number): void {
        this.selectedId = id;
    }

    setExpandedNodes(expandedNodes: Set<number | string>): void {   
        this.expandedNodes = expandedNodes;
    }
    // Updates the visible nodes based on the expanded nodes
    updateVisibleNodes(): void {
        let nodesThatShouldBeVisible = this.data.filter((node: TreeItem<T>) => {
			if (node.parentId === null) {
				return true;
			}
			return this.expandedNodes.has(node.parentId);
		});
		this.visibleNodes = nodesThatShouldBeVisible;
    }
    
    getVisibleNodes(): TreeItem<T>[] {
        return this.visibleNodes;
    }

    toggleNode(nodeId: number | string, index: number ): void {
        let node : TreeItem<T> = this.data.find((node) => node.id === nodeId) as TreeItem<T>;
        if(!node) {
            return;
        }
        if (this.expandedNodes.has(node.id)) {
			this.expandedNodes.delete(node.id);
			if (node.children && node.children.length > 0) {
				const removeChildren = (children: TreeItem<any>[]) => {
					children.forEach((child) => {
						const index = this.visibleNodes.findIndex((node) => node.id === child.id);
						if (index !== -1) {
							this.expandedNodes.delete(child.id);
							let visibleNodesCopy = [...this.visibleNodes];
							visibleNodesCopy.splice(index, 1);
							this.visibleNodes = visibleNodesCopy;
							if (child.children && child.children.length > 0) {
								removeChildren(child.children);
							}
						}
					});
				};

				removeChildren(node.children);
			}
		} else {
			this.expandedNodes.add(node.id);
			if (node.children && node.children.length > 0) {
				this.visibleNodes = [
					...this.visibleNodes.slice(0, index + 1),
					...node.children,
					...this.visibleNodes.slice(index + 1)
				];
			} else {
				this.visibleNodes = [...this.visibleNodes];
			}
		}
        console.log("Updated visible nodes: ", this.visibleNodes);  
        // this.updateVisibleNodes(); 
    }

    getParentIds = (newExpanded: Set<number>, node: TreeItem<any>) => {
		// If no nodes are selected return empty
		if (node === undefined) return [];
		//Only the root node is null, so just return the root nodes id
		if (node.parent === null) return newExpanded.add(node.id);
		//Otherwise push the current nodes id
		newExpanded.add(node.id);
		//Find the parent of the node
		let parentNode = this.data.find((value) => value.id === node.parent);
		//Add the parent node to the list of expanded nodes
		if (parentNode !== undefined) this.getParentIds(newExpanded, parentNode);
	};

}

/**
 * Creates a new instance of a virtualized tree.
 *
 * @template T - The type of the data items in the tree.
 * @param {TreeItem<T>[]} data - An array of tree items to be used as the data source.
 * @param {VirtualizedTreeOptions<T>} options - Configuration options for the virtualized tree.
 * @returns {VirtualizedTree<T>} A new instance of a virtualized tree.
 */
function createVirtualizedTree<T>({ data, accessorKey, options, icons }: { data: TreeItem<T>[]; accessorKey: TreeItemAccessorKey<T>; icons?: VirtualizedTreeIcons; options?: VirtualizedTreeOptions<T> }): VirtualizedTreeInstance<T> {
    return new VirtualizedTreeInstance({ data, accessorKey, icons, options });
}

export { VirtualizedTree, VirtualizedTreeInstance, createVirtualizedTree,
type TreeItem, type VirtualizedTreeOptions, type TreeItemAccessorKey, type VirtualizedTreeIcons 
 };