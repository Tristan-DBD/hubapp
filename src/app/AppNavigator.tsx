import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { getAllModules } from '../core/module-registry'
import { theme, navigationTheme } from '../core/theme'
import { HubScreen } from './HubScreen'
import { LazyScreen } from './LazyScreen'

const Stack = createNativeStackNavigator()

export function AppNavigator() {
  const modules = getAllModules()

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName="Hub"
        screenOptions={{
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
          headerTitleStyle: { color: theme.text },
          contentStyle: { backgroundColor: theme.bg },
        }}>
        <Stack.Screen
          name="Hub"
          component={HubScreen}
          options={{ headerShown: false }}
        />
        {modules.map((module) => (
          <Stack.Screen
            key={module.id}
            name={module.id}
            options={{ title: module.name }}
          >
            {() => <LazyScreen loadScreen={module.loadScreen} />}
          </Stack.Screen>
        ))}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
