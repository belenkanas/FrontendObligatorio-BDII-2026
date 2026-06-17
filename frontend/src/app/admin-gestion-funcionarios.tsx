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
import { Picker } from '@react-native-picker/picker';

type SubTab = 'funcionarios' | 'sectorEvento' | 'dispositivo';

type Funcionario = { id: number; nroLegajo: string; mail?: string };
type SectorEvento = {
    id: {
        nombreSector: string;
        estadioNombre: string;
        estadioDireccionPais: string;
        estadioDireccionCiudad: string;
        fechaHoraPartido: string;
    };
};
type Dispositivo = { id?: number; nroLegajo: string };

export default function AdminGestionFuncionariosScreen() {
    const [subtab, setSubtab] = useState<SubTab>('funcionarios');
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [sectoresEvento, setSectoresEvento] = useState<SectorEvento[]>([]);
    const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
    const [funcionarioSector, setFuncionarioSector] = useState('');
    const [sectorSeleccionado, setSectorSeleccionado] = useState('');
    const [funcionarioDispositivo, setFuncionarioDispositivo] = useState('');
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const obtenerMensajeError = (err: any, fallback: string) => {
        const data = err?.response?.data;
        if (!data) return fallback;
        if (typeof data === 'string') return data;
        if (typeof data?.message === 'string') return data.message;
        if (typeof data?.error === 'string') return data.error;
        return fallback;
    };

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const [funcionariosRes, sectoresRes, dispositivosRes] = await Promise.all([
                api.get('/funcionarios'),
                api.get('/sector-eventos'),
                api.get('/dispositivos'),
            ]);

            setFuncionarios(Array.isArray(funcionariosRes.data) ? funcionariosRes.data : []);
            setSectoresEvento(Array.isArray(sectoresRes.data) ? sectoresRes.data : []);
            setDispositivos(Array.isArray(dispositivosRes.data) ? dispositivosRes.data : []);
        } catch {
            Alert.alert('Error', 'No se pudieron cargar los datos necesarios.');
        } finally {
            setLoading(false);
        }
    };

    const asignarSector = async () => {
        if (!funcionarioSector || !sectorSeleccionado) {
            Alert.alert('Falta información', 'Seleccioná un funcionario y un sector de evento.');
            return;
        }

        const funcionario = funcionarios.find((f) => String(f.id) === funcionarioSector);
        const sector = sectoresEvento.find((s) => JSON.stringify(s.id) === sectorSeleccionado);

        if (!funcionario || !sector) {
            Alert.alert('Error', 'No se pudo resolver la selección.');
            return;
        }

        setActionLoading(true);
        try {
            await api.post('/funcionarios-asignados-sector', {
                id: {
                    nroLegajo: funcionario.nroLegajo,
                    nombreSector: sector.id.nombreSector,
                    estadioNombre: sector.id.estadioNombre,
                    estadioDireccionPais: sector.id.estadioDireccionPais,
                    estadioDireccionCiudad: sector.id.estadioDireccionCiudad,
                },
            });

            Alert.alert('Éxito', 'Sector asignado correctamente.');
            setSectorSeleccionado('');
            await cargarDatos();
        } catch (err: any) {
            Alert.alert('Error', obtenerMensajeError(err, 'No se pudo asignar el sector.'));
        } finally {
            setActionLoading(false);
        }
    };

    const asignarDispositivo = async () => {
        if (!funcionarioDispositivo) {
            Alert.alert('Falta información', 'Seleccioná un funcionario.');
            return;
        }

        const funcionario = funcionarios.find((f) => String(f.id) === funcionarioDispositivo);
        if (!funcionario) {
            Alert.alert('Error', 'No se pudo resolver el funcionario seleccionado.');
            return;
        }

        setActionLoading(true);
        try {
            await api.post('/dispositivos', {
                nroLegajo: funcionario.nroLegajo,
            });

            Alert.alert('Éxito', 'Dispositivo asignado correctamente.');
            setFuncionarioDispositivo('');
            await cargarDatos();
        } catch (err: any) {
            Alert.alert('Error', obtenerMensajeError(err, 'No se pudo asignar el dispositivo.'));
        } finally {
            setActionLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const dispositivosPorLegajo = (legajo: string) =>
        dispositivos.find((d) => d.nroLegajo === legajo);

    const subtabs: { key: SubTab; label: string }[] = [
        { key: 'funcionarios', label: 'Funcionarios' },
        { key: 'sectorEvento', label: 'Asignar Sector-Evento' },
        { key: 'dispositivo', label: 'Asignar Dispositivo' },
    ];

    const renderFuncionarios = () => (
        <View style={s.cardSeccion}>
            <View style={s.cabeceraLista}>
                <Text style={s.subtitulo}>Funcionarios cargados</Text>
                <TouchableOpacity onPress={cargarDatos}>
                    <Text style={s.link}>Actualizar</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={s.estadoCentrado}>
                    <ActivityIndicator size="large" color="#1a73e8" />
                </View>
            ) : funcionarios.length === 0 ? (
                <Text style={s.vacio}>No hay funcionarios disponibles.</Text>
            ) : (
                <FlatList
                    data={funcionarios}
                    keyExtractor={(item) => String(item.id)}
                    scrollEnabled={false}
                    ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                    renderItem={({ item }) => {
                        const dispositivo = dispositivosPorLegajo(item.nroLegajo);
                        return (
                            <View style={s.cardFuncionario}>
                                <Text style={s.cardTitulo}>Legajo: {item.nroLegajo}</Text>
                                {item.mail ? <Text style={s.detalle}>{item.mail}</Text> : null}
                                <Text style={s.detalle}>
                                    Dispositivo: {dispositivo ? `Asignado a ${dispositivo.nroLegajo}` : 'Sin asignar'}
                                </Text>
                            </View>
                        );
                    }}
                />
            )}
        </View>
    );

    const renderAsignarSector = () => (
        <View style={s.cardSeccion}>
            <Text style={s.subtitulo}>Asignar sector de evento</Text>
            <Text style={s.descripcionSeccion}>
                Elegí el funcionario y el sector de un partido para crear la asignación.
            </Text>

            <Text style={s.label}>Funcionario</Text>
            <View style={s.pickerContainer}>
                <Picker selectedValue={funcionarioSector} onValueChange={(v) => setFuncionarioSector(String(v))}>
                    <Picker.Item label="Seleccioná un funcionario" value="" />
                    {funcionarios.map((funcionario) => (
                        <Picker.Item
                            key={funcionario.id}
                            label={`${funcionario.nroLegajo}${funcionario.mail ? ` - ${funcionario.mail}` : ''}`}
                            value={String(funcionario.id)}
                        />
                    ))}
                </Picker>
            </View>

            <Text style={s.label}>Sector de evento</Text>
            <View style={s.pickerContainer}>
                <Picker selectedValue={sectorSeleccionado} onValueChange={(v) => setSectorSeleccionado(String(v))}>
                    <Picker.Item label="Seleccioná un sector de evento" value="" />
                    {sectoresEvento.map((sector) => (
                        <Picker.Item
                            key={JSON.stringify(sector.id)}
                            label={`${sector.id.nombreSector} - ${sector.id.estadioNombre}`}
                            value={JSON.stringify(sector.id)}
                        />
                    ))}
                </Picker>
            </View>

            <TouchableOpacity
                style={[s.botonPrimario, actionLoading && s.botonDeshabilitado]}
                onPress={asignarSector}
                disabled={actionLoading}
            >
                <Text style={s.botonTexto}>{actionLoading ? 'Asignando...' : 'Asignar sector'}</Text>
            </TouchableOpacity>
        </View>
    );

    const renderAsignarDispositivo = () => (
        <View style={s.cardSeccion}>
            <Text style={s.subtitulo}>Asignar dispositivo</Text>
            <Text style={s.descripcionSeccion}>
                Asociá un dispositivo de escaneo al legajo del funcionario.
            </Text>

            <Text style={s.label}>Funcionario</Text>
            <View style={s.pickerContainer}>
                <Picker selectedValue={funcionarioDispositivo} onValueChange={(v) => setFuncionarioDispositivo(String(v))}>
                    <Picker.Item label="Seleccioná un funcionario" value="" />
                    {funcionarios.map((funcionario) => (
                        <Picker.Item
                            key={`disp-${funcionario.id}`}
                            label={`${funcionario.nroLegajo}${funcionario.mail ? ` - ${funcionario.mail}` : ''}`}
                            value={String(funcionario.id)}
                        />
                    ))}
                </Picker>
            </View>

            <TouchableOpacity
                style={[s.botonSecundario, actionLoading && s.botonDeshabilitado]}
                onPress={asignarDispositivo}
                disabled={actionLoading}
            >
                <Text style={s.botonTexto}>{actionLoading ? 'Asignando...' : 'Asignar dispositivo'}</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <ScrollView style={s.root} contentContainerStyle={s.contenedor}>
            <Text style={s.titulo}>Gestión de funcionarios</Text>
            <Text style={s.descripcion}>
                Asigná sectores de eventos y dispositivos a los funcionarios desde una sola pantalla.
            </Text>

            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={subtabs}
                keyExtractor={(item) => item.key}
                contentContainerStyle={s.subtabsRow}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[s.subtab, subtab === item.key && s.subtabActivo]}
                        onPress={() => setSubtab(item.key)}
                    >
                        <Text style={[s.subtabTexto, subtab === item.key && s.subtabTextoActivo]}>{item.label}</Text>
                    </TouchableOpacity>
                )}
            />

            {subtab === 'funcionarios' && renderFuncionarios()}
            {subtab === 'sectorEvento' && renderAsignarSector()}
            {subtab === 'dispositivo' && renderAsignarDispositivo()}
        </ScrollView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f6f8fc' },
    contenedor: { padding: 20, paddingBottom: 32 },
    titulo: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 8 },
    descripcion: { fontSize: 14, color: '#6b7280', lineHeight: 20, marginBottom: 16 },
    subtabsRow: { paddingVertical: 6, paddingRight: 8, marginBottom: 12 },
    subtab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, marginRight: 8, backgroundColor: '#e5e7eb' },
    subtabActivo: { backgroundColor: '#1a73e8' },
    subtabTexto: { color: '#374151', fontSize: 13, fontWeight: '700' },
    subtabTextoActivo: { color: '#fff' },
    cardSeccion: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 },
    subtitulo: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 },
    descripcionSeccion: { fontSize: 13, color: '#6b7280', lineHeight: 18, marginBottom: 12 },
    label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 4, marginTop: 8 },
    pickerContainer: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, marginBottom: 10, backgroundColor: '#fff', overflow: 'hidden' },
    botonPrimario: { backgroundColor: '#1a73e8', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 6 },
    botonSecundario: { backgroundColor: '#0f766e', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 6 },
    botonDeshabilitado: { opacity: 0.6 },
    botonTexto: { color: '#fff', fontWeight: '800' },
    cabeceraLista: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    link: { color: '#1a73e8', fontWeight: '700' },
    estadoCentrado: { paddingVertical: 18, alignItems: 'center' },
    vacio: { color: '#9ca3af', fontStyle: 'italic' },
    cardFuncionario: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, marginTop: 10, backgroundColor: '#fafafa' },
    cardTitulo: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 4 },
    detalle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
});
