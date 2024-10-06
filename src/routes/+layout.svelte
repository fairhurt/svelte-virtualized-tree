<script lang="ts">
	import House from 'lucide-svelte/icons/house';
	import Menu from 'lucide-svelte/icons/menu';
	import { Button } from '$site/components/ui/button/index.js';
	import * as Sheet from '$site/components/ui/sheet/index.js';
	import { Separator } from '$site/components/ui/separator/index.js';
	import '../app.css';
</script>

<div class="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
	<div class="hidden border-r bg-muted/40 md:block">
		<div class="flex h-full max-h-screen flex-col gap-2">
			<div class="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
				<a href="/" class="flex items-center gap-2 font-semibold">
					<span class="">Svelte Virtualized Tree</span>
				</a>
			</div>
			<div class="flex-1">
				<nav class="grid items-start px-2 text-sm font-medium lg:px-4">
					<a
						href="/installation"
						class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
					>
						Installation
					</a>

					<a
						href="/usage"
						class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
					>
						Usage
					</a>
					<p
						class="transition-ally flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground"
					>
						Examples
					</p>
					<Separator />
					<a
						href="/examples/basic"
						class="ml-6 flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
					>
						Basic
					</a>
				</nav>
			</div>
			<div class="mt-auto p-4">
				<a
					href="https://www.shadcn-svelte.com/"
					target="_blank"
					rel="noreferrer noopener"
					class="rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-black"
				>
					Created with shadcn-svelte
				</a>
			</div>
		</div>
	</div>
	<div class="flex flex-col">
		<header class="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
			<Sheet.Root>
				<Sheet.Trigger asChild let:builder>
					<Button variant="outline" size="icon" class="shrink-0 md:hidden" builders={[builder]}>
						<Menu class="h-5 w-5" />
						<span class="sr-only">Toggle navigation menu</span>
					</Button>
				</Sheet.Trigger>
				<Sheet.Content side="left" class="flex flex-col">
					<nav class="grid gap-2 text-lg font-medium">
						<a
							href="/"
							class="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
						>
							<House class="h-5 w-5" />
							Home
						</a>
						<a
							href="/installation"
							class="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-foreground hover:text-foreground"
						>
							Installation
						</a>
						<a
							href="/usage"
							class="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
						>
							Usage
						</a>
						<a
							href="/examples"
							class="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
						>
							Examples
						</a>
					</nav>
					<div class="mt-auto">
						Site created with <a
							href="https://www.shadcn-svelte.com/"
							target="_blank"
							rel="noreferrer noopener"
							class="rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-black"
						>
							shadcn-svelte
						</a>
					</div>
				</Sheet.Content>
			</Sheet.Root>
		</header>
		<main class="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
			<slot />
		</main>
	</div>
</div>
