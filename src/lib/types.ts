import { SvelteComponent } from "svelte";

export type TreeItemData = unknown | object | any[]

export type TreeItem<T> = T & {
    id: number | string;
    isExpanded?: boolean;
    isLeaf?: boolean;
    parentId: number | string | null;
    children?: TreeItem<T>[];
    icon: string;
    level: number;
};

export type TreeProps<T> = {
    treeData: T[];
    selectedId: T | null;
};

export type TreeItemAccessorKey<T> = keyof TreeItem<T>;
export type Icon = SvelteComponent;
export type VirtualizedTreeIcons = { 
    expandIcon: Icon;
    expandedIcon: Icon;
    collapseIcon: Icon;
    leafIcon: Icon;
}
export type VirtualizedTreeOptions<T> = {
}