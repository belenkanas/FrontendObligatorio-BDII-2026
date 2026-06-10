import { View, Text, StyleSheet } from 'react-native';

export default function EventosScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Eventos disponibles</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  titulo: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
});