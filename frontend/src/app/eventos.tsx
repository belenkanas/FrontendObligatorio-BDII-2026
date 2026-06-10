import api from '../../services/api';
import { useEffect, useState } from 'react';
import { Alert, ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Evento = {
  id: number | string;
  nombre: string;
  estadio?: string;
  fecha?: string;
  ubicacion?: string;
  precio?: number | string;
};

function normalizarEventos(data: any): Evento[] {
  const eventos = Array.isArray(data) ? data : data?.eventos ?? data?.items ?? [];

  const formatoEvento = (evento: any) => {
    const estadio = evento?.id?.estadioNombre ?? evento?.estadio ?? evento?.stadium;
    const fechaRaw = evento?.id?.fechaHoraPartido ?? evento?.fecha ?? evento?.date;
    const fecha = fechaRaw ? new Date(fechaRaw).toLocaleDateString('es-UY', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }) : null;
    return [estadio, fecha].filter(Boolean).join(' - ');
  };

  return eventos
    .map((evento: any, index: number) => ({
      id: JSON.stringify(evento?.id) ?? index,
      nombre: formatoEvento(evento) || 'Evento sin nombre',
      estadio: evento?.id?.estadioNombre ?? evento?.estadio,
      fecha: evento?.id?.fechaHoraPartido ?? evento?.fecha,
      ubicacion: evento?.id?.estadioDireccionCiudad ?? evento?.ubicacion,
      precio: evento?.precio ?? evento?.valor,
    }))
    .filter((evento: Evento) => evento.nombre);
}

export default function EventosScreen() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarEventos = async () => {
      try {
        setError('');
        const response = await api.get('/eventos');
        setEventos(normalizarEventos(response.data));
      } catch (err) {
        setError('No pudimos cargar los eventos disponibles.');
      } finally {
        setLoading(false);
      }
    };
    cargarEventos();
  }, []);

  const comprarEvento = (evento: Evento) => {
    Alert.alert('Compra', `Seleccionaste ${evento.nombre}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Eventos disponibles</Text>
      <Text style={styles.subtitulo}>Elegí el evento que querés comprar.</Text>
      {loading ? (
        <View style={styles.estadoContainer}>
          <ActivityIndicator size="large" color="#1a73e8" />
          <Text style={styles.estadoTexto}>Cargando eventos...</Text>
        </View>
      ) : error ? (
        <View style={styles.estadoContainer}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : eventos.length === 0 ? (
        <View style={styles.estadoContainer}>
          <Text style={styles.estadoTexto}>No hay eventos disponibles en este momento.</Text>
        </View>
      ) : (
        <FlatList
          data={eventos}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitulo}>{item.nombre}</Text>
                {item.ubicacion ? <Text style={styles.cardDetalle}>📍 {item.ubicacion}</Text> : null}
                {item.precio !== undefined && item.precio !== null ? (
                  <Text style={styles.cardPrecio}>${item.precio}</Text>
                ) : null}
              </View>
              <TouchableOpacity style={styles.botonComprar} onPress={() => comprarEvento(item)}>
                <Text style={styles.botonComprarTexto}>Comprar</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f6f8fc',
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitulo: {
    marginTop: 6,
    marginBottom: 20,
    fontSize: 14,
    color: '#6b7280',
  },
  lista: {
    paddingBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardInfo: {
    flex: 1,
    paddingRight: 12,
  },
  cardTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  cardDetalle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  cardPrecio: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#0f766e',
  },
  botonComprar: {
    backgroundColor: '#1a73e8',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 92,
  },
  botonComprarTexto: {
    color: '#fff',
    fontWeight: '700',
  },
  estadoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  estadoTexto: {
    marginTop: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  error: {
    color: '#b91c1c',
    textAlign: 'center',
  },
});