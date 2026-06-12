import api from '../../services/api';
import { useAuth } from '@/context/AuthContext';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

type Transferencia = {
  id: { fechaHora: string; idEntrada: number };
  estado: string;
  idGeneralRealiza: number;
  idGeneralRecibe: number;
  mailRealiza?: string;
  mailRecibe?: string;
  entrada?: any;
};

const COLORES_ESTADO: Record<string, string> = {
  pendiente: '#b45309',
  aceptado: '#15803d',
  rechazado: '#b91c1c',
};

export default function MisTransaccionesScreen() {
  const { usuario } = useAuth();
  const [transacciones, setTransacciones] = useState<Transferencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabActiva, setTabActiva] = useState<'enviadas' | 'recibidas'>('enviadas');
  const enviadas = transacciones.filter(t => t.idGeneralRealiza === usuario?.idPerfil);
  const recibidas = transacciones.filter(t => t.idGeneralRecibe === usuario?.idPerfil);

  useFocusEffect(
    useCallback(() => {
      if (usuario?.idPerfil) {
        cargarHistorial();
      }
    }, [usuario])
  );

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

  const cargarHistorial = async () => {
    try {
      const response = await api.get(`/transferencias-entrada/historial/${usuario.idPerfil}`);
      const data = Array.isArray(response.data) ? response.data : [];

      const conMails = await Promise.all(
        data.map(async (t: Transferencia) => ({
          ...t,
          mailRealiza: await obtenerMail(t.idGeneralRealiza),
          mailRecibe: await obtenerMail(t.idGeneralRecibe),
          entrada: await obtenerEntrada(t.id.idEntrada),
        }))
      );

      setTransacciones(conMails);
    } catch {
      setTransacciones([]);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha: string) => new Date(fecha).toLocaleDateString('es-UY', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const cancelarTransferencia = async (transf: Transferencia) => {
    try {
      await api.post('/transferencias-entrada/cancelar', {
        idEntrada: transf.id.idEntrada,
        fechaHora: transf.id.fechaHora,
      });
      cargarHistorial();
    } catch (err: any) {
      alert(err.response?.data || 'Error al cancelar');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Mis transacciones</Text>

        <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tabActiva === 'enviadas' && styles.tabActiva]} onPress={() => setTabActiva('enviadas')}>
            <Text style={[styles.tabTexto, tabActiva === 'enviadas' && styles.tabTextoActivo]}>Enviadas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tabActiva === 'recibidas' && styles.tabActiva]} onPress={() => setTabActiva('recibidas')}>
            <Text style={[styles.tabTexto, tabActiva === 'recibidas' && styles.tabTextoActivo]}>Recibidas</Text>
        </TouchableOpacity>
        </View>

      {loading ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color="#1a73e8" />
        </View>
      ) : (
        <FlatList
          data={tabActiva === 'enviadas' ? enviadas : recibidas}
          keyExtractor={(item) => `${item.id.fechaHora}-${item.id.idEntrada}`}
          contentContainerStyle={{ paddingBottom: 16 }}
          renderItem={({ item }) => {
            const esEnviada = item.idGeneralRealiza === usuario.idPerfil;
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitulo}>Entrada #{item.id.idEntrada} - {item.entrada?.nombrePaisEquipoLocal} vs {item.entrada?.nombrePaisEquipoVisitante}</Text>
                  <Text style={[styles.estado, { color: COLORES_ESTADO[item.estado] ?? '#374151' }]}>
                    {item.estado === 'aceptado' ? 'ACEPTADA' : item.estado === 'rechazado' ? 'RECHAZADA' : item.estado.toUpperCase()}
                  </Text>
                </View>
                {item.entrada && (
                    <>
                        <Text style={styles.detalle}>{item.entrada.estadioDireccionCiudad}, {item.entrada.estadioDireccionPais}</Text>
                        <Text style={styles.detalle}>{item.entrada.estadioNombre} — Sector: {item.entrada.nombreSector}</Text>
                        <Text style={styles.detalle}>Fecha y hora del partido: {formatearFecha(item.entrada.fechaHoraPartido)}</Text>
                    </>
                    )}
                <Text style={[styles.detalle, { fontWeight: '700' }]}>
                    {esEnviada ? 'Enviada a' : 'Recibida de'} {esEnviada ? item.mailRecibe : item.mailRealiza}
                </Text>
                <Text style={styles.detalle}>{formatearFecha(item.id.fechaHora)}</Text>
                {item.estado === 'pendiente' && esEnviada && (
                  <TouchableOpacity style={styles.botonCancelar} onPress={() => cancelarTransferencia(item)}>
                    <Text style={styles.botonCancelarTexto}>Cancelar transferencia</Text>
                  </TouchableOpacity>
                )}
              </View>
              
            );
          }}
          ListEmptyComponent={
            <View style={styles.centro}>
              <Text style={styles.vacio}>No realizaste transacciones aún</Text>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitulo: { fontSize: 16, fontWeight: '700', color: '#111827' },
  estado: { fontSize: 12, fontWeight: '700' },
  detalle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  tabs: { flexDirection: 'row', marginBottom: 16, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb' },
  tab: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#fff' },
  tabActiva: { backgroundColor: '#1a73e8' },
  tabTexto: { fontWeight: '600', color: '#6b7280' },
  tabTextoActivo: { color: '#fff' },
  botonCancelar: { backgroundColor: '#b91c1c', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  botonCancelarTexto: { color: '#fff', fontWeight: '700', fontSize: 13 },
});