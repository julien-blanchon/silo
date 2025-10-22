// @ts-nocheck
import { RuneStore } from '@tauri-store/svelte';

const defaultSettings = {
    openrouterApiKey: '',
    lmstudioUrl: 'http://localhost:1234/v1',
    defaultModel: 'anthropic/claude-sonnet-4.5',
    autoScreenshot: false,
};

// Create the settings store with persistence and sync
export const settingsStore = new RuneStore('settings', defaultSettings, {
    autoStart: true,
    saveOnChange: true,
    saveStrategy: 'debounce',
    saveInterval: 500, // Save 500ms after last change
});

// Helper functions for updating settings
export function updateOpenRouterApiKey(key) {
    settingsStore.state.openrouterApiKey = key;
}

export function updateLMStudioUrl(url) {
    settingsStore.state.lmstudioUrl = url;
}

export function updateDefaultModel(model) {
    settingsStore.state.defaultModel = model;
}

export function updateAutoScreenshot(enabled) {
    settingsStore.state.autoScreenshot = enabled;
}

export function resetSettings() {
    Object.assign(settingsStore.state, defaultSettings);
}
