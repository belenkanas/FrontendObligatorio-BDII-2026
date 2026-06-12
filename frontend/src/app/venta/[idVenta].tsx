import api from '../../../services/api';
import { useAuth } from '@/context/AuthContext';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Entrada = {
  id: number;
  estado: string;
  cantTransferida: number;
  nombreSector: string;
  estadioNombre: string;
  estadioDireccionCiudad: string;
  fechaHoraPartido: string;
  nombrePaisEquipoLocal: string;
  nombrePaisEquipoVisitante: string;
};

export default function VentaDetalleScreen() {
  const { idVenta } = useLocalSearchParams();
  const { usuario } = useAuth();
  const router = useRouter();
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarTransferencia, setMostrarTransferencia] = useState(false);
  const [mailDestinatario, setMailDestinatario] = useState('');
  const [cantidadTransferir, setCantidadTransferir] = useState(1);
  const [transfError, setTransfError] = useState('');
  const [transfExito, setTransfExito] = useState('');
  const [transfiriendo, setTransfiriendo] = useState(false);
  const navigation = useNavigation();


  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => router.push('/mis-entradas')} style={{ marginLeft: 8 }}>
          <Text style={{ color: '#1a73e8', fontSize: 16 }}>←</Text>
        </TouchableOpacity>
      ),
    });
    cargarEntradas();
  }, [idVenta]);

  const cargarEntradas = async () => {
    try {
      // si es una entrada transferida, buscar por id de entrada directo
      if (String(idVenta).startsWith('transferida-')) {
        const idEntrada = String(idVenta).replace('transferida-', '');
        const response = await api.get(`/entradas/${idEntrada}`);
        setEntradas(response.data ? [response.data] : []);
      } else {
        const response = await api.get(`/entradas/venta/${idVenta}`);
        setEntradas(Array.isArray(response.data) ? response.data : []);
      }
    } catch {
      setEntradas([]);
    } finally {
      setLoading(false);
    }
  };

  const entradasActivas = entradas.filter(e => e.estado === 'activo');
  const entradasEnTransferencia = entradas.filter(e => e.estado === 'en_transferencia');
  const entradasInactivas = entradas.filter(e => ['transferido', 'consumido', 'no_consumida'].includes(e.estado));

  const formatearFecha = (fecha: string) => new Date(fecha).toLocaleDateString('es-UY', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const handleTransferir = async () => {
    setTransfError('');
    setTransfExito('');

    if (!mailDestinatario.trim()) {
      setTransfError('Ingresa el correo electrónico del destinatario');
      return;
    }
    if (mailDestinatario.trim() === usuario.mail) {
      setTransfError('No podes transferirte a vos mismo');
      return;
    }
    if (cantidadTransferir < 1 || cantidadTransferir > entradasActivas.length) {
      setTransfError(`Podes transferir entre 1 y ${entradasActivas.length} entradas`);
      return;
    }

    setTransfiriendo(true);
    try {
      const perfilRes = await api.get(`/perfiles/usuario/${mailDestinatario.trim()}`);
      const perfiles = Array.isArray(perfilRes.data) ? perfilRes.data : [];
      if (perfiles.length === 0) throw new Error('Usuario no encontrado');
      const idGeneralRecibe = perfiles[0].id;

      const entradasATransferir = entradasActivas.slice(0, cantidadTransferir);
      await Promise.all(
        entradasATransferir.map(entrada =>
          api.post('/transferencias-entrada/iniciar', {
            idEntrada: entrada.id,
            idGeneralRealiza: usuario.idPerfil,
            idGeneralRecibe,
          })
        )
      );

      setTransfExito(`${cantidadTransferir} entradas enviadas a ${mailDestinatario}`);
      setMailDestinatario('');
      setMostrarTransferencia(false);
      cargarEntradas();
    } catch (err: any) {
      setTransfError(err.response?.data || err.message || 'Error al transferir');
    } finally {
      setTransfiriendo(false);
    }
  };

  if (loading) return <View style={styles.centro}><ActivityIndicator size="large" color="#1a73e8" /></View>;

  return (
    <ScrollView style={styles.container}>

      <Text style={styles.seccion}>Entradas activas: {entradasActivas.length}</Text>
      {entradasActivas.map((entrada, index) => (
        <View key={entrada.id} style={styles.entradaCard}>
          <View style={styles.entradaInfo}>
            <Text style={styles.entradaNombre}>Entrada {index + 1}</Text>
            <Text style={styles.entradaDetalle}>{entrada.nombrePaisEquipoLocal} vs {entrada.nombrePaisEquipoVisitante}</Text>
            <Text style={styles.entradaDetalle}>Sector {entrada.nombreSector} — {entrada.estadioNombre}</Text>
            <Text style={styles.entradaDetalle}>{formatearFecha(entrada.fechaHoraPartido)}</Text>
          </View>
          <TouchableOpacity style={styles.botonQr} onPress={() => router.push(`/entrada/${entrada.id}?idVenta=${idVenta}` as any)}>
            <Text style={styles.botonQrTexto}>Abrir QR</Text>
          </TouchableOpacity>
        </View>
      ))}

      {entradasEnTransferencia.length > 0 && (
        <>
          <Text style={styles.seccion}>En transferencia: {entradasEnTransferencia.length}</Text>
          {entradasEnTransferencia.map((entrada, index) => (
            <View key={entrada.id} style={styles.entradaCard}>
              <View style={styles.entradaInfo}>
                <Text style={styles.entradaNombre}>Entrada {entradasActivas.length + index + 1}</Text>
                <Text style={styles.entradaDetalle}>{entrada.nombrePaisEquipoLocal} vs {entrada.nombrePaisEquipoVisitante}</Text>
                <Text style={styles.entradaDetalle}>Sector {entrada.nombreSector} — {entrada.estadioNombre}</Text>
                <Text style={styles.entradaDetalle}>{formatearFecha(entrada.fechaHoraPartido)}</Text>
              </View>
              <Text style={{ color: '#b45309', fontWeight: '700', fontSize: 12 }}>EN TRANSFERENCIA</Text>
            </View>
          ))}
        </>
      )}

      {entradasActivas.length > 0 && (
        <TouchableOpacity
          style={styles.botonTransferir}
          onPress={() => { setMostrarTransferencia(!mostrarTransferencia); setTransfError(''); setTransfExito(''); }}
        >
          <Text style={styles.botonTransferirTexto}>Transferir entradas</Text>
        </TouchableOpacity>
      )}

      {mostrarTransferencia && (
        <View style={styles.transferencia}>
          <Text style={styles.seccion}>¿A quién transferir?</Text>
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico del destinatario"
            value={mailDestinatario}
            onChangeText={setMailDestinatario}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={styles.seccion}>¿Cuántas entradas? (máx. {entradasActivas.length})</Text>
          <View style={styles.cantidadRow}>
            {entradasActivas.map((_, i) => (
              <TouchableOpacity
                key={i + 1}
                style={[styles.cantidadBtn, cantidadTransferir === i + 1 && styles.cantidadBtnSeleccionado]}
                onPress={() => setCantidadTransferir(i + 1)}
              >
                <Text style={[styles.cantidadTexto, cantidadTransferir === i + 1 && styles.cantidadTextoSeleccionado]}>
                  {i + 1}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {transfError ? <Text style={styles.error}>{transfError}</Text> : null}
          {transfExito ? <Text style={styles.exito}>{transfExito}</Text> : null}
          <TouchableOpacity
            style={[styles.botonConfirmar, transfiriendo && { opacity: 0.6 }]}
            onPress={handleTransferir}
            disabled={transfiriendo}
          >
            <Text style={styles.botonConfirmarTexto}>
              {transfiriendo ? 'Enviando...' : 'Confirmar transferencia'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMostrarTransferencia(false)} style={{ alignItems: 'center', marginTop: 12 }}>
            <Text style={{ color: '#6b7280' }}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

      {entradasInactivas.length > 0 && (
        <>
          <Text style={[styles.seccion, { marginTop: 24 }]}>Otras entradas</Text>
          {entradasInactivas.map((entrada, index) => (
            <View key={entrada.id} style={styles.entradaCardGris}>
              <View>
                <Text style={styles.entradaNombreGris}>Entrada {entradasActivas.length + entradasEnTransferencia.length + index + 1}</Text>
                <Text style={styles.entradaDetalleGris}>{entrada.nombrePaisEquipoLocal} vs {entrada.nombrePaisEquipoVisitante}</Text>
                <Text style={styles.entradaDetalleGris}>Sector {entrada.nombreSector}</Text>
              </View>
              <Text style={[styles.estadoBadge, { color: '#6b7280' }]}>
                {entrada.estado.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          ))}
        </>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f6f8fc' },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  botonVolver: { marginBottom: 12 },
  botonVolverTexto: { color: '#1a73e8', fontSize: 16 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  seccion: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 10, marginTop: 8 },
  entradaCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  entradaInfo: { flex: 1 },
  entradaNombre: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  entradaDetalle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  botonQr: { backgroundColor: '#374151', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
  botonQrTexto: { color: '#fff', fontWeight: '700' },
  botonTransferir: { backgroundColor: '#1a73e8', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 12, marginBottom: 8 },
  botonTransferirTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
  transferencia: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  cantidadRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  cantidadBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  cantidadBtnSeleccionado: { backgroundColor: '#1a73e8', borderColor: '#1a73e8' },
  cantidadTexto: { fontSize: 16, color: '#374151' },
  cantidadTextoSeleccionado: { color: '#fff', fontWeight: '700' },
  botonConfirmar: { backgroundColor: '#15803d', padding: 14, borderRadius: 12, alignItems: 'center' },
  botonConfirmarTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
  error: { color: '#b91c1c', marginBottom: 8 },
  exito: { color: '#15803d', marginBottom: 8 },
  entradaCardGris: { backgroundColor: '#f3f4f6', borderRadius: 12, padding: 14, marginBottom: 10, opacity: 0.7, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },  entradaNombreGris: { fontSize: 15, fontWeight: '700', color: '#9ca3af', marginBottom: 4 },
  entradaDetalleGris: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  estadoBadge: { fontSize: 12, fontWeight: '700', marginTop: 6 },
});