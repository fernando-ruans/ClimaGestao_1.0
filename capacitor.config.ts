import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.samclimatiza.app",
  appName: "SAM CLIMATIZA",
  webDir: "dist/public",
  server: {
    androidScheme: "http",
    // URL atualizada para o domínio correto
    url: "http://10.0.0.12:5000",
    cleartext: true
  },
  plugins: {
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: false,
      iosKeychainPrefix: 'cap',
      androidIsEncryption: false,
      androidDatabaseVersion: 1,
      androidDatabaseName: "sam_climatiza_db"
    }
  }
};

export default config;
