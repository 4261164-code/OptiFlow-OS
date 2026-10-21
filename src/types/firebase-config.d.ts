declare module '*/firebase-applet-config.json' {
  interface FirebaseAppletConfig {
    projectId: string;
    appId: string;
    apiKey: string;
    authDomain: string;
    firestoreDatabaseId: string;
    storageBucket: string;
    messagingSenderId: string;
    measurementId?: string;
    oAuthClientId?: string;
    recaptchaSiteKey?: string;
  }
  const config: FirebaseAppletConfig;
  export default config;
}
