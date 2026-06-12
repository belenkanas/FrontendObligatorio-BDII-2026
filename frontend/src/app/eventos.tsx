import api from '../../services/api';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Evento = {
  estadioNombre: string;
  estadioDireccionPais: string;
  estadioDireccionCiudad: string;
  fechaHoraPartido: string;
  nombrePaisEquipoLocal: string;
  nombrePaisEquipoVisitante: string;
};

type Sector = {
  id: {
    nombreSector: string;
    estadioNombre: string;
    estadioDireccionPais: string;
    estadioDireccionCiudad: string;
    fechaHoraPartido: string;
  };
  costo: number;
};

export default function EventosScreen() {
  const { usuario } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalEventoVisible, setModalEventoVisible] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<Evento | null>(null);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [loadingSectores, setLoadingSectores] = useState(false);
  const [sectorSeleccionado, setSectorSeleccionado] = useState<Sector | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [comprando, setComprando] = useState(false);
  const [compraError, setCompraError] = useState('');
  const [compraExito, setCompraExito] = useState('');
  const [modalExitoVisible, setModalExitoVisible] = useState(false);
  const [resumenCompra, setResumenCompra] = useState<any>(null);
  const [tabActiva, setTabActiva] = useState<'proximos' | 'pasados'>('proximos');

  useEffect(() => {
    cargarEventos();
  }, []);

  const cargarEventos = async () => {
    try {
      const response = await api.get('/eventos');
      const data = Array.isArray(response.data) ? response.data : [];
      setEventos(data.map((e: any) => e.id ?? e));
    } catch {
      setError('No pudimos cargar los eventos');
    } finally {
      setLoading(false);
    }
  };

  const ahora = new Date();
  const eventosFuturos = eventos.filter(e => new Date(e.fechaHoraPartido) > ahora);
  const eventosPasados = eventos.filter(e => new Date(e.fechaHoraPartido) <= ahora);

  const abrirEvento = async (evento: Evento) => {
    setEventoSeleccionado(evento);
    setSectorSeleccionado(null);
    setCantidad(1);
    setCompraError('');
    setCompraExito('');
    setModalEventoVisible(true);
    setLoadingSectores(true);
    try {
      const response = await api.get(
        `/sector-eventos/${evento.estadioNombre}/${evento.estadioDireccionPais}/${evento.estadioDireccionCiudad}/${evento.fechaHoraPartido}/${evento.nombrePaisEquipoLocal}/${evento.nombrePaisEquipoVisitante}/sectores`
      );
      setSectores(Array.isArray(response.data) ? response.data : []);
    } catch {
      setSectores([]);
    } finally {
      setLoadingSectores(false);
    }
  };

  const confirmarCompra = async () => {
    if (!sectorSeleccionado || !eventoSeleccionado) return;
    setCompraError('');
    setComprando(true);
    try {
      const response = await api.post('/ventas/comprar', {
        idGeneral: usuario.idPerfil,
        nombreSector: sectorSeleccionado.id.nombreSector,
        estadioNombre: eventoSeleccionado.estadioNombre,
        estadioDireccionPais: eventoSeleccionado.estadioDireccionPais,
        estadioDireccionCiudad: eventoSeleccionado.estadioDireccionCiudad,
        fechaHoraPartido: eventoSeleccionado.fechaHoraPartido,
        nombrePaisEquipoLocal: eventoSeleccionado.nombrePaisEquipoLocal,
        nombrePaisEquipoVisitante: eventoSeleccionado.nombrePaisEquipoVisitante,
        cantidad,
      });
      setResumenCompra(response.data);
      setModalExitoVisible(true);     
      setModalEventoVisible(false); 
      setSectorSeleccionado(null);
    } catch (err: any) {
      setCompraError(err.response?.data || 'Error al realizar la compra');
    } finally {
      setComprando(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-UY', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Eventos disponibles</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tabActiva === 'proximos' && styles.tabActiva]}
          onPress={() => setTabActiva('proximos')}
        >
          <Text style={[styles.tabTexto, tabActiva === 'proximos' && styles.tabTextoActivo]}>
            Próximos ({eventosFuturos.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tabActiva === 'pasados' && styles.tabActiva]}
          onPress={() => setTabActiva('pasados')}
        >
          <Text style={[styles.tabTexto, tabActiva === 'pasados' && styles.tabTextoActivo]}>
            Pasados ({eventosPasados.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color="#1a73e8" />
        </View>
      ) : error ? (
        <View style={styles.centro}>
          <Text style={styles.errorTexto}>{error}</Text>
        </View>
      ) : eventos.length === 0 ? (
        <View style={styles.centro}>
          <Text style={styles.vacitoTexto}>No hay eventos disponibles por el momento</Text>
        </View>
      ) : (
        <FlatList
          data={tabActiva === 'proximos' ? eventosFuturos : eventosPasados}
          keyExtractor={(item) => `${item.estadioNombre}-${item.fechaHoraPartido}`}
          contentContainerStyle={{ paddingBottom: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardPartido}>
                  {item.nombrePaisEquipoLocal} vs {item.nombrePaisEquipoVisitante}
                </Text>
                <Text style={styles.cardDetalle}>{item.estadioNombre}</Text>
                <Text style={styles.cardDetalle}>📍 {item.estadioDireccionCiudad}, {item.estadioDireccionPais}</Text>
                <Text style={styles.cardDetalle}>{formatearFecha(item.fechaHoraPartido)}</Text>
              </View>
                {tabActiva === 'proximos' && (
                  <TouchableOpacity style={styles.botonComprar} onPress={() => abrirEvento(item)}>
                    <Text style={styles.botonComprarTexto}>Comprar</Text>
                  </TouchableOpacity>
                )}
            </View>
          )}
        />
      )}

      <Modal visible={modalEventoVisible} animationType="slide" onRequestClose={() => setModalEventoVisible(false)}>
        <View style={styles.modal}>
          <Text style={styles.modalTitulo}>Comprar entradas</Text> 
          {eventoSeleccionado && (
            <>
              <Text style={styles.modalTitulo}>
                {eventoSeleccionado.nombrePaisEquipoLocal} vs {eventoSeleccionado.nombrePaisEquipoVisitante}
              </Text>
              <Text style={styles.modalSubtitulo}>
                {eventoSeleccionado.estadioNombre} — {formatearFecha(eventoSeleccionado.fechaHoraPartido)}
              </Text>

              <Text style={styles.seccion}>Sectores disponibles</Text>

              {loadingSectores ? (
                <ActivityIndicator color="#1a73e8" />
              ) : sectores.length === 0 ? (
                <Text style={styles.vacitoTexto}>No hay sectores habilitados</Text>
              ) : (
                sectores.map((sector) => (
                  <TouchableOpacity
                    key={sector.id.nombreSector}
                    style={[styles.sectorCard, sectorSeleccionado?.id.nombreSector === sector.id.nombreSector && styles.sectorSeleccionado]}
                    onPress={() => { setSectorSeleccionado(sector); setCompraError(''); setCompraExito(''); }}
                  >
                    <Text style={styles.sectorNombre}>Sector {sector.id.nombreSector}</Text>
                    <Text style={styles.sectorPrecio}>${sector.costo}</Text>
                  </TouchableOpacity>
                ))
              )}

              {sectorSeleccionado && (
                <View style={styles.compraContainer}>
                  <Text style={styles.seccion}>Cantidad (máx. 5)</Text>
                  <View style={styles.cantidadRow}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <TouchableOpacity
                        key={n}
                        style={[styles.cantidadBtn, cantidad === n && styles.cantidadBtnSeleccionado]}
                        onPress={() => setCantidad(n)}
                      >
                        <Text style={[styles.cantidadTexto, cantidad === n && styles.cantidadTextoSeleccionado]}>{n}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.total}>
                    Total: ${(sectorSeleccionado.costo * cantidad * 1.05).toFixed(2)} (incluye 5% comisión)
                  </Text>

                  {compraError ? <Text style={styles.errorTexto}>{compraError}</Text> : null}
                  {compraExito ? <Text style={styles.exitoTexto}>{compraExito}</Text> : null}

                  <TouchableOpacity
                    style={[styles.botonComprar, comprando && { opacity: 0.6 }]}
                    onPress={confirmarCompra}
                    disabled={comprando}
                  >
                    <Text style={styles.botonComprarTexto}>
                      {comprando ? 'Procesando...' : 'Confirmar compra'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity style={styles.botonCerrar} onPress={() => setModalEventoVisible(false)}>
                <Text style={styles.botonCerrarTexto}>Cerrar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>

      <Modal visible={modalExitoVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalExito}>
            <Text style={styles.modalExitoTitulo}>¡Compra exitosa!</Text>
            {resumenCompra && (
              <>
                <Text style={styles.modalExitoTexto}>Entradas: {resumenCompra.cantidad}</Text>
                <Text style={styles.modalExitoTexto}>Total: ${resumenCompra.costoFinal}</Text>
              </>
            )}
            <TouchableOpacity
              style={styles.botonOk}
              onPress={() => { setModalExitoVisible(false); setResumenCompra(null); }}
            >
              <Text style={styles.botonOkTexto}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f6f8fc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  botonTickets: { backgroundColor: '#0f766e', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 },
  botonTicketsTexto: { color: '#fff', fontWeight: '700' },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  vacitoTexto: { color: '#6b7280', textAlign: 'center' },
  errorTexto: { color: '#b91c1c', textAlign: 'center' },
  exitoTexto: { color: '#15803d', textAlign: 'center', marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, flexDirection: 'row', alignItems: 'center' },  cardPartido: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
  cardDetalle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  modal: { flex: 1, padding: 24, backgroundColor: '#fff' },
  modalTitulo: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginTop: 40, marginBottom: 4 },
  modalSubtitulo: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  seccion: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 10, marginTop: 16 },
  sectorCard: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' },
  sectorSeleccionado: { borderColor: '#1a73e8', backgroundColor: '#eff6ff' },
  sectorNombre: { fontSize: 16, fontWeight: '600', color: '#111827' },
  sectorPrecio: { fontSize: 16, fontWeight: '700', color: '#0f766e' },
  compraContainer: { marginTop: 16 },
  cantidadRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  cantidadBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  cantidadBtnSeleccionado: { backgroundColor: '#1a73e8', borderColor: '#1a73e8' },
  cantidadTexto: { fontSize: 16, color: '#374151' },
  cantidadTextoSeleccionado: { color: '#fff', fontWeight: '700' },
  total: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  botonComprar: { backgroundColor: '#1a73e8', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 999, alignItems: 'center', justifyContent: 'center', minWidth: 92 },  botonComprarTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },
  botonCerrar: { marginTop: 16, alignItems: 'center' },
  botonCerrarTexto: { color: '#6b7280', fontSize: 16 },
  cardInfo: { flex: 1, paddingRight: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modalExito: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '80%', alignItems: 'center' },
  modalExitoTitulo: { fontSize: 22, fontWeight: 'bold', color: '#15803d', marginBottom: 16 },
  modalExitoTexto: { fontSize: 16, color: '#374151', marginBottom: 8 },
  botonOk: { backgroundColor: '#1a73e8', padding: 14, borderRadius: 8, marginTop: 16, width: '100%', alignItems: 'center' },
  botonOkTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },
  tabs: { flexDirection: 'row', marginBottom: 16, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb' },
  tab: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#fff' },
  tabActiva: { backgroundColor: '#1a73e8' },
  tabTexto: { fontWeight: '600', color: '#6b7280' },
  tabTextoActivo: { color: '#fff' },
});