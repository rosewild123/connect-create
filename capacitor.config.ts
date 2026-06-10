import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.senda',
  appName: 'Senda',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
  },
  server: {
    // For live-reload during dev, point this at your Lovable preview URL.
    // For App Store builds, comment this out so the app loads the bundled web build from `dist/`.
    // url: 'https://id-preview--483fdf89-5e09-448e-98c1-d930215b9bd3.lovable.app',
    // cleartext: true,
  },
};

export default config;
