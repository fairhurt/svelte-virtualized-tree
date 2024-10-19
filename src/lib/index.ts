import {
    TreeVirtualizer,
    observeElementRect,
    type VirtualizerOptions
  } from './core'
  import { derived, writable } from 'svelte/store'
  import type { PartialKeys,  } from './core/utils'
  import type { Readable, Writable } from 'svelte/store'
  
  
  export type SvelteTreeVirtualizer<
    TScrollElement extends Element | Window,
    TItemElement extends Element,
    TData,
  > = Omit<TreeVirtualizer<TScrollElement, TItemElement, TData>, 'setOptions'> & {
    setOptions: (
      options: Partial<VirtualizerOptions<TScrollElement, TItemElement, TData>>,
    ) => void
  }
  
  function createTreeVirtualizerBase<
    TScrollElement extends Element | Window,
    TItemElement extends Element,
    TData
  >(
    initialOptions: VirtualizerOptions<TScrollElement, TItemElement, TData>,
  ): Readable<SvelteTreeVirtualizer<TScrollElement, TItemElement, TData>> {
    const virtualizer = new TreeVirtualizer(initialOptions)
    const originalSetOptions = virtualizer.setOptions
  
    // eslint-disable-next-line prefer-const
    let virtualizerWritable: Writable<TreeVirtualizer<TScrollElement, TItemElement, TData>>
  
    const setOptions = (
      options: Partial<VirtualizerOptions<TScrollElement, TItemElement, TData>>,
    ) => {
      const resolvedOptions = {
        ...virtualizer.options,
        ...options,
        onChange: options.onChange,
      }
      originalSetOptions({
        ...resolvedOptions,
        onChange: (
          instance: TreeVirtualizer<TScrollElement, TItemElement, TData>,
          sync: boolean,
        ) => {
          virtualizerWritable.set(instance)
          resolvedOptions.onChange?.(instance, sync)
        },
      })
      virtualizer._willUpdate()
    }
  
    virtualizerWritable = writable(virtualizer, () => {
      setOptions(initialOptions)
      return virtualizer._didMount()
    })
  
    return derived(virtualizerWritable, (instance) =>
      Object.assign(instance, { setOptions }),
    )
  }
  
  export function createTreeVirtualizer<
    TScrollElement extends Element,
    TItemElement extends Element,
    TData,
  >(
    options: 
      VirtualizerOptions<TScrollElement, TItemElement, TData>
    ,
  ): Readable<SvelteTreeVirtualizer<TScrollElement, TItemElement, TData>> {
    return createTreeVirtualizerBase<TScrollElement, TItemElement, TData>({
      ...options,
    })
  }
  
 