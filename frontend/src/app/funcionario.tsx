import api from '../../services/api';
import { esFuncionario, useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type EventoFuncionario = {
    id: number | string;
    nombre: string;
    estadio?: string;
    fecha?: string;
    fechaEtiqueta?: string;
    ubicacion?: string;
    entradasEscaneadas?: number;
    entradasTotales?: number;
    esFuturo?: boolean;
};

function extraerListaEventos(data: any): any[] {
    if (Array.isArray(data)) {
        return data;
    }

    return data?.eventos ?? data?.items ?? data?.data ?? data?.asignados ?? data?.eventosAsignados ?? [];
}

function parseFecha(rawFecha: any) {
    if (!rawFecha) {
        return null;
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

function toNumero(valor: any, fallback = 0) {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : fallback;
}

function normalizarEventos(data: any, asignadoPorDefecto = false): EventoFuncionario[] {
    return extraerListaEventos(data)
        .map((evento: any, index: number) => {
            const fechaRaw = evento?.id?.fechaHoraPartido ?? evento?.fecha ?? evento?.date ?? evento?.fechaEvento;
            const fecha = parseFecha(fechaRaw);
            const estadio = evento?.id?.estadioNombre ?? evento?.estadio ?? evento?.stadium;
            const ubicacion = evento?.id?.estadioDireccionCiudad ?? evento?.ubicacion ?? evento?.city;
            const nombreBase = evento?.nombre ?? evento?.titulo ?? evento?.descripcion;
            const entradasEscaneadas = toNumero(
                evento?.entradasEscaneadas ?? evento?.ticketsEscaneados ?? evento?.escaneadas ?? evento?.cantEntradasEscaneadas,
            );
            const entradasTotalesRaw = evento?.entradasTotales ?? evento?.ticketsTotales ?? evento?.cuposTotales ?? evento?.capacidad;

            return {
                id: evento?.idEvento ?? evento?.id ?? evento?.eventoId ?? JSON.stringify(evento?.id) ?? index,
                nombre: nombreBase || [estadio, formatearFecha(fecha)].filter(Boolean).join(' - ') || 'Evento sin nombre',
                estadio,
                fecha: fecha ? fecha.toISOString() : fechaRaw,
                fechaEtiqueta: formatearFecha(fecha),
                ubicacion,
                entradasEscaneadas,
                entradasTotales: entradasTotalesRaw !== undefined && entradasTotalesRaw !== null ? toNumero(entradasTotalesRaw) : undefined,
                esFuturo: fecha ? fecha.getTime() >= Date.now() : false,
            };
        })
        .filter((evento: EventoFuncionario) => evento.nombre);
}

async function cargarEventosFuncionario() {
    const endpoints = ['/funcionario/eventos', '/funcionarios/eventos', '/eventos/asignados', '/eventos'];

    for (const endpoint of endpoints) {
        try {
            const response = await api.get(endpoint);
            const eventos = normalizarEventos(response.data, endpoint !== '/eventos');

            if (eventos.length > 0) {
                return eventos;
            }
        } catch (error) {
            continue;
        }
    }

    throw new Error('No se pudo cargar la informacion del funcionario.');
}

export default function FuncionarioScreen() {
    const router = useRouter();
    const { usuario } = useAuth();
    const esUsuarioFuncionario = useMemo(() => esFuncionario(usuario), [usuario]);
    const [eventos, setEventos] = useState<EventoFuncionario[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (usuario && !esUsuarioFuncionario) {
            router.replace('/eventos');
        }
    }, [esUsuarioFuncionario, router, usuario]);

    const cargarDatos = async () => {
        try {
            setError('');
            const respuesta = await cargarEventosFuncionario();
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

    const eventosFuturos = eventos.filter((evento) => evento.esFuturo);
    const eventosPasados = eventos.filter((evento) => !evento.esFuturo);
    const totalEscaneadas = eventos.reduce((acumulado, evento) => acumulado + toNumero(evento.entradasEscaneadas), 0);
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
                <Text style={styles.subtitulo}>Controla tus eventos asignados, los proximos turnos y cuantas entradas escaneaste por partido.</Text>
            </View>

            <View style={styles.resumenGrid}>
                <View style={styles.resumenCard}>
                    <Text style={styles.resumenNumero}>{eventos.length}</Text>
                    <Text style={styles.resumenEtiqueta}>Eventos asignados</Text>
                </View>
                <View style={styles.resumenCard}>
                    <Text style={styles.resumenNumero}>{eventosFuturos.length}</Text>
                    <Text style={styles.resumenEtiqueta}>Proximos</Text>
                </View>
                <View style={styles.resumenCard}>
                    <Text style={styles.resumenNumero}>{totalEscaneadas}</Text>
                    <Text style={styles.resumenEtiqueta}>Escaneadas</Text>
                </View>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {sinAsignacionesDetectadas ? (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>No hay eventos asignados</Text>
                    <Text style={styles.emptyText}>La API todavia no devolvio eventos asignados para este funcionario.</Text>
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
                    <View key={String(evento.id)} style={styles.card}>
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

                        <View style={styles.metricRow}>
                            <View style={styles.metricBox}>
                                <Text style={styles.metricValue}>{toNumero(evento.entradasEscaneadas)}</Text>
                                <Text style={styles.metricLabel}>Escaneadas</Text>
                            </View>
                            <View style={styles.metricBox}>
                                <Text style={styles.metricValue}>{evento.entradasTotales ?? 'N/D'}</Text>
                                <Text style={styles.metricLabel}>Total</Text>
                            </View>
                        </View>
                    </View>
                ))
            )}

            <Text style={styles.seccion}>Eventos trabajados</Text>
            {eventosPasados.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>Sin historial todavia</Text>
                    <Text style={styles.emptyText}>Los partidos que ya trabajaste se van a mostrar aca con sus conteos.</Text>
                </View>
            ) : (
                eventosPasados.map((evento) => (
                    <View key={String(evento.id)} style={styles.card}>
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

                        <View style={styles.metricRow}>
                            <View style={styles.metricBox}>
                                <Text style={styles.metricValue}>{toNumero(evento.entradasEscaneadas)}</Text>
                                <Text style={styles.metricLabel}>Escaneadas</Text>
                            </View>
                            <View style={styles.metricBox}>
                                <Text style={styles.metricValue}>{evento.entradasTotales ?? 'N/D'}</Text>
                                <Text style={styles.metricLabel}>Total</Text>
                            </View>
                        </View>
                    </View>
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    fondo: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    container: {
        padding: 20,
        paddingBottom: 32,
        backgroundColor: '#f8fafc',
        minHeight: '100%',
    },
    header: {
        backgroundColor: '#0f172a',
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
    resumenGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 8,
    },
    resumenCard: {
        flex: 1,
        backgroundColor: '#111827',
        borderRadius: 18,
        padding: 16,
        minHeight: 96,
        justifyContent: 'space-between',
    },
    resumenNumero: {
        color: '#ffffff',
        fontSize: 28,
        fontWeight: '800',
    },
    resumenEtiqueta: {
        color: '#cbd5e1',
        fontSize: 13,
        marginTop: 8,
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
    metricRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    metricBox: {
        flex: 1,
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 12,
    },
    metricValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0f172a',
    },
    metricLabel: {
        marginTop: 4,
        fontSize: 12,
        color: '#64748b',
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
});