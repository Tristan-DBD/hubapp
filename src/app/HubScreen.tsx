import React from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { getAllModules } from '../core/module-registry'
import { theme } from '../core/theme'
import type { AppModule } from '../core/types'

interface HubScreenProps {
  navigation: any;
}

function ModuleCard({ module, onPress }: { module: AppModule; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.icon}>{module.icon}</Text>
      <Text style={styles.name}>{module.name}</Text>
    </TouchableOpacity>
  )
}

export function HubScreen({ navigation }: HubScreenProps) {
  const modules = getAllModules()

  const handlePress = (module: AppModule) => {
    navigation.navigate(module.id)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hub</Text>
      <FlatList
        data={modules}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <ModuleCard module={item} onPress={() => handlePress(item)} />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No modules loaded</Text>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: theme.primaryLight },
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
  empty: { textAlign: 'center', marginTop: 40, fontSize: 16, color: theme.textMuted },
})
