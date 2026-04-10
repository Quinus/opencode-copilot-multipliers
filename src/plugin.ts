import type { TuiPlugin, TuiPluginApi, TuiPluginModule } from "@opencode-ai/plugin/tui"

import { runMultipliersCommand } from "./commandMultipliers.js"
import { PLUGIN_ID, PluginOptions } from "./types.js"

function showMarkdownDialog(api: TuiPluginApi, title: string, message: string): void {
  api.ui.dialog.replace(() =>
    api.ui.DialogConfirm({
      title,
      message,
      onConfirm: () => api.ui.dialog.clear(),
      onCancel: () => api.ui.dialog.clear(),
    }),
  )
}

// oxlint-disable-next-line require-await -- TuiPlugin requires Promise<void> return type
const tui: TuiPlugin = async (api, options) => {
  const pluginOptions = (options ?? {}) as PluginOptions

  api.command.register(() => [
    {
      title: "Copilot Multipliers",
      value: `${PLUGIN_ID}.show`,
      description: "Show GitHub Copilot model multipliers (weekly cache)",
      category: "Copilot",
      slash: { name: "copilot-multipliers" },
      onSelect: async () => {
        try {
          const workspaceDir = api.state.path.directory || process.cwd()

          const result = await runMultipliersCommand({
            workspaceDir,
            options: pluginOptions,
          })

          if (result.warning) {
            api.ui.toast({
              variant: "warning",
              message: result.warning,
            })
          }

          showMarkdownDialog(api, "GitHub Copilot Model Multipliers", result.markdown)
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error"
          api.ui.toast({
            variant: "error",
            message: `Failed to load multipliers: ${message}`,
          })
        }
      },
    },
  ])
}

const plugin: TuiPluginModule & { id: string } = {
  id: PLUGIN_ID,
  tui,
}

export default plugin
