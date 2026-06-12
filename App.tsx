import React from 'react'
import { StatusBar } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppNavigator } from './src/app/AppNavigator'
import { ErrorBoundary } from './src/app/ErrorBoundary'
import { PermissionGate } from './src/app/PermissionGate'
import { registerAllModules } from './src/core/module-registry/auto-imports'
import { theme } from './src/core/theme'

registerAllModules()

function App() {
  return (
    <ErrorBoundary>
      <PermissionGate>
        <SafeAreaProvider>
          <StatusBar barStyle="light-content" backgroundColor={theme.bg} />
          <AppNavigator />
        </SafeAreaProvider>
      </PermissionGate>
    </ErrorBoundary>
  )
}

export default App
