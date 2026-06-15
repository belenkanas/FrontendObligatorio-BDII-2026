import api from '../../services/api';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';


type SubTab = 'eventos' | 'funcionarios' | 'transacciones' | 'ranking';

type EntradasPorEvento  = { evento: string; totalEntradas: number };
type EscaneoFuncionario = { nroLegajo: string; totalEscaneos: number };
type Transaccion        = { idVenta: number; fechaHora: string; costoFinal: number; comision: number; estado: string; idGeneral: number };
type Comprador          = { idGeneral: number; totalEntradas: number };


export default function AdminEstadisticasScreen() {
  const [subtab, setSubtab]   = useState<SubTab>('eventos');
  const [datos, setDatos]     = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const endpoints: Record<SubTab, string> = {
    eventos:       '/estadisticas/entradas-por-evento',
    funcionarios:  '/estadisticas/escaneos-por-funcionario',
    transacciones: '/estadisticas/transacciones',
    ranking:       '/estadisticas/ranking-compradores',
  };

  const cargar = async (tab: SubTab) => {
    setLoading(true);
    setDatos([]);
    try {
      const res = await api.get(endpoints[tab]);
      setDatos(res.data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las estadísticas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(subtab); }, [subtab]);

  const subtabs: { key: SubTab; label: string }[] = [
    { key: 'eventos',       label: 'Por Evento'     },
    { key: 'funcionarios',  label: 'Funcionarios'   },
    { key: 'transacciones', label: 'Transacciones'  },
    { key: 'ranking',       label: 'Ranking'        },
  ];

  return (
    <View style={s.root}>
      <Text style={s.titulo}>Estadísticas</Text>

      {/* Sub-tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.subtabsRow}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}
      >
        {subtabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[s.subtab, subtab === t.key && s.subtabActivo]}
            onPress={() => setSubtab(t.key)}
          >
            <Text style={[s.subtabTexto, subtab === t.key && s.subtabTextoActivo]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Contenido */}
      {loading ? (
        <View style={s.centrado}>
          <ActivityIndicator size="large" color="#1a73e8" />
        </View>
      ) : (
        <FlatList
          data={datos}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text style={s.vacio}>Sin datos disponibles.</Text>
          }
          renderItem={({ item, index }) => {
            if (subtab === 'eventos') {
              const d = item as EntradasPorEvento;
              return (
                <View style={s.card}>
                  <Text style={s.cardTitulo}>{d.evento}</Text>
                  <Text style={s.stat}>🎫 Entradas vendidas: {d.totalEntradas}</Text>
                </View>
              );
            }

            if (subtab === 'funcionarios') {
              const d = item as EscaneoFuncionario;
              return (
                <View style={s.card}>
                  <Text style={s.cardTitulo}>Legajo: {d.nroLegajo}</Text>
                  <Text style={s.stat}>📱 Entradas escaneadas: {d.totalEscaneos}</Text>
                </View>
              );
            }

            if (subtab === 'transacciones') {
              const d = item as Transaccion;
              return (
                <View style={s.card}>
                  <Text style={s.cardTitulo}>Venta #{d.idVenta}</Text>
                  <Text style={s.detalle}>👤 Usuario: {d.idGeneral}</Text>
                  <Text style={s.detalle}>🗓 {d.fechaHora?.replace('T', ' ')}</Text>
                  <Text style={s.detalle}>💰 Total: ${d.costoFinal}</Text>
                  {d.comision > 0 && (
                    <Text style={s.detalle}>📊 Comisión: ${d.comision}</Text>
                  )}
                  <Text
                    style={[
                      s.badge,
                      { backgroundColor: d.estado === 'confirmado' ? '#dcfce7' : '#fef9c3' },
                    ]}
                  >
                    {d.estado}
                  </Text>
                </View>
              );
            }

            if (subtab === 'ranking') {
              const d = item as Comprador;
              const medalla =
                index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
              return (
                <View style={s.card}>
                  <Text style={s.cardTitulo}>
                    {medalla} Usuario {d.idGeneral}
                  </Text>
                  <Text style={s.stat}>🎫 Entradas compradas: {d.totalEntradas}</Text>
                </View>
              );
            }

            return null;
          }}
        />
      )}
    </View>
  );
}


const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#f6f8fc' },
  titulo:  { fontSize: 24, fontWeight: 'bold', color: '#111827', paddingHorizontal: 16, paddingTop: 20, marginBottom: 4 },
  centrado:{ flex: 1, alignItems: 'center', justifyContent: 'center' },
  vacio:   { textAlign: 'center', color: '#9ca3af', marginTop: 40 },

  subtabsRow: { flexGrow: 0 },
  subtab:     { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, marginRight: 8, backgroundColor: '#e5e7eb' },
  subtabActivo:     { backgroundColor: '#1a73e8' },
  subtabTexto:      { color: '#374151', fontSize: 13 },
  subtabTextoActivo:{ color: '#fff', fontWeight: '700' },

  card:      { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  cardTitulo:{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  detalle:   { fontSize: 13, color: '#6b7280', marginTop: 2 },
  stat:      { fontSize: 15, fontWeight: '600', color: '#1a73e8', marginTop: 4 },
  badge:     { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, fontSize: 12, marginTop: 6, overflow: 'hidden' },
});
