<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Switch } from "$lib/components/ui/switch";
  import * as Card from "$lib/components/ui/card";
  import { Separator } from "$lib/components/ui/separator";
  import { settingsStore, resetSettings } from "$lib/runes/settings.svelte";
  import { toast } from "svelte-sonner";
  import Icons from "$lib/components/elements/icons.svelte";

  let showApiKey = $state(false);

  function handleSave() {
    toast.success("Settings saved automatically!");
  }

  function handleReset() {
    resetSettings();
    toast.success("Settings reset to defaults");
  }

  function toggleShowApiKey() {
    showApiKey = !showApiKey;
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }
</script>

<div class="flex h-screen flex-col bg-background">
  <!-- Header -->
  <header
    class="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
  >
    <div class="flex h-16 items-center justify-between px-6">
      <div class="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onclick={() => (window.location.href = "/")}
        >
          <Icons name="arrow-left" size={16} />
          <span class="ml-2">Back</span>
        </Button>
        <Separator orientation="vertical" class="h-6" />
        <div>
          <h1 class="text-lg font-semibold">Settings</h1>
          <p class="text-sm text-muted-foreground">
            Configure your API keys and preferences
          </p>
        </div>
      </div>
    </div>
  </header>

  <!-- Content -->
  <div class="flex-1 overflow-y-auto">
    <div class="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <!-- API Keys Section -->
      <Card.Root>
        <Card.Header>
          <Card.Title>API Configuration</Card.Title>
          <Card.Description>
            Manage your API keys for different providers. Keys are stored
            securely on your device.
          </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-6">
          <!-- OpenRouter API Key -->
          <div class="space-y-2">
            <Label for="openrouter-key">OpenRouter API Key</Label>
            <div class="flex gap-2">
              <div class="relative flex-1">
                <Input
                  id="openrouter-key"
                  type={showApiKey ? "text" : "password"}
                  bind:value={settingsStore.state.openrouterApiKey}
                  placeholder="sk-or-..."
                  class="pr-10"
                />
                <button
                  type="button"
                  onclick={toggleShowApiKey}
                  class="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                >
                  {#if showApiKey}
                    <Icons name="eye-off" size={16} />
                  {:else}
                    <Icons name="eye" size={16} />
                  {/if}
                </button>
              </div>
            </div>
            <p class="text-xs text-muted-foreground">
              Get your API key from
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary hover:underline"
              >
                OpenRouter
              </a>
            </p>
          </div>

          <!-- LM Studio URL -->
          <div class="space-y-2">
            <Label for="lmstudio-url">LM Studio URL</Label>
            <Input
              id="lmstudio-url"
              type="text"
              bind:value={settingsStore.state.lmstudioUrl}
              placeholder="http://localhost:1234/v1"
            />
            <p class="text-xs text-muted-foreground">
              URL for your local LM Studio instance
            </p>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Model Configuration -->
      <Card.Root>
        <Card.Header>
          <Card.Title>Model Configuration</Card.Title>
          <Card.Description>Set your preferred default model</Card.Description>
        </Card.Header>
        <Card.Content class="space-y-4">
          <div class="space-y-2">
            <Label for="default-model">Default Model</Label>
            <Input
              id="default-model"
              type="text"
              bind:value={settingsStore.state.defaultModel}
              placeholder="anthropic/claude-sonnet-4.5"
            />
            <p class="text-xs text-muted-foreground">
              The model to use when starting a new conversation
            </p>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Preferences Section -->
      <Card.Root>
        <Card.Header>
          <Card.Title>Preferences</Card.Title>
          <Card.Description>Customize your experience</Card.Description>
        </Card.Header>
        <Card.Content class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label for="auto-screenshot">Auto Screenshot</Label>
              <p class="text-sm text-muted-foreground">
                Automatically take screenshots after actions
              </p>
            </div>
            <Switch
              id="auto-screenshot"
              checked={settingsStore.state.autoScreenshot}
              onCheckedChange={(checked: boolean | "indeterminate") => {
                settingsStore.state.autoScreenshot = checked === true;
              }}
            />
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Storage Info -->
      <Card.Root>
        <Card.Header>
          <Card.Title>Storage Information</Card.Title>
          <Card.Description>
            Your settings are automatically saved and synchronized
          </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-4">
          <div class="rounded-lg border bg-muted/50 p-4">
            <div class="flex items-start gap-3">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10"
              >
                <Icons name="save" size={20} class="text-primary" />
              </div>
              <div class="space-y-1">
                <p class="text-sm font-medium">Automatic Persistence</p>
                <p class="text-sm text-muted-foreground">
                  Changes are saved automatically after 500ms of inactivity.
                  Your settings are stored securely on your device using Tauri
                  Store.
                </p>
              </div>
            </div>
          </div>

          <div class="rounded-lg border bg-muted/50 p-4">
            <div class="flex items-start gap-3">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10"
              >
                <Icons name="refresh-ccw" size={20} class="text-blue-500" />
              </div>
              <div class="space-y-1">
                <p class="text-sm font-medium">Cross-Window Sync</p>
                <p class="text-sm text-muted-foreground">
                  Settings are synchronized across all application windows in
                  real-time.
                </p>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Actions -->
      <div class="flex items-center justify-between">
        <Button variant="outline" onclick={handleReset}>
          <Icons name="rotate-ccw" size={16} />
          <span class="ml-2">Reset to Defaults</span>
        </Button>
        <Button onclick={handleSave}>
          <Icons name="check" size={16} />
          <span class="ml-2">Settings Auto-Saved</span>
        </Button>
      </div>
    </div>
  </div>
</div>
