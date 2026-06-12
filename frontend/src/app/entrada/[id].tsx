import api from '../../../services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export default function EntradaQRScreen() {
  const { id, idVenta } = useLocalSearchParams();
  const router = useRouter();
  const [qr, setQr] = useState<string | null>(null);
  const [caducidad, setCaducidad] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [segundos, setSegundos] = useState(30);
  const intervalRef = useRef<any>(null);
  const countdownRef = useRef<any>(null);

  useEffect(() => {
    generarToken();
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(countdownRef.current);
    };
  }, []);

  const generarToken = async () => {
    try {
      const response = await api.post(`/entradas/${id}/generar-token`);
      setQr(response.data.qr);
      setCaducidad(response.data.caducidad);
      setSegundos(30);
    } catch (err: any) {
      setError(err.response?.data || 'Error al generar el QR');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!qr) return;

    // regenerar cada 30 segundos
    intervalRef.current = setInterval(() => { generarToken(); }, 30000);

    // cuenta cada segundo para mostrar el tiempo restante
    countdownRef.current = setInterval(() => { setSegundos(s => {
        if (s <= 1) return 30;
        return s - 1;
      });
    }, 1000);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(countdownRef.current);
    };
  }, [qr]);

  if (loading) return <View style={styles.centro}><ActivityIndicator size="large" color="#1a73e8" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Tu entrada</Text>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : qr ? (
        <View style={styles.qrContainer}>
          <QRCode value={qr} size={250} />
          <Text style={styles.countdown}>Se regenera en {segundos}s</Text>
          <Text style={styles.qrTexto}>Mostrá este QR al funcionario en el evento</Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.botonVolver} onPress={() => router.push(`/venta/${idVenta}` as any)}>
        <Text style={styles.botonVolverTexto}>Cerrar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff', alignItems: 'center' },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 32, marginTop: 16 },
  qrContainer: { alignItems: 'center', padding: 24, backgroundColor: '#f9fafb', borderRadius: 16 },
  countdown: { fontSize: 16, color: '#1a73e8', fontWeight: '700', marginTop: 16 },
  qrTexto: { fontSize: 13, color: '#6b7280', marginTop: 8, textAlign: 'center' },
  error: { color: '#b91c1c', textAlign: 'center' },
  botonVolver: { marginTop: 32 },
  botonVolverTexto: { color: '#1a73e8', fontSize: 16 },
});