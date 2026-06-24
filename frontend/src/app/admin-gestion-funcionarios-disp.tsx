import api from '../../services/api';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext'

type SubTab = 'funcionarios' | 'sectorEvento' | 'dispositivo' | 'gestionDispositivos';

type Funcionario = { 
    id_funcionario: number; 
    nroLegajo: string; 
    perfil?: { usuario?: { mail?: string } }
};

type FuncionarioAsignadoSector = {
    id: {
        nroLegajo: string;
        nombreSector: string;
        estadioNombre: string;
        estadioDireccionPais: string;
        estadioDireccionCiudad: string;
        fechaHoraPartido: string;
    };
    idDispositivoEscaneo?: number | null;
};

type SectorEvento = {
    id: {
        nombreSector: string;
        estadioNombre: string;
        estadioDireccionPais: string;
        estadioDireccionCiudad: string;
        fechaHoraPartido: string;
    };
};
type Dispositivo = { 
    id?: number; 
    nroSerie?: string; 
    nroLegajo?: string | null 
};

type Validacion = {
    id: {
        nroLegajoFuncionario: string;
        idDispositivoEscaneo: number;
    };
};

export default function AdminGestionFuncionariosScreen() {
    const [subtab, setSubtab] = useState<SubTab>('funcionarios');
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [sectoresEvento, setSectoresEvento] = useState<SectorEvento[]>([]);
    const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
    const [validaciones, setValidaciones] = useState<Validacion[]>([]);
    const [funcionarioSector, setFuncionarioSector] = useState('');
    const [sectorSeleccionado, setSectorSeleccionado] = useState('');
    const [funcionarioDispositivo, setFuncionarioDispositivo] = useState('');
    const [dispositivoSeleccionado, setDispositivoSeleccionado] = useState('');
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [nuevoNroSerie, setNuevoNroSerie] = useState('');
    const [dispositivoADesasignar, setDispositivoADesasignar] = useState('');
    const [modalEliminar, setModalEliminar] = useState(false);
    const [dispositivoAEliminar, setDispositivoAEliminar] = useState<Dispositivo | null>(null);
    
    const [dispositivoParaSector, setDispositivoParaSector] = useState('');

    const [exitoAsignar, setExitoAsignar] = useState('');
    const [errorAsignar, setErrorAsignar] = useState('');
    const [exitoRegistrar, setExitoRegistrar] = useState('');
    const [errorRegistrar, setErrorRegistrar] = useState('');
    const [exitoDesasignar, setExitoDesasignar] = useState('');
    const [errorDesasignar, setErrorDesasignar] = useState('');
    const [exitoEliminar, setExitoEliminar] = useState('');
    const [errorEliminar, setErrorEliminar] = useState('');

    const [eventos, setEventos] = useState<{
        id: {
            estadioNombre: string;
            estadioDireccionPais: string;
            estadioDireccionCiudad: string;
            fechaHoraPartido: string;
            nombrePaisEquipoLocal: string;
            nombrePaisEquipoVisitante: string;
        }
    }[]>([]);
    const [eventoParaAsignar, setEventoParaAsignar] = useState('');
    const [exitoAsignarSector, setExitoAsignarSector] = useState('');
    const [errorAsignarSector, setErrorAsignarSector] = useState('');

    const [asignacionesSector, setAsignacionesSector] = useState<FuncionarioAsignadoSector[]>([]);
    const [exitoDesasignarSector, setExitoDesasignarSector] = useState('');
    const [errorDesasignarSector, setErrorDesasignarSector] = useState('');

    const [paisSedeAdmin, setPaisSedeAdmin] = useState<string | null>(null);
    const { usuario } = useAuth();

    const obtenerMensajeError = (err: any, fallback: string) => {
        const data = err?.response?.data;
        if (!data) return fallback;
        if (typeof data === 'string') return data;
        if (typeof data?.message === 'string') return data.message;
        if (typeof data?.error === 'string') return data.error;
        return fallback;
    };

    const formatearFechaDisplay = (fecha: string) => {
        const d = new Date(fecha);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} - ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const [funcionariosRes, sectoresRes, dispositivosRes, validacionesRes, eventosRes, asignacionesSectorRes] = await Promise.all([
                api.get('/funcionarios'),
                api.get('/sector-eventos'),
                api.get('/dispositivos'),
                api.get('/validaciones'),
                api.get('/eventos'),
                api.get('/funcionarios-asignados-sector'),
            ]);

            setFuncionarios(Array.isArray(funcionariosRes.data) ? funcionariosRes.data : []);
            setSectoresEvento(Array.isArray(sectoresRes.data) ? sectoresRes.data : []);
            setDispositivos(Array.isArray(dispositivosRes.data) ? dispositivosRes.data : []);
            setValidaciones(Array.isArray(validacionesRes.data) ? validacionesRes.data : []);
            setEventos(Array.isArray(eventosRes.data) ? eventosRes.data : []);
            setAsignacionesSector(Array.isArray(asignacionesSectorRes.data) ? asignacionesSectorRes.data : []);
        } catch {
            Alert.alert('Error', 'No se pudieron cargar los datos necesarios.');
        } finally {
            setLoading(false);
        }
    };

    const cargarPaisSede = async () => {
        if (!usuario?.idPerfil) return;
        try {
            const adminRes = await api.get(`/administradores/${usuario.idPerfil}`);
            setPaisSedeAdmin(adminRes.data?.paisSede ?? null);
        } catch {

        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    useEffect(() => {
            cargarPaisSede();
    }, [usuario]);

    const asignarSector = async () => {
        setExitoAsignarSector(''); setErrorAsignarSector('');

        if (!funcionarioSector || !eventoParaAsignar || !sectorSeleccionado) {
            setErrorAsignarSector('Seleccioná un funcionario, un evento y un sector.');
            return;
        }

        const funcionario = funcionarios.find((f) => String(f.id_funcionario) === funcionarioSector);
        const sector = sectoresEvento.find((s) => JSON.stringify(s.id) === sectorSeleccionado);

        if (!funcionario || !sector) {
            setErrorAsignarSector('No se pudo resolver la selección.');
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
                    fechaHoraPartido: sector.id.fechaHoraPartido,
                },
                idDispositivoEscaneo: Number(dispositivoParaSector),  // ← nuevo
            });

            setExitoAsignarSector('Sector asignado correctamente.');
            setSectorSeleccionado('');
            setEventoParaAsignar('');
            setDispositivoParaSector('');
            await cargarDatos();
        } catch (err: any) {
            setErrorAsignarSector(obtenerMensajeError(err, 'No se pudo asignar el sector.'));
        } finally {
            setActionLoading(false);
        }
    };

    const desasignarSector = async (asignacion: FuncionarioAsignadoSector) => {
        setExitoDesasignarSector(''); setErrorDesasignarSector('');
        setActionLoading(true);
        try {
            await api.delete('/funcionarios-asignados-sector/desasignar', {
                data: { id: asignacion.id }
            });
            setExitoDesasignarSector('Asignación eliminada correctamente.');
            await cargarDatos();
        } catch (err: any) {
            setErrorDesasignarSector(obtenerMensajeError(err, 'No se pudo eliminar la asignación.'));
        } finally {
            setActionLoading(false);
        }
    };

    const asignarDispositivo = async () => {
        setExitoAsignar(''); setErrorAsignar('');
        if (!funcionarioDispositivo || !dispositivoSeleccionado) {
            setErrorAsignar('Seleccioná un funcionario y un dispositivo.');
            return;
        }
        const funcionario = funcionarios.find((f) => String(f.id_funcionario) === funcionarioDispositivo);
        const dispositivoId = Number(dispositivoSeleccionado);
        if (!funcionario || !Number.isFinite(dispositivoId)) {
            setErrorAsignar('No se pudo resolver la selección.');
            return;
        }
        setActionLoading(true);
        try {
            await api.post(`/dispositivos/${dispositivoId}/asignar`, { nroLegajo: funcionario.nroLegajo });
            setExitoAsignar('Dispositivo asignado correctamente.');
            setFuncionarioDispositivo('');
            setDispositivoSeleccionado('');
            await cargarDatos();
        } catch (err: any) {
            setErrorAsignar(obtenerMensajeError(err, 'No se pudo asignar el dispositivo.'));
        } finally {
            setActionLoading(false);
        }
    };

    const registrarDispositivo = async () => {
        setExitoRegistrar(''); setErrorRegistrar('');
        if (!nuevoNroSerie.trim()) {
            setErrorRegistrar('Ingresá el número de serie del dispositivo.');
            return;
        }
        setActionLoading(true);
        try {
            await api.post('/dispositivos', { nroSerie: nuevoNroSerie.trim() });
            setExitoRegistrar('Dispositivo registrado correctamente.');
            setNuevoNroSerie('');
            await cargarDatos();
        } catch (err: any) {
            setErrorRegistrar(obtenerMensajeError(err, 'No se pudo registrar el dispositivo.'));
        } finally {
            setActionLoading(false);
        }
    };

    const desasignarDispositivo = async () => {
        setExitoDesasignar(''); setErrorDesasignar('');
        if (!dispositivoADesasignar) {
            setErrorDesasignar('Seleccioná un dispositivo para desasignar.');
            return;
        }
        setActionLoading(true);
        try {
            await api.post(`/dispositivos/${dispositivoADesasignar}/desasignar`);
            setExitoDesasignar('Dispositivo desasignado correctamente.');
            setDispositivoADesasignar('');
            await cargarDatos();
        } catch (err: any) {
            setErrorDesasignar(obtenerMensajeError(err, 'No se pudo desasignar el dispositivo.'));
        } finally {
            setActionLoading(false);
        }
    };

    const eliminarDispositivo = (dispositivo: Dispositivo) => {
        setDispositivoAEliminar(dispositivo);
        setModalEliminar(true);
    };

    const confirmarEliminar = async () => {
        if (dispositivoAEliminar === null) return;
        setActionLoading(true);
        try {
            await api.delete(`/dispositivos/${dispositivoAEliminar.id}`);
            setModalEliminar(false);
            setDispositivoAEliminar(null);
            setExitoEliminar('Dispositivo eliminado correctamente.');
            await cargarDatos();
        } catch (err: any) {
            setModalEliminar(false);
            setErrorEliminar(obtenerMensajeError(err, 'No se pudo eliminar el dispositivo.'));
        } finally {
            setActionLoading(false);
        }
    };

    

    const dispositivosPorLegajo = (legajo: string) => {
        return dispositivos.filter((d) => d.nroLegajo === legajo);
    };

    const subtabs: { key: SubTab; label: string }[] = [
        { key: 'funcionarios', label: 'Funcionarios' },
        { key: 'sectorEvento', label: 'Asignar Sector-Evento' },
        { key: 'dispositivo', label: 'Asignar Dispositivo' },
        { key: 'gestionDispositivos', label: 'Gestión Dispositivos' },
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
                    keyExtractor={(item) => String(item.id_funcionario)}
                    scrollEnabled={false}
                    ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                    renderItem={({ item }) => {
                        const dispositivosAsignados = dispositivosPorLegajo(item.nroLegajo);
                        return (
                            <View style={s.cardFuncionario}>
                                <Text style={s.cardTitulo}>Legajo: {item.nroLegajo}</Text>
                                {item.perfil?.usuario?.mail ? <Text style={s.detalle}>{item.perfil.usuario.mail}</Text> : null}
                                {dispositivosAsignados.length === 0 ? (
                                    <Text style={s.detalle}>Dispositivo: Sin asignar</Text>
                                ) : (
                                    dispositivosAsignados.map((d) => (
                                        <Text key={`asig-${item.id_funcionario}-${d.id}`} style={s.detalle}>
                                            Dispositivo: {d.nroSerie ?? `#${d.id}`}
                                        </Text>
                                    ))
                                )}
                            </View>
                        );
                    }}
                />
            )}
        </View>
    );

    const renderAsignarSector = () => {
        const ahora = new Date();

        // Solo eventos próximos y activos, ordenados por fecha
        const eventosDisponibles = eventos
            .filter((e) =>
                new Date(e.id.fechaHoraPartido) > ahora &&
                (e as any).estado !== 'suspendido' &&
                (!paisSedeAdmin || e.id.estadioDireccionPais === paisSedeAdmin) 
            )
            .sort((a, b) => new Date(a.id.fechaHoraPartido).getTime() - new Date(b.id.fechaHoraPartido).getTime());
        
            const eventoSeleccionado = eventoParaAsignar
            ? eventos.find((e) => JSON.stringify(e.id) === eventoParaAsignar)
            : null;

        // Solo sectores habilitados del evento seleccionado
        const sectoresFiltrados = eventoSeleccionado
            ? sectoresEvento.filter((se) =>
                se.id.estadioNombre === eventoSeleccionado.id.estadioNombre &&
                se.id.estadioDireccionPais === eventoSeleccionado.id.estadioDireccionPais &&
                se.id.estadioDireccionCiudad === eventoSeleccionado.id.estadioDireccionCiudad &&
                se.id.fechaHoraPartido === eventoSeleccionado.id.fechaHoraPartido
            )
            : [];

        // Sectores ya asignados al funcionario seleccionado en este evento
        const legajoSeleccionado = funcionarios.find((f) => String(f.id_funcionario) === funcionarioSector)?.nroLegajo;
        const sectoresYaAsignados = asignacionesSector
            .filter((a) =>
                eventoSeleccionado &&
                a.id.estadioNombre === eventoSeleccionado.id.estadioNombre &&
                a.id.fechaHoraPartido === eventoSeleccionado.id.fechaHoraPartido &&
                a.id.nroLegajo === legajoSeleccionado
            )
            .map((a) => a.id.nombreSector);

        // Excluir sectores ya asignados al funcionario en este evento
        const sectoresDisponibles = sectoresFiltrados.filter(
            (s) => !sectoresYaAsignados.includes(s.id.nombreSector)
        );

        const asignacionesFiltradas = asignacionesSector.filter((a) =>
            (!paisSedeAdmin || a.id.estadioDireccionPais === paisSedeAdmin) &&
            (!eventoParaAsignar ||
                (a.id.estadioNombre === eventoSeleccionado?.id.estadioNombre &&
                a.id.fechaHoraPartido === eventoSeleccionado?.id.fechaHoraPartido))
        );

        const dispositivosDelFuncionario = dispositivos.filter(
            (d) => d.nroLegajo === legajoSeleccionado
        );

        return (
            <View style={s.cardSeccion}>
                <Text style={s.subtitulo}>Asignar sector de evento</Text>
                <Text style={s.descripcionSeccion}>
                    Elegí el funcionario, el evento y el sector habilitado para crear la asignación.
                </Text>

                <Text style={s.label}>Funcionario</Text>
                <View style={s.pickerContainer}>
                    <Picker
                        selectedValue={funcionarioSector}
                        onValueChange={(v) => {
                            setFuncionarioSector(String(v));
                            setSectorSeleccionado('');
                            setDispositivoParaSector('');
                        }}
                    >
                        <Picker.Item label="Seleccioná un funcionario" value="" />
                        {funcionarios.map((funcionario) => (
                            <Picker.Item
                                key={String(funcionario.id_funcionario)}
                                label={`${funcionario.nroLegajo}${funcionario.perfil?.usuario?.mail ? ` - ${funcionario.perfil.usuario.mail}` : ''}`}
                                value={String(funcionario.id_funcionario)}
                            />
                        ))}
                    </Picker>
                </View>

                <Text style={s.label}>Evento</Text>
                <View style={s.pickerContainer}>
                    <Picker
                        selectedValue={eventoParaAsignar}
                        onValueChange={(v) => {
                            setEventoParaAsignar(String(v));
                            setSectorSeleccionado('');
                            setDispositivoParaSector('');
                        }}
                    >
                        <Picker.Item label="Seleccioná un evento" value="" />
                        {eventosDisponibles.map((evento) => (
                            <Picker.Item
                                key={JSON.stringify(evento.id)}
                                label={`${evento.id.nombrePaisEquipoLocal} vs ${evento.id.nombrePaisEquipoVisitante} - ${evento.id.estadioNombre} - ${formatearFechaDisplay(evento.id.fechaHoraPartido)}`}
                                value={JSON.stringify(evento.id)}
                            />
                        ))}
                    </Picker>
                </View>

                <Text style={s.label}>
                    Sector habilitado{eventoSeleccionado ? ` (${sectoresDisponibles.length} disponibles)` : ''}
                </Text>
                <View style={s.pickerContainer}>
                    <Picker
                        selectedValue={sectorSeleccionado}
                        onValueChange={(v) => setSectorSeleccionado(String(v))}
                        enabled={!!eventoSeleccionado && sectoresDisponibles.length > 0}
                    >
                        <Picker.Item
                            label={
                                !eventoSeleccionado
                                    ? 'Primero seleccioná un evento'
                                    : sectoresDisponibles.length === 0
                                    ? 'No hay sectores disponibles para asignar'
                                    : 'Seleccioná un sector'
                            }
                            value=""
                        />
                        {sectoresDisponibles.map((sector) => (
                            <Picker.Item
                                key={JSON.stringify(sector.id)}
                                label={sector.id.nombreSector}
                                value={JSON.stringify(sector.id)}
                            />
                        ))}
                    </Picker>
                </View>

                <Text style={s.label}>
                    Dispositivo{legajoSeleccionado ? ` (${dispositivosDelFuncionario.length} asignados)` : ''}
                </Text>
                <View style={s.pickerContainer}>
                    <Picker
                        selectedValue={dispositivoParaSector}
                        onValueChange={(v) => setDispositivoParaSector(String(v))}
                        enabled={!!sectorSeleccionado && dispositivosDelFuncionario.length > 0}
                    >
                        <Picker.Item
                            label={
                                !sectorSeleccionado
                                    ? 'Primero seleccioná un sector'
                                    : dispositivosDelFuncionario.length === 0
                                    ? 'Este funcionario no tiene dispositivos asignados'
                                    : 'Seleccioná un dispositivo'
                            }
                            value=""
                        />
                        {dispositivosDelFuncionario.map((d) => (
                            <Picker.Item
                                key={String(d.id)}
                                label={d.nroSerie ?? `#${d.id}`}
                                value={String(d.id)}
                            />
                        ))}
                    </Picker>
                </View>

                {exitoAsignarSector ? <Text style={s.mensajeExito}>{exitoAsignarSector}</Text> : null}
                {errorAsignarSector ? <Text style={s.mensajeError}>{errorAsignarSector}</Text> : null}

                <TouchableOpacity
                    style={[s.botonPrimario, (actionLoading || !sectorSeleccionado) && s.botonDeshabilitado]}
                    onPress={asignarSector}
                    disabled={actionLoading || !sectorSeleccionado || !dispositivoParaSector}
                >
                    <Text style={s.botonTexto}>{actionLoading ? 'Asignando...' : 'Asignar sector'}</Text>
                </TouchableOpacity>

                <Text style={[s.subtitulo, { marginTop: 16 }]}>Asignaciones actuales</Text>
                <Text style={[s.descripcionSeccion, { marginBottom: 8 }]}>
                    {eventoSeleccionado
                        ? `Mostrando asignaciones para ${eventoSeleccionado.id.nombrePaisEquipoLocal} vs ${eventoSeleccionado.id.nombrePaisEquipoVisitante}`
                        : 'Seleccioná un evento para filtrar las asignaciones.'}
                </Text>

                {asignacionesFiltradas.length === 0 ? (
                    <Text style={s.vacio}>No hay asignaciones para este evento.</Text>
                ) : ( 
                    <FlatList
                        data={asignacionesFiltradas}
                        keyExtractor={(item, index) => String(index)}
                        scrollEnabled={false}
                        ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
                        renderItem={({ item }) => (
                            <View style={s.cardSectorHabilitado}>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.detalle}>
                                        {item.id.nroLegajo} → {item.id.nombreSector}
                                    </Text>
                                    <Text style={[s.detalle, { fontSize: 11, color: '#9ca3af' }]}>
                                        {item.id.estadioNombre} - {formatearFechaDisplay(item.id.fechaHoraPartido)}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={s.botonEliminar}
                                    onPress={() => desasignarSector(item)}
                                    disabled={actionLoading}
                                >
                                    <Text style={s.botonEliminarTexto}>Quitar</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                )}

                {exitoDesasignarSector ? <Text style={s.mensajeExito}>{exitoDesasignarSector}</Text> : null}
                {errorDesasignarSector ? <Text style={s.mensajeError}>{errorDesasignarSector}</Text> : null}
            </View>
        );
    };

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
                            key={`disp-${funcionario.id_funcionario}`}
                            label={`${funcionario.nroLegajo}${funcionario.perfil?.usuario?.mail ? ` - ${funcionario.perfil.usuario.mail}` : ''}`}
                            value={String(funcionario.id_funcionario)}
                        />
                    ))}
                </Picker>
            </View>

            <Text style={s.label}>Dispositivo</Text>
            <View style={s.pickerContainer}>
                <Picker selectedValue={dispositivoSeleccionado} onValueChange={(v) => setDispositivoSeleccionado(String(v))}>
                    <Picker.Item label="Seleccioná un dispositivo" value="" />
                    {dispositivos
                        .filter((d) => typeof d.id === 'number')
                        .map((dispositivo) => (
                            <Picker.Item
                                key={`dev-${dispositivo.id}`}
                                label={
                                    `${dispositivo.nroSerie ?? `#${dispositivo.id}`} ${dispositivo.nroLegajo ? `(Asignado a ${dispositivo.nroLegajo})` : '(Sin asignar)'}`
                                }
                                value={String(dispositivo.id)}
                            />
                        ))}
                </Picker>
            </View>
                {exitoAsignar ? <Text style={s.mensajeExito}>{exitoAsignar}</Text> : null}
                {errorAsignar ? <Text style={s.mensajeError}>{errorAsignar}</Text> : null}
            <TouchableOpacity
                style={[s.botonSecundario, actionLoading && s.botonDeshabilitado]}
                onPress={asignarDispositivo}
                disabled={actionLoading}
            >
                <Text style={s.botonTexto}>{actionLoading ? 'Asignando...' : 'Asignar dispositivo'}</Text>
            </TouchableOpacity>
        </View>
    );

    const renderGestionDispositivos = () => (
        <View>
            {/* Registrar */}
            <View style={s.cardSeccion}>
                <Text style={s.subtitulo}>Registrar dispositivo</Text>
                <Text style={s.descripcionSeccion}>
                    Ingresá el número de serie del dispositivo físico para darlo de alta en el sistema.
                </Text>
                <Text style={s.label}>Número de serie</Text>
                <TextInput
                    style={s.input}
                    placeholder="Ej: SN-ABC123"
                    value={nuevoNroSerie}
                    onChangeText={setNuevoNroSerie}
                    autoCapitalize="characters"
                />
                {exitoRegistrar ? <Text style={s.mensajeExito}>{exitoRegistrar}</Text> : null}
                {errorRegistrar ? <Text style={s.mensajeError}>{errorRegistrar}</Text> : null}
                <TouchableOpacity
                    style={[s.botonPrimario, actionLoading && s.botonDeshabilitado]}
                    onPress={registrarDispositivo}
                    disabled={actionLoading}
                >
                    <Text style={s.botonTexto}>{actionLoading ? 'Registrando...' : 'Registrar dispositivo'}</Text>
                </TouchableOpacity>
            </View>

            {/* Lista */}
            <View style={s.cardSeccion}>
                <View style={s.cabeceraLista}>
                    <Text style={s.subtitulo}>Todos los dispositivos</Text>
                    <TouchableOpacity onPress={cargarDatos}>
                        <Text style={s.link}>Actualizar</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#1a73e8" />
                ) : dispositivos.length === 0 ? (
                    <Text style={s.vacio}>No hay dispositivos registrados.</Text>
                ) : (
                    <FlatList
                        data={dispositivos}
                        keyExtractor={(item) => String(item.id)}
                        scrollEnabled={false}
                        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                        renderItem={({ item }) => (
                            <View style={s.cardDispositivo}>
                                <View style={s.cardDispositivoInfo}>
                                    <Text style={s.cardTitulo}>{item.nroSerie ?? `#${item.id}`}</Text>
                                    {item.nroLegajo ? (
                                        <Text style={s.detalle}>Asignado a: {item.nroLegajo}</Text>
                                    ) : (
                                        <Text style={[s.detalle, s.libre]}>Sin asignar</Text>
                                    )}
                                </View>
                                <TouchableOpacity
                                    style={s.botonEliminar}
                                    onPress={() => eliminarDispositivo(item)}
                                    disabled={actionLoading}
                                >
                                    <Text style={s.botonEliminarTexto}>Eliminar</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                )}

                {exitoEliminar ? <Text style={s.mensajeExito}>{exitoEliminar}</Text> : null}
                {errorEliminar ? <Text style={s.mensajeError}>{errorEliminar}</Text> : null}
            </View>

            {/* Desasignar */}
            <View style={s.cardSeccion}>
                <Text style={s.subtitulo}>Desasignar dispositivo</Text>
                <Text style={s.descripcionSeccion}>
                    Liberá un dispositivo que está actualmente asignado a un funcionario.
                </Text>
                <Text style={s.label}>Dispositivo asignado</Text>
                <View style={s.pickerContainer}>
                    <Picker
                        selectedValue={dispositivoADesasignar}
                        onValueChange={(v) => setDispositivoADesasignar(String(v))}
                    >
                        <Picker.Item label="Seleccioná un dispositivo" value="" />
                        {dispositivos
                            .filter((d) => typeof d.id === 'number' && d.nroLegajo)
                            .map((d) => (
                                <Picker.Item
                                    key={`desasig-${d.id}`}
                                    label={`${d.nroSerie ?? `#${d.id}`} → ${d.nroLegajo}`}
                                    value={String(d.id)}
                                />
                            ))}
                    </Picker>
                </View>
                {exitoDesasignar ? <Text style={s.mensajeExito}>{exitoDesasignar}</Text> : null}
                {errorDesasignar ? <Text style={s.mensajeError}>{errorDesasignar}</Text> : null}
                <TouchableOpacity
                    style={[s.botonWarning, actionLoading && s.botonDeshabilitado]}
                    onPress={desasignarDispositivo}
                    disabled={actionLoading}
                >
                    <Text style={s.botonTexto}>{actionLoading ? 'Desasignando...' : 'Desasignar'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderModalEliminar = () => (
        <Modal
            visible={modalEliminar}
            transparent
            animationType="fade"
            onRequestClose={() => setModalEliminar(false)}
        >
            <View style={s.modalOverlay}>
                <View style={s.modalCard}>
                    <Text style={s.modalTitulo}>Confirmar eliminación</Text>
                    <Text style={s.modalMensaje}>
                        ¿Estás seguro de que querés eliminar el dispositivo{' '}
                        <Text style={{ fontWeight: '800' }}>
                            {dispositivoAEliminar?.nroSerie ?? `#${dispositivoAEliminar?.id}`}
                        </Text>
                        ? Esta acción no se puede deshacer.
                    </Text>
                    <View style={s.modalBotones}>
                        <TouchableOpacity
                            style={s.modalBotonCancelar}
                            onPress={() => {
                                setModalEliminar(false);
                                setDispositivoAEliminar(null);
                            }}
                            disabled={actionLoading}
                        >
                            <Text style={s.modalBotonCancelarTexto}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[s.modalBotonEliminar, actionLoading && s.botonDeshabilitado]}
                            onPress={confirmarEliminar}
                            disabled={actionLoading}
                        >
                            <Text style={s.botonTexto}>
                                {actionLoading ? 'Eliminando...' : 'Eliminar'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
    return (
        <>
        {renderModalEliminar()}
        <ScrollView style={s.root} contentContainerStyle={s.contenedor}>
            <Text style={s.titulo}>Gestión de Funcionarios y Dispositivos</Text>
        <Text style={s.descripcion}>
            Administrá funcionarios, sectores de eventos y dispositivos de escaneo desde una sola pantalla.
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
            {subtab === 'gestionDispositivos' && renderGestionDispositivos()}
        </ScrollView>
        </>
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
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        color: '#111827',
        backgroundColor: '#fff',
        marginBottom: 10,
    },
    cardDispositivo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 12,
        backgroundColor: '#fafafa',
    },
    cardDispositivoInfo: { flex: 1 },
    libre: { color: '#10b981', fontWeight: '700' },
    botonEliminar: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginLeft: 8,
    },
    botonEliminarTexto: { color: '#fff', fontWeight: '700', fontSize: 13 },
    botonWarning: {
        backgroundColor: '#f59e0b',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 420,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    modalTitulo: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 10,
    },
    modalMensaje: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
        marginBottom: 20,
    },
    modalBotones: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    modalBotonCancelar: {
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#fff',
    },
    modalBotonCancelarTexto: {
        color: '#374151',
        fontWeight: '700',
        fontSize: 14,
    },
    modalBotonEliminar: {
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#ef4444',
    },
    mensajeExito: {
        color: '#10b981',
        fontWeight: '700',
        fontSize: 13,
        marginTop: 8,
        textAlign: 'center',
    },
    mensajeError: {
        color: '#ef4444',
        fontWeight: '700',
        fontSize: 13,
        marginTop: 8,
        textAlign: 'center',
    },
    cardSectorHabilitado: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 12,
        backgroundColor: '#fafafa',
    },
});
