<script lang="ts">
	import { commands } from '../bindings';
	import type { MonitorData } from '../bindings';
	
	let monitors: MonitorData[] = [];
	let selectedMonitorId = '';
	let screenshotDataUrl = '';
	let mouseX = 0;
	let mouseY = 0;
	let textToType = '';
	let keyToPress = '';
	
	async function loadMonitors() {
		try {
			const result = await commands.getMonitors();
			if (result.status === 'ok') {
				monitors = result.data;
				if (monitors.length > 0) {
					selectedMonitorId = monitors[0].id;
				}
			} else {
				console.error('Failed to get monitors:', result.error);
			}
		} catch (error) {
			console.error('Error loading monitors:', error);
		}
	}
	
	async function takeScreenshot() {
		if (!selectedMonitorId) return;
		
		try {
			const result = await commands.takeScreenshot(selectedMonitorId, 1024, 768);
			if (result.status === 'ok') {
				// Convert base64 to data URL for display
				screenshotDataUrl = `data:image/png;base64,${result.data}`;
			} else {
				console.error('Failed to take screenshot:', result.error);
			}
		} catch (error) {
			console.error('Error taking screenshot:', error);
		}
	}
	
	async function moveMouse() {
		if (!selectedMonitorId) return;
		
		try {
			const result = await commands.moveMouse(selectedMonitorId, mouseX, mouseY);
			if (result.status === 'error') {
				console.error('Failed to move mouse:', result.error);
			}
		} catch (error) {
			console.error('Error moving mouse:', error);
		}
	}
	
	async function clickMouse(side: 'left' | 'right') {
		if (!selectedMonitorId) return;
		
		try {
			const result = await commands.mouseClick(selectedMonitorId, side, mouseX, mouseY);
			if (result.status === 'error') {
				console.error('Failed to click mouse:', result.error);
			}
		} catch (error) {
			console.error('Error clicking mouse:', error);
		}
	}
	
	async function typeText() {
		if (!textToType) return;
		
		try {
			const result = await commands.typeText(textToType);
			if (result.status === 'error') {
				console.error('Failed to type text:', result.error);
			}
		} catch (error) {
			console.error('Error typing text:', error);
		}
	}
	
	async function pressKey() {
		if (!keyToPress) return;
		
		try {
			const result = await commands.pressKey(keyToPress);
			if (result.status === 'error') {
				console.error('Failed to press key:', result.error);
			}
		} catch (error) {
			console.error('Error pressing key:', error);
		}
	}
	
	// Load monitors on component mount
	import { onMount } from 'svelte';
	onMount(() => {
		loadMonitors();
	});
</script>

<div class="computer-controls p-6 space-y-6">
	<h2 class="text-2xl font-bold">Computer Controls</h2>
	
	<!-- Monitor Selection -->
	<div class="space-y-2">
		<label class="block text-sm font-medium">Monitor:</label>
		<select bind:value={selectedMonitorId} class="w-full p-2 border rounded">
			{#each monitors as monitor}
				<option value={monitor.id}>
					{monitor.name} ({monitor.width}x{monitor.height}) {monitor.is_primary ? '(Primary)' : ''}
				</option>
			{/each}
		</select>
	</div>
	
	<!-- Screenshot -->
	<div class="space-y-2">
		<button 
			on:click={takeScreenshot}
			class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
			disabled={!selectedMonitorId}
		>
			Take Screenshot
		</button>
		{#if screenshotDataUrl}
			<div class="mt-2">
				<p class="text-sm text-gray-600 mb-2">Screenshot taken:</p>
				<img src={screenshotDataUrl} alt="Screenshot" class="max-w-full h-auto border rounded" />
			</div>
		{/if}
	</div>
	
	<!-- Mouse Controls -->
	<div class="space-y-2">
		<h3 class="text-lg font-medium">Mouse Controls</h3>
		<div class="flex space-x-2">
			<input 
				type="number" 
				bind:value={mouseX} 
				placeholder="X" 
				class="p-2 border rounded w-20"
			>
			<input 
				type="number" 
				bind:value={mouseY} 
				placeholder="Y" 
				class="p-2 border rounded w-20"
			>
			<button 
				on:click={moveMouse}
				class="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
				disabled={!selectedMonitorId}
			>
				Move
			</button>
			<button 
				on:click={() => clickMouse('left')}
				class="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
				disabled={!selectedMonitorId}
			>
				Left Click
			</button>
			<button 
				on:click={() => clickMouse('right')}
				class="px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
				disabled={!selectedMonitorId}
			>
				Right Click
			</button>
		</div>
	</div>
	
	<!-- Text Input -->
	<div class="space-y-2">
		<h3 class="text-lg font-medium">Text Input</h3>
		<div class="flex space-x-2">
			<input 
				type="text" 
				bind:value={textToType} 
				placeholder="Text to type" 
				class="flex-1 p-2 border rounded"
			>
			<button 
				on:click={typeText}
				class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
				disabled={!textToType}
			>
				Type Text
			</button>
		</div>
	</div>
	
	<!-- Key Press -->
	<div class="space-y-2">
		<h3 class="text-lg font-medium">Key Press</h3>
		<div class="flex space-x-2">
			<input 
				type="text" 
				bind:value={keyToPress} 
				placeholder="Key to press (e.g., 'enter', 'ctrl+c')" 
				class="flex-1 p-2 border rounded"
			>
			<button 
				on:click={pressKey}
				class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
				disabled={!keyToPress}
			>
				Press Key
			</button>
		</div>
	</div>
</div>

<style>
	.computer-controls {
		max-width: 600px;
		margin: 0 auto;
	}
</style>
