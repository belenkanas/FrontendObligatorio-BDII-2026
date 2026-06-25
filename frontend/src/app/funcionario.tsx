import api from '../../services/api';
import { esFuncionario, useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

type SectorAsignado = {
    nombreSector: string;
    idDispositivoEscaneo: number;
    nroSerieDispositivo: string; 
    vendidas: number;
    escaneadas: number;
};

type EventoFuncionario = {
    id: string;
    nombre: string;
    estadio?: string;
    estadioDireccionPais?: string;
    estadioDireccionCiudad?: string;
    fechaHoraPartido?: string;
    ubicacion?: string;
    fechaEtiqueta: string;
    esFuturo: boolean;
    sectores: SectorAsignado[];
};

function parseFecha(rawFecha: any) {
    if (!rawFecha) return null;

    if (Array.isArray(rawFecha)) {
        const [year, month, day, hour = 0, minute = 0, second = 0] = rawFecha;
        const fecha = new Date(year, month - 1, day, hour, minute, second);
        return Number.isNaN(fecha.getTime()) ? null : fecha;
    }

    const fecha = new Date(rawFecha);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function formatearFecha(fecha: Date | null) {
    if (!fecha) {
        return 'Fecha no informada';
    }

    return fecha.toLocaleDateString('es-UY', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function claveFecha(rawFecha: any): string {
    const fecha = parseFecha(rawFecha);
    return fecha ? fecha.toISOString() : String(rawFecha);
}

async function cargarAsignacionesFuncionario(idPerfil: number): Promise<EventoFuncionario[]> {
    const [asignacionesRes, entradasRes, escaneosRes, dispositivosRes] = await Promise.all([
        api.get(`/funcionarios/${idPerfil}/asignaciones`),
        api.get('/entradas'),
        api.get('/tokens-escaneados'),
        api.get('/dispositivos'),
    ]);

    const asignacionesData = Array.isArray(asignacionesRes.data) ? asignacionesRes.data : [];
    const entradas = Array.isArray(entradasRes.data) ? entradasRes.data : [];
    const escaneos = Array.isArray(escaneosRes.data) ? escaneosRes.data : [];

    const vendidasPorSector: Record<string, number> = {};
    entradas.forEach((en: any) => {
        const key = [
            en.nombreSector,
            en.estadioNombre,
            en.estadioDireccionPais,
            en.estadioDireccionCiudad,
            claveFecha(en.fechaHoraPartido),
        ].join('|');
        vendidasPorSector[key] = (vendidasPorSector[key] ?? 0) + 1;
    });

    const escaneadasPorDispositivo: Record<string, number> = {};
    escaneos.forEach((esc: any) => {
        const idDispositivo = esc?.id?.idDispositivoEscaneo;
        if (idDispositivo === undefined || idDispositivo === null) return;
        const key = String(idDispositivo);
        escaneadasPorDispositivo[key] = (escaneadasPorDispositivo[key] ?? 0) + 1;
    });

    const dispositivos: any[] = Array.isArray(dispositivosRes.data) ? dispositivosRes.data : [];

    // nroSerie para lookup rápido
    const nroSeriePorId: Record<number, string> = {};
    dispositivos.forEach((d) => {
        if (d.id != null) nroSeriePorId[d.id] = d.nroSerie ?? `#${d.id}`;
    });

    return asignacionesData.map((item: any, index: number) => {
        const evento = item?.evento ?? {};
        const eventoId = evento?.id ?? {};
        const fecha = parseFecha(eventoId?.fechaHoraPartido);
        const estadio = eventoId?.estadioNombre;
        const estadioPais = eventoId?.estadioDireccionPais;
        const estadioCiudad = eventoId?.estadioDireccionCiudad;
        const local = eventoId?.nombrePaisEquipoLocal ?? '';
        const visitante = eventoId?.nombrePaisEquipoVisitante ?? '';

        const sectoresCrudos: any[] = Array.isArray(item?.sectores) ? item.sectores : [];
        const sectores: SectorAsignado[] = sectoresCrudos.map((s) => {
            const keyVendidas = [
                s.nombreSector,
                estadio,
                estadioPais,
                estadioCiudad,
                claveFecha(eventoId?.fechaHoraPartido),
            ].join('|');

            return {
                nombreSector: s.nombreSector,
                idDispositivoEscaneo: s.idDispositivoEscaneo,
                nroSerieDispositivo: nroSeriePorId[s.idDispositivoEscaneo] ?? `#${s.idDispositivoEscaneo}`,  // ← agregar
                vendidas: vendidasPorSector[keyVendidas] ?? 0,
                escaneadas: escaneadasPorDispositivo[String(s.idDispositivoEscaneo)] ?? 0,
            };
        });

        return {
            id: `${estadio}-${eventoId?.fechaHoraPartido}-${index}`,
            nombre: local && visitante ? `${local} vs ${visitante}` : (estadio || 'Evento sin nombre'),
            estadio,
            estadioDireccionPais: estadioPais,
            estadioDireccionCiudad: estadioCiudad,
            fechaHoraPartido: eventoId?.fechaHoraPartido,
            ubicacion: estadioCiudad,
            fechaEtiqueta: formatearFecha(fecha),
            esFuturo: fecha ? fecha.getTime() >= Date.now() : false,
            sectores,
        };
    });
}

export default function FuncionarioScreen() {
    const router = useRouter();
    const { usuario } = useAuth();
    const esUsuarioFuncionario = useMemo(() => esFuncionario(usuario), [usuario]);

    const [eventos, setEventos] = useState<EventoFuncionario[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const [eventoSeleccionado, setEventoSeleccionado] = useState<EventoFuncionario | null>(null);
    const [sectorSeleccionado, setSectorSeleccionado] = useState<SectorAsignado | null>(null);
    const [escaneoActivo, setEscaneoActivo] = useState(false);
    const [permiso, requestPermiso] = useCameraPermissions();
    const [procesando, setProcesando] = useState(false);

    useEffect(() => {
        if (!usuario) return;
        if (!esUsuarioFuncionario) {
            router.replace('/eventos');
        }
    }, [esUsuarioFuncionario, router, usuario]);

    const cargarDatos = async () => {
        try {
            setError('');
            const respuesta = await cargarAsignacionesFuncionario(usuario.idPerfil);
            setEventos(respuesta);
        } catch (err) {
            setEventos([]);
            setError('No pudimos cargar el panel de funcionario.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (esUsuarioFuncionario) {
            setLoading(true);
            cargarDatos();
        }
    }, [esUsuarioFuncionario]);

    const abrirEscaneo = async (evento: EventoFuncionario, sector: SectorAsignado) => {
        if (!permiso?.granted) {
            const resultado = await requestPermiso();
            if (!resultado.granted) {
                Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para escanear entradas.');
                return;
            }
        }
        setEventoSeleccionado(evento);
        setSectorSeleccionado(sector);
        setEscaneoActivo(true);
    };

    const cerrarEscaneo = () => {
        setEscaneoActivo(false);
        setEventoSeleccionado(null);
        setSectorSeleccionado(null);
        setProcesando(false);
        cargarDatos();
    };

    const handleQRDetectado = async ({ data }: { data: string }) => {
        if (procesando) return;
        setProcesando(true);

        try {
            const response = await api.post('/validacion/escanear', {
                qr: data,
                idFuncionario: usuario.idPerfil,
                idDispositivoEscaneo: sectorSeleccionado?.idDispositivoEscaneo,
            });
            console.log('RESULTADO ESCANEO:', response.data);
            window.alert(response.data?.mensaje ?? 'Entrada válida');
            cerrarEscaneo();
        } catch (err: any) {
            console.log('ERROR ESCANEO:', err.response?.data ?? err.message);
            window.alert('Error: ' + (err.response?.data ?? 'No se pudo validar el QR.'));
            setProcesando(false);
        }
    };

    const eventosFuturos = eventos.filter((evento) => evento.esFuturo);
    const eventosPasados = eventos.filter((evento) => !evento.esFuturo);
    const sinAsignacionesDetectadas = eventos.length === 0;

    if (!usuario) {
        return (
            <View style={styles.estadoContainer}>
                <ActivityIndicator size="large" color="#1a73e8" />
                <Text style={styles.estadoTexto}>Cargando usuario...</Text>
            </View>
        );
    }

    if (!esUsuarioFuncionario) {
        return (
            <View style={styles.estadoContainer}>
                <Text style={styles.error}>Esta vista es solo para funcionarios.</Text>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.estadoContainer}>
                <ActivityIndicator size="large" color="#1a73e8" />
                <Text style={styles.estadoTexto}>Cargando panel...</Text>
            </View>
        );
    }

    return (
        <>
            <ScrollView
                style={styles.fondo}
                contentContainerStyle={styles.container}
                refreshControl={(
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargarDatos(); }} />
                )}
            >
                <View style={styles.header}>
                    <Text style={styles.kicker}>FUNCIONARIO</Text>
                    <Text style={styles.titulo}>Panel de trabajo</Text>
                    <Text style={styles.subtitulo}>Tocá un sector para abrir la cámara y escanear las entradas de ese turno.</Text>
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <View style={styles.warningCard}>
                    <Text style={styles.warningTexto}>⚠️ Recordá escanear al menos una entrada por sector asignado.</Text>
                </View>

                {sinAsignacionesDetectadas ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>No hay eventos asignados</Text>
                        <Text style={styles.emptyText}>Todavía no tenés sectores ni dispositivos asignados a ningún partido.</Text>
                    </View>
                ) : null}

                <Text style={styles.seccion}>Eventos a futuro</Text>
                {eventosFuturos.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>Sin proximos eventos</Text>
                        <Text style={styles.emptyText}>Cuando tengas partidos futuros asignados apareceran aqui.</Text>
                    </View>
                ) : (
                    eventosFuturos.map((evento) => (
                        <View key={evento.id} style={styles.card}>
                            <View style={styles.cardTop}>
                                <View style={styles.cardInfo}>
                                    <Text style={styles.cardTitulo}>{evento.nombre}</Text>
                                    <Text style={styles.cardDetalle}>{evento.fechaEtiqueta}</Text>
                                    {evento.ubicacion ? <Text style={styles.cardDetalle}>📍 {evento.ubicacion}</Text> : null}
                                </View>
                                <View style={styles.badgeFuture}>
                                    <Text style={styles.badgeTextFuture}>Futuro</Text>
                                </View>
                            </View>

                            <Text style={styles.sectoresTitulo}>Sectores asignados</Text>
                            {evento.sectores.map((sector) => (
                                <TouchableOpacity
                                    key={`${evento.id}-${sector.nombreSector}`}
                                    style={styles.sectorRow}
                                    onPress={() => abrirEscaneo(evento, sector)}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.sectorNombre}>{sector.nombreSector}</Text>
                                        <Text style={styles.sectorDispositivo}>Dispositivo {sector.nroSerieDispositivo}</Text>
                                        <Text style={styles.sectorConteo}>
                                            {sector.escaneadas} / {sector.vendidas} entradas escaneadas
                                        </Text>
                                    </View>
                                    <Text style={styles.sectorAccion}>Escanear →</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))
                )}

                <Text style={styles.seccion}>Eventos trabajados</Text>
                {eventosPasados.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>Sin historial todavia</Text>
                        <Text style={styles.emptyText}>Los partidos que ya trabajaste se van a mostrar aca.</Text>
                    </View>
                ) : (
                    eventosPasados.map((evento) => (
                        <View key={evento.id} style={styles.card}>
                            <View style={styles.cardTop}>
                                <View style={styles.cardInfo}>
                                    <Text style={styles.cardTitulo}>{evento.nombre}</Text>
                                    <Text style={styles.cardDetalle}>{evento.fechaEtiqueta}</Text>
                                    {evento.ubicacion ? <Text style={styles.cardDetalle}>📍 {evento.ubicacion}</Text> : null}
                                </View>
                                <View style={styles.badgePast}>
                                    <Text style={styles.badgeTextPast}>Trabajo</Text>
                                </View>
                            </View>

                            <Text style={styles.sectoresTitulo}>Sectores trabajados</Text>
                            {evento.sectores.map((sector) => (
                                <View key={`${evento.id}-${sector.nombreSector}`} style={styles.sectorRowPasado}>
                                    <View>
                                        <Text style={styles.sectorNombre}>{sector.nombreSector}</Text>
                                        <Text style={styles.sectorDispositivo}>Dispositivo {sector.nroSerieDispositivo}</Text>
                                    </View>
                                    <Text style={styles.sectorConteo}>
                                        {sector.escaneadas} / {sector.vendidas}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ))
                )}
            </ScrollView>

            <Modal visible={escaneoActivo} animationType="slide" onRequestClose={cerrarEscaneo}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitulo}>Escanear entradas</Text>
                        <Text style={styles.modalSubtitulo}>{eventoSeleccionado?.nombre}</Text>
                        <Text style={styles.modalSubtitulo}>Sector: {sectorSeleccionado?.nombreSector}</Text>
                        {sectorSeleccionado ? (
                            <Text style={styles.modalConteo}>
                                {sectorSeleccionado.escaneadas} / {sectorSeleccionado.vendidas} escaneadas
                            </Text>
                        ) : null}
                    </View>

                    {permiso?.granted ? (
                        <CameraView
                            style={styles.camera}
                            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                            onBarcodeScanned={procesando ? undefined : handleQRDetectado}
                        />
                    ) : (
                        <View style={styles.estadoContainer}>
                            <Text style={styles.estadoTexto}>Necesitamos permiso de cámara para escanear.</Text>
                        </View>
                    )}

                    {procesando ? (
                        <View style={styles.procesandoBanner}>
                            <ActivityIndicator color="#fff" />
                            <Text style={styles.procesandoTexto}>Procesando...</Text>
                        </View>
                    ) : null}

                    <TouchableOpacity style={styles.botonCerrarModal} onPress={cerrarEscaneo}>
                        <Text style={styles.botonCerrarModalTexto}>Cerrar</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    fondo: {
        flex: 1,
        backgroundColor: '#0c4a6e',
    },
    container: {
        padding: 20,
        paddingBottom: 32,
        backgroundColor: '#f8fafc',
        minHeight: '100%',
    },
    header: {
        backgroundColor: '#0369a1',
        borderRadius: 28,
        padding: 22,
        marginBottom: 18,
    },
    kicker: {
        color: '#93c5fd',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1.4,
        marginBottom: 10,
    },
    titulo: {
        color: '#ffffff',
        fontSize: 30,
        fontWeight: '800',
    },
    subtitulo: {
        color: '#cbd5e1',
        fontSize: 14,
        marginTop: 10,
        lineHeight: 20,
    },
    warningCard: {
        backgroundColor: '#fefce8',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#eab308',
    },
    warningTexto: {
        color: '#854d0e',
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 18,
    },
    seccion: {
        marginTop: 24,
        marginBottom: 12,
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#0f172a',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 2,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    cardInfo: {
        flex: 1,
        paddingRight: 12,
    },
    cardTitulo: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 4,
    },
    cardDetalle: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    badgeFuture: {
        backgroundColor: '#dbeafe',
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    badgeTextFuture: {
        color: '#1d4ed8',
        fontWeight: '800',
        fontSize: 12,
    },
    badgePast: {
        backgroundColor: '#ede9fe',
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    badgeTextPast: {
        color: '#6d28d9',
        fontWeight: '800',
        fontSize: 12,
    },
    sectoresTitulo: {
        marginTop: 16,
        marginBottom: 8,
        fontSize: 12,
        fontWeight: '800',
        color: '#94a3b8',
        letterSpacing: 0.6,
    },
    sectorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    sectorRowPasado: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    sectorNombre: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0f172a',
    },
    sectorDispositivo: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    sectorConteo: {
        fontSize: 12,
        color: '#1a73e8',
        fontWeight: '700',
        marginTop: 4,
    },
    sectorAccion: {
        color: '#1a73e8',
        fontWeight: '800',
        fontSize: 13,
    },
    emptyCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 18,
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0f172a',
    },
    emptyText: {
        marginTop: 6,
        color: '#64748b',
        lineHeight: 20,
    },
    estadoContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        backgroundColor: '#f8fafc',
    },
    estadoTexto: {
        marginTop: 12,
        color: '#64748b',
        textAlign: 'center',
    },
    error: {
        color: '#b91c1c',
        textAlign: 'center',
        marginBottom: 10,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    modalHeader: {
        padding: 20,
        paddingTop: 60,
    },
    modalTitulo: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: '800',
    },
    modalSubtitulo: {
        color: '#cbd5e1',
        fontSize: 14,
        marginTop: 4,
    },
    modalConteo: {
        color: '#93c5fd',
        fontSize: 13,
        fontWeight: '700',
        marginTop: 8,
    },
    camera: {
        flex: 1,
    },
    procesandoBanner: {
        position: 'absolute',
        bottom: 100,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 14,
        gap: 10,
    },
    procesandoTexto: {
        color: '#ffffff',
        fontWeight: '700',
    },
    botonCerrarModal: {
        margin: 20,
        backgroundColor: '#b91c1c',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    botonCerrarModalTexto: {
        color: '#ffffff',
        fontWeight: '800',
    },
});