import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// One id per build. It is baked into the bundle and also written to
// /version.json, so an open app can tell a newer deploy is live and reload
// itself instead of showing the old screens (see src/appUpdate.js).
const BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA || String(Date.now())

function versionFile() {
  return {
    name: 'version-file',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ id: BUILD_ID }) })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), versionFile()],
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
})
