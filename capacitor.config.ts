import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mythouse.app',
  appName: 'Mythouse',
  webDir: 'build',
  server: {
    // Use the live site URL for API calls (Vercel serverless functions)
    url: undefined, // undefined = load from local build assets
    allowNavigation: ['meteor-steel-site-2.vercel.app', 'firestore.googleapis.com', '*.firebaseio.com'],
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'Mythouse',
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
