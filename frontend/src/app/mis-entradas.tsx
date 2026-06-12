import api from '../../services/api';
import { useAuth } from '@/context/AuthContext';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

type Entrada = {
  id: number;
  estado: string;
  cantTransferida: number;
  nombreSector: string;
  estadioNombre: string;
  estadioDireccionCiudad: string;
  estadioDireccionPais: string;
  fechaHoraPartido: string;
  nombrePaisEquipoLocal: string;
  nombrePaisEquipoVisitante: string;
  idVenta: number;
};

type Venta = {
  idVenta: number;
  fechaHora: string;
  costoFinal: number;
  entradas: Entrada[];
};

export default function MisEntradasScreen() {
  const { usuario } = useAuth();
  const router = useRouter();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabActiva, setTabActiva] = useState<'activos' | 'historial'>('activos');

  useEffect(() => {
    cargarEntradas();
  }, []);

  const cargarEntradas = async () => {
    try {
      // traer todas las entradas donde soy propietario
      const entradasRes = await api.get(`/entradas/usuario/${usuario.idPerfil}`);
      const todasEntradas = Array.isArray(entradasRes.data) ? entradasRes.data : [];

      // agrupar por idVenta
      const ventasMap: Record<number, any> = {};
      for (const entrada of todasEntradas) {
        const idVenta = entrada.idVenta;
        if (!ventasMap[idVenta]) {
          // traer info de la venta
          const ventaRes = await api.get(`/ventas/${idVenta}`);
          ventasMap[idVenta] = {
            idVenta,
            fechaHora: ventaRes.data?.fechaHora,
            costoFinal: ventaRes.data?.costoFinal,
            entradas: [],
          };
        }
        ventasMap[idVenta].entradas.push(entrada);
      }

      setVentas(Object.values(ventasMap));
    } catch {
      setVentas([]);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha: string) => new Date(fecha).toLocaleDateString('es-UY', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const contarEstados = (entradas: Entrada[]) => ({
    activas: entradas.filter(e => e.estado === 'activo').length,
    enTransferencia: entradas.filter(e => e.estado === 'en_transferencia').length,
    transferidas: entradas.filter(e => e.estado === 'transferido').length,
    consumidas: entradas.filter(e => e.estado === 'consumido').length,
    noConsumidas: entradas.filter(e => e.estado === 'no_consumida').length,
  });

  const totalTransferencias = (entradas: Entrada[]) =>
    entradas.reduce((acc, e) => acc + (e.cantTransferida ?? 0), 0);

  const ahora = new Date();
  const esActiva = (venta: Venta) =>
    venta.entradas.some(e => 
      ['activo', 'en_transferencia'].includes(e.estado) && 
      new Date(e.fechaHoraPartido) > ahora
    );

  const ventasActivas = ventas.filter(esActiva);
  const ventasHistorial = ventas.filter(v => !esActiva(v));

  const renderVenta = ({ item }: { item: Venta }) => {
    if (item.entradas.length === 0) return null;
    const primera = item.entradas[0];
    const { activas, enTransferencia, transferidas, consumidas, noConsumidas } = contarEstados(item.entradas);
    const totalTransf = totalTransferencias(item.entradas);

    return (
        <TouchableOpacity style={styles.card} onPress={() => {
            const { activas, enTransferencia } = contarEstados(item.entradas);
            if (activas > 0 || enTransferencia > 0) {
              router.push(`/venta/${item.idVenta}` as any);
          }}}>
        <View style={styles.cardHeader}>
          <Text style={styles.partido}>
            {primera.nombrePaisEquipoLocal} vs {primera.nombrePaisEquipoVisitante}
          </Text>
        </View>
        <Text style={styles.detalle}>{primera.estadioNombre} — Sector {primera.nombreSector}</Text>
        <Text style={styles.detalle}>📍 {primera.estadioDireccionCiudad}, {primera.estadioDireccionPais}</Text>
        <Text style={styles.detalle}>{formatearFecha(primera.fechaHoraPartido)}</Text>
        <Text style={styles.detalle}>Comprado el {formatearFecha(item.fechaHora)}</Text>
        <Text style={styles.detalle}>{totalTransf} transferencia{totalTransf !== 1 ? 's' : ''} realizadas</Text>

        <View style={styles.estadosRow}>
          {activas > 0 && <Text style={[styles.badge, styles.badgeActivo]}>{activas} activa{activas > 1 ? 's' : ''}</Text>}
          {enTransferencia > 0 && <Text style={[styles.badge, styles.badgeTransferencia]}>{enTransferencia} en transferencia</Text>}
          {transferidas > 0 && <Text style={[styles.badge, styles.badgeTransferido]}>{transferidas} transferida{transferidas > 1 ? 's' : ''}</Text>}
          {consumidas > 0 && <Text style={[styles.badge, styles.badgeConsumido]}>{consumidas} consumida{consumidas > 1 ? 's' : ''}</Text>}
          {noConsumidas > 0 && <Text style={[styles.badge, styles.badgeNoConsumida]}>{noConsumidas} no consumida{noConsumidas > 1 ? 's' : ''}</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  const totalActivas = ventasActivas.reduce((acc, v) => acc + contarEstados(v.entradas).activas, 0);

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tabActiva === 'activos' && styles.tabActiva]}
          onPress={() => setTabActiva('activos')}
        >
          <Text style={[styles.tabTexto, tabActiva === 'activos' && styles.tabTextoActivo]}>
            Activos ({totalActivas})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tabActiva === 'historial' && styles.tabActiva]}
          onPress={() => setTabActiva('historial')}
        >
          <Text style={[styles.tabTexto, tabActiva === 'historial' && styles.tabTextoActivo]}>
            Historial ({ventasHistorial.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color="#1a73e8" />
        </View>
      ) : (
        <FlatList
          data={tabActiva === 'activos' ? ventasActivas : ventasHistorial}
          keyExtractor={(item) => String(item.idVenta)}
          contentContainerStyle={{ paddingBottom: 16 }}
          renderItem={renderVenta}
          ListEmptyComponent={
            <View style={styles.centro}>
              <Text style={styles.vacio}>No hay tickets en esta sección</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f6f8fc' },
  botonVolver: { marginBottom: 12 },
  botonVolverTexto: { color: '#1a73e8', fontSize: 16 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  tabs: { flexDirection: 'row', marginBottom: 16, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb' },
  tab: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#fff' },
  tabActiva: { backgroundColor: '#1a73e8' },
  tabTexto: { fontWeight: '600', color: '#6b7280' },
  tabTextoActivo: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  partido: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1 },
  detalle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  estadosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, fontSize: 12, fontWeight: '700', overflow: 'hidden' },
  badgeActivo: { backgroundColor: '#dcfce7', color: '#15803d' },
  badgeTransferencia: { backgroundColor: '#fef3c7', color: '#b45309' },
  badgeTransferido: { backgroundColor: '#f3f4f6', color: '#6b7280' },
  badgeConsumido: { backgroundColor: '#dbeafe', color: '#1d4ed8' },
  badgeNoConsumida: { backgroundColor: '#fee2e2', color: '#b91c1c' },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  vacio: { color: '#6b7280', textAlign: 'center' },
});