import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'WeeWoo² Wheel',
    description:
      'AI radial command wheel that turns selected web text into summaries, tasks, and knowledge cards in one click.',
    permissions: ['storage', 'activeTab', 'sidePanel', 'contextMenus'],
    host_permissions: ['<all_urls>'],
    web_accessible_resources: [
      {
        resources: [
          'skins/doodle/*.png',
          'skins/emoji/*.svg',
          'skins/sidepanel/*.svg',
          'skins/icon-wheel.svg',
        ],
        matches: ['<all_urls>'],
      },
    ],
    action: {},
  },
  // Enable remote debugging on port 9222 so VS Code / Playwright can connect
  webExt: {
    chromiumArgs: ['--remote-debugging-port=9222'],
  },
  vite: () => ({
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
  }),
});
