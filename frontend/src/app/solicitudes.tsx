import api from '../../services/api';
import { useAuth } from '@/context/AuthContext';
import { use, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

type Transferencia = {
  id: { fechaHora: string; idEntrada: number };
  estado: string;
  idGeneralRealiza: number;
  idGeneralRecibe: number;
  mailRealiza?: string;
  entrada?: any;
};

export default function SolicitudesScreen() {
  const { usuario } = useAuth();
  const [solicitudes, setSolicitudes] = useState<Transferencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondiendo, setRespondiendo] = useState<string | null>(null);

  /*useFocusEffect(
    useCallback(() => {
      cargarSolicitudes();
    }, [])
  );*/

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const obtenerMail = async (idGeneral: number): Promise<string> => {
    try {
      const response = await api.get(`/perfiles/${idGeneral}`);
      return response.data?.usuario?.mail ?? `Usuario #${idGeneral}`;
    } catch {
      return `Usuario #${idGeneral}`;
    }
  };

  const obtenerEntrada = async (idEntrada: number) => {
    try {
      const response = await api.get(`/entradas/${idEntrada}`);
      return response.data;
    } catch {
      return null;
    }
  };

  const cargarSolicitudes = async () => {
    try {
      const response = await api.get(`/transferencias-entrada/pendientes/${usuario.idPerfil}`);
      const data = Array.isArray(response.data) ? response.data : [];
      const conDatos = await Promise.all(
        data.map(async (t: Transferencia) => ({
          ...t,
          mailRealiza: await obtenerMail(t.idGeneralRealiza),
          entrada: await obtenerEntrada(t.id.idEntrada),
        }))
      );
      setSolicitudes(conDatos);
    } catch {
      setSolicitudes([]);
    } finally {
      setLoading(false);
    }
  };

  const responder = async (transf: Transferencia, respuesta: 'aceptar' | 'rechazar') => {
    const key = `${transf.id.fechaHora}-${transf.id.idEntrada}`;
    setRespondiendo(key);
    try {
      await api.post('/transferencias-entrada/responder', {
        idEntrada: transf.id.idEntrada,
        fechaHora: transf.id.fechaHora,
        respuesta,
      });
      cargarSolicitudes();
    } catch {
    } finally {
      setRespondiendo(null);
    }
  };

  const formatearFecha = (fecha: string) => new Date(fecha).toLocaleDateString('es-UY', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Solicitudes</Text>

      {loading ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color="#1a73e8" />
        </View>
      ) : (
        <FlatList
          data={solicitudes}
          keyExtractor={(item) => `${item.id.fechaHora}-${item.id.idEntrada}`}
          contentContainerStyle={{ paddingBottom: 16 }}
          renderItem={({ item }) => {
            const key = `${item.id.fechaHora}-${item.id.idEntrada}`;
            return (
              <View style={styles.card}>
                {item.entrada && (
                  <>
                    <Text style={styles.cardTitulo}>
                      {item.entrada.nombrePaisEquipoLocal} vs {item.entrada.nombrePaisEquipoVisitante}
                    </Text>
                    <Text style={styles.detalle}>{item.entrada.estadioNombre} — Sector {item.entrada.nombreSector}</Text>
                    <Text style={styles.detalle}>Partido: {formatearFecha(item.entrada.fechaHoraPartido)}</Text>
                  </>
                )}
                <Text style={styles.detalle}>De: {item.mailRealiza}</Text>
                <Text style={styles.detalle}>Solicitada: {formatearFecha(item.id.fechaHora)}</Text>
                <View style={styles.botones}>
                  <TouchableOpacity
                    style={[styles.botonAceptar, respondiendo === key && { opacity: 0.6 }]}
                    onPress={() => responder(item, 'aceptar')}
                    disabled={respondiendo === key}
                  >
                    <Text style={styles.botonTexto}>Aceptar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.botonRechazar, respondiendo === key && { opacity: 0.6 }]}
                    onPress={() => responder(item, 'rechazar')}
                    disabled={respondiendo === key}
                  >
                    <Text style={styles.botonTexto}>Rechazar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.centro}>
              <Text style={styles.vacio}>No tenes solicitudes pendientes</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f6f8fc' },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  subtitulo: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  vacio: { color: '#6b7280', textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  cardTitulo: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6 },
  detalle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  botones: { flexDirection: 'row', gap: 8, marginTop: 12 },
  botonAceptar: { flex: 1, backgroundColor: '#15803d', padding: 12, borderRadius: 8, alignItems: 'center' },
  botonRechazar: { flex: 1, backgroundColor: '#b91c1c', padding: 12, borderRadius: 8, alignItems: 'center' },
  botonTexto: { color: '#fff', fontWeight: '700' },
});