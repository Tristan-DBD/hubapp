import React, { useRef } from 'react'
import { Text, FlatList, Pressable, StyleSheet, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getAllModules } from '../core/module-registry'
import { theme } from '../core/theme'
import type { AppModule } from '../core/types'

interface HubScreenProps {
  navigation: any
}

function ModuleCard({
  module,
  onPress,
}: {
  module: AppModule
  onPress: () => void
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const onPressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start()
  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()
  return (
    <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={styles.card}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <Text style={styles.icon}>{module.icon}</Text>
        <Text style={styles.name}>{module.name}</Text>
      </Pressable>
    </Animated.View>
  )
}

export function HubScreen({ navigation }: HubScreenProps) {
  const modules = getAllModules()

  const handlePress = (module: AppModule) => {
    navigation.navigate(module.id)
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Hub</Text>
      <FlatList
        data={modules}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <ModuleCard module={item} onPress={() => handlePress(item)} />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucun module chargé</Text>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: theme.primaryLight,
  },
  grid: { paddingHorizontal: 16 },
  card: {
    flex: 1,
    backgroundColor: theme.surface,
    margin: 8,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  icon: { fontSize: 40, marginBottom: 8 },
  name: { fontSize: 16, fontWeight: '600', color: theme.text },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: theme.textMuted,
  },
})
