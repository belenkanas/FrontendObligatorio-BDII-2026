import api from '../../services/api';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

type SubTab = 'eventos' | 'habilitarSectores' | 'maestros';

type EventoId = {
  estadioNombre: string;
  estadioDireccionPais: string;
  estadioDireccionCiudad: string;
  fechaHoraPartido: string;
  nombrePaisEquipoLocal: string;
  nombrePaisEquipoVisitante: string;
};

type Evento = {
  id?: EventoId;
  estadioNombre?: string;
  estadioDireccionPais?: string;
  estadioDireccionCiudad?: string;
  fechaHoraPartido?: string;
  nombrePaisEquipoLocal?: string;
  nombrePaisEquipoVisitante?: string;
};

type Sector = {
  id: {
    nombre: string;
    estadioNombre: string;
    estadioDireccionPais: string;
    estadioDireccionCiudad: string;
  };
  capacidadMax?: number;
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

type Estadio = {
  id?: {
    nombre: string;
    direccion_pais: string;
    direccion_ciudad: string;
  };
  nombre?: string;
  direccion_pais?: string;
  direccion_ciudad?: string;
};

type Equipo = {
  nombrePais: string;
};

const obtenerMensajeError = (err: any, fallback: string) => {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (typeof data?.message === 'string') return data.message;
  if (typeof data?.error === 'string') return data.error;
  return fallback;
};

const normalizarEventoId = (evento: Evento): EventoId | null => {
  const id = evento.id ?? (evento as any);
  if (!id) return null;

  if (
    !id.estadioNombre ||
    !id.estadioDireccionPais ||
    !id.estadioDireccionCiudad ||
    !id.fechaHoraPartido ||
    !id.nombrePaisEquipoLocal ||
    !id.nombrePaisEquipoVisitante
  ) {
    return null;
  }

  return {
    estadioNombre: id.estadioNombre,
    estadioDireccionPais: id.estadioDireccionPais,
    estadioDireccionCiudad: id.estadioDireccionCiudad,
    fechaHoraPartido: id.fechaHoraPartido,
    nombrePaisEquipoLocal: id.nombrePaisEquipoLocal,
    nombrePaisEquipoVisitante: id.nombrePaisEquipoVisitante,
  };
};

export default function AdminGestionEventosScreen() {
  const [subtab, setSubtab] = useState<SubTab>('eventos');
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [sectoresEvento, setSectoresEvento] = useState<SectorEvento[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [estadios, setEstadios] = useState<Estadio[]>([]);

  const [estadioEventoSeleccionado, setEstadioEventoSeleccionado] = useState('');
  const [equipoLocal, setEquipoLocal] = useState('');
  const [equipoVisitante, setEquipoVisitante] = useState('');
  const [fechaHoraEvento, setFechaHoraEvento] = useState('');

  const [eventoParaSector, setEventoParaSector] = useState('');
  const [sectorParaHabilitar, setSectorParaHabilitar] = useState('');

  const [nuevoEquipo, setNuevoEquipo] = useState('');
  const [nuevoEstadioNombre, setNuevoEstadioNombre] = useState('');
  const [nuevoEstadioPais, setNuevoEstadioPais] = useState('');
  const [nuevoEstadioCiudad, setNuevoEstadioCiudad] = useState('');
  const [nuevoSectorNombre, setNuevoSectorNombre] = useState('');
  const [nuevoSectorCapacidad, setNuevoSectorCapacidad] = useState('');
  const [estadioParaSector, setEstadioParaSector] = useState('');
  

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const subtabs: { key: SubTab; label: string }[] = [
    { key: 'eventos', label: 'Crear Eventos' },
    { key: 'habilitarSectores', label: 'Habilitar Sectores' },
    { key: 'maestros', label: 'Equipos/Estadios/Sectores' },
  ];

  const labelEvento = (id: EventoId) =>
    `${id.nombrePaisEquipoLocal} vs ${id.nombrePaisEquipoVisitante} - ${id.estadioNombre} - ${id.fechaHoraPartido}`;

  const labelEstadio = (e: Estadio) => {
    const id = e.id ?? (e as any);
    return `${id?.nombre ?? ''} - ${id?.direccion_ciudad ?? ''}, ${id?.direccion_pais ?? ''}`;
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [eventosRes, sectoresRes, sectorEventosRes, equiposRes, estadiosRes] = await Promise.all([
        api.get('/eventos'),
        api.get('/sectores'),
        api.get('/sector-eventos'),
        api.get('/equipos'),
        api.get('/estadios'),
      ]);

      setEventos(Array.isArray(eventosRes.data) ? eventosRes.data : []);
      setSectores(Array.isArray(sectoresRes.data) ? sectoresRes.data : []);
      setSectoresEvento(Array.isArray(sectorEventosRes.data) ? sectorEventosRes.data : []);
      setEquipos(Array.isArray(equiposRes.data) ? equiposRes.data : []);
      setEstadios(Array.isArray(estadiosRes.data) ? estadiosRes.data : []);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los datos de gestión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const crearEvento = async () => {
    if (!estadioEventoSeleccionado || !equipoLocal || !equipoVisitante || !fechaHoraEvento.trim()) {
      Alert.alert('Falta información', 'Completá estadio, equipos y fecha/hora del evento.');
      return;
    }
    if (equipoLocal === equipoVisitante) {
      Alert.alert('Validación', 'El equipo local y visitante deben ser distintos.');
      return;
    }

    const estadio = estadios.find((e) => JSON.stringify(e.id ?? e) === estadioEventoSeleccionado);
    const estadioId = estadio?.id ?? (estadio as any);
    if (!estadioId?.nombre) {
      Alert.alert('Error', 'No se pudo resolver el estadio seleccionado.');
      return;
    }

    setActionLoading(true);
    try {
      await api.post('/eventos', {
        id: {
          estadioNombre: estadioId.nombre,
          estadioDireccionPais: estadioId.direccion_pais,
          estadioDireccionCiudad: estadioId.direccion_ciudad,
          fechaHoraPartido: fechaHoraEvento.trim(),
          nombrePaisEquipoLocal: equipoLocal,
          nombrePaisEquipoVisitante: equipoVisitante,
        },
      });

      Alert.alert('Éxito', 'Evento creado correctamente.');
      setFechaHoraEvento('');
      setEquipoLocal('');
      setEquipoVisitante('');
      await cargarDatos();
    } catch (err: any) {
      Alert.alert('Error', obtenerMensajeError(err, 'No se pudo crear el evento.'));
    } finally {
      setActionLoading(false);
    }
  };

  const habilitarSector = async () => {
    if (!eventoParaSector || !sectorParaHabilitar) {
      Alert.alert('Falta información', 'Seleccioná evento y sector para habilitar.');
      return;
    }

    const evento = eventos.find((e) => {
      const id = normalizarEventoId(e);
      return id && JSON.stringify(id) === eventoParaSector;
    });
    const eventoId = evento ? normalizarEventoId(evento) : null;

    const sector = sectores.find((s) => JSON.stringify(s.id) === sectorParaHabilitar);
    if (!eventoId || !sector) {
      Alert.alert('Error', 'No se pudo resolver evento o sector seleccionado.');
      return;
    }

    const sectoresFiltrados = eventoParaSector
    ? sectores.filter((s) => {
        const eventoId = eventos
            .map(normalizarEventoId)
            .find((id) => id && JSON.stringify(id) === eventoParaSector);
        return eventoId && s.id.estadioNombre === eventoId.estadioNombre;
    })
    : [];

    setActionLoading(true);
    try {
      await api.post('/sector-eventos', {
        id: {
          nombreSector: sector.id.nombre,
          estadioNombre: eventoId.estadioNombre,
          estadioDireccionPais: eventoId.estadioDireccionPais,
          estadioDireccionCiudad: eventoId.estadioDireccionCiudad,
          fechaHoraPartido: eventoId.fechaHoraPartido,
        },
      });

      Alert.alert('Éxito', 'Sector habilitado para el evento.');
      setSectorParaHabilitar('');
      await cargarDatos();
    } catch (err: any) {
      Alert.alert('Error', obtenerMensajeError(err, 'No se pudo habilitar el sector.'));
    } finally {
      setActionLoading(false);
    }
  };

  const crearEquipo = async () => {
    if (!nuevoEquipo.trim()) {
      Alert.alert('Falta información', 'Ingresá el nombre del país/equipo.');
      return;
    }

    setActionLoading(true);
    try {
      await api.post('/equipos', { nombrePais: nuevoEquipo.trim() });
      Alert.alert('Éxito', 'Equipo creado correctamente.');
      setNuevoEquipo('');
      await cargarDatos();
    } catch (err: any) {
      Alert.alert('Error', obtenerMensajeError(err, 'No se pudo crear el equipo.'));
    } finally {
      setActionLoading(false);
    }
  };

  const crearEstadio = async () => {
    if (!nuevoEstadioNombre.trim() || !nuevoEstadioPais.trim() || !nuevoEstadioCiudad.trim()) {
      Alert.alert('Falta información', 'Completá nombre, país y ciudad del estadio.');
      return;
    }

    setActionLoading(true);
    try {
      await api.post('/estadios', {
        id: {
          nombre: nuevoEstadioNombre.trim(),
          direccion_pais: nuevoEstadioPais.trim(),
          direccion_ciudad: nuevoEstadioCiudad.trim(),
        },
      });

      Alert.alert('Éxito', 'Estadio creado correctamente.');
      setNuevoEstadioNombre('');
      setNuevoEstadioPais('');
      setNuevoEstadioCiudad('');
      await cargarDatos();
    } catch (err: any) {
      Alert.alert('Error', obtenerMensajeError(err, 'No se pudo crear el estadio.'));
    } finally {
      setActionLoading(false);
    }
  };

  const crearSector = async () => {
    if (!estadioParaSector || !nuevoSectorNombre.trim() || !nuevoSectorCapacidad.trim()) {
      Alert.alert('Falta información', 'Completá estadio, nombre del sector y capacidad.');
      return;
    }

    const capacidad = Number(nuevoSectorCapacidad);
    if (!Number.isFinite(capacidad) || capacidad <= 0) {
      Alert.alert('Validación', 'La capacidad debe ser un número mayor a 0.');
      return;
    }

    const estadio = estadios.find((e) => JSON.stringify(e.id ?? e) === estadioParaSector);
    const estadioId = estadio?.id ?? (estadio as any);
    if (!estadioId?.nombre) {
      Alert.alert('Error', 'No se pudo resolver el estadio seleccionado.');
      return;
    }

    setActionLoading(true);
    try {
      await api.post('/sectores', {
        id: {
          nombre: nuevoSectorNombre.trim(),
          estadioNombre: estadioId.nombre,
          estadioDireccionPais: estadioId.direccion_pais,
          estadioDireccionCiudad: estadioId.direccion_ciudad,
        },
        capacidadMax: capacidad,
      });

      Alert.alert('Éxito', 'Sector creado correctamente.');
      setNuevoSectorNombre('');
      setNuevoSectorCapacidad('');
      await cargarDatos();
    } catch (err: any) {
      Alert.alert('Error', obtenerMensajeError(err, 'No se pudo crear el sector.'));
    } finally {
      setActionLoading(false);
    }
  };

  const renderEventos = () => (
    <View style={s.cardSeccion}>
      <Text style={s.subtitulo}>Cargar nuevo evento</Text>
      <Text style={s.descripcionSeccion}>Formato fecha-hora sugerido: `YYYY-MM-DDTHH:mm:ss`.</Text>

      <Text style={s.label}>Estadio</Text>
      <View style={s.pickerContainer}>
        <Picker selectedValue={estadioEventoSeleccionado} onValueChange={(v) => setEstadioEventoSeleccionado(String(v))}>
          <Picker.Item label="Seleccioná un estadio" value="" />
          {estadios.map((estadio) => (
            <Picker.Item
              key={JSON.stringify(estadio.id ?? estadio)}
              label={labelEstadio(estadio)}
              value={JSON.stringify(estadio.id ?? estadio)}
            />
          ))}
        </Picker>
      </View>

      <Text style={s.label}>Equipo local</Text>
      <View style={s.pickerContainer}>
        <Picker selectedValue={equipoLocal} onValueChange={(v) => setEquipoLocal(String(v))}>
          <Picker.Item label="Seleccioná el equipo local" value="" />
          {equipos.map((equipo) => (
            <Picker.Item key={`local-${equipo.nombrePais}`} label={equipo.nombrePais} value={equipo.nombrePais} />
          ))}
        </Picker>
      </View>

      <Text style={s.label}>Equipo visitante</Text>
      <View style={s.pickerContainer}>
        <Picker selectedValue={equipoVisitante} onValueChange={(v) => setEquipoVisitante(String(v))}>
          <Picker.Item label="Seleccioná el equipo visitante" value="" />
          {equipos.map((equipo) => (
            <Picker.Item key={`visita-${equipo.nombrePais}`} label={equipo.nombrePais} value={equipo.nombrePais} />
          ))}
        </Picker>
      </View>

      <Text style={s.label}>Fecha y hora</Text>
      <TextInput
        style={s.input}
        placeholder="2026-07-10T20:30:00"
        value={fechaHoraEvento}
        onChangeText={setFechaHoraEvento}
        autoCapitalize="none"
      />

      <TouchableOpacity style={[s.botonPrimario, actionLoading && s.botonDeshabilitado]} onPress={crearEvento} disabled={actionLoading}>
        <Text style={s.botonTexto}>{actionLoading ? 'Cargando...' : 'Cargar evento'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHabilitarSectores = () => {
    // Filtrar sectores del estadio del evento seleccionado
    const eventoIdSeleccionado = eventoParaSector
        ? eventos.map(normalizarEventoId).find((id) => id && JSON.stringify(id) === eventoParaSector)
        : null;

    const sectoresFiltrados = eventoIdSeleccionado
        ? sectores.filter((s) => s.id.estadioNombre === eventoIdSeleccionado.estadioNombre
            && s.id.estadioDireccionPais === eventoIdSeleccionado.estadioDireccionPais
            && s.id.estadioDireccionCiudad === eventoIdSeleccionado.estadioDireccionCiudad)
        : [];

    // Sectores ya habilitados para el evento seleccionado
    const sectoresYaHabilitados = eventoIdSeleccionado
        ? sectoresEvento.filter((se) =>
            se.id.estadioNombre === eventoIdSeleccionado.estadioNombre &&
            se.id.estadioDireccionPais === eventoIdSeleccionado.estadioDireccionPais &&
            se.id.estadioDireccionCiudad === eventoIdSeleccionado.estadioDireccionCiudad &&
            se.id.fechaHoraPartido === eventoIdSeleccionado.fechaHoraPartido
        )
        : [];

    const nombresYaHabilitados = sectoresYaHabilitados.map((se) => se.id.nombreSector);

    const sectoresDisponibles = sectoresFiltrados.filter(
        (s) => !nombresYaHabilitados.includes(s.id.nombre)
    );

    return (
        <View style={s.cardSeccion}>
            <Text style={s.subtitulo}>Habilitar sectores para eventos</Text>

            <Text style={s.label}>Evento</Text>
            <View style={s.pickerContainer}>
                <Picker
                    selectedValue={eventoParaSector}
                    onValueChange={(v) => {
                        setEventoParaSector(String(v));
                        setSectorParaHabilitar(''); // resetear sector al cambiar evento
                    }}
                >
                    <Picker.Item label="Seleccioná un evento" value="" />
                    {eventos
                        .map((evento) => normalizarEventoId(evento))
                        .filter((id): id is EventoId => !!id)
                        .map((id) => (
                            <Picker.Item
                                key={JSON.stringify(id)}
                                label={labelEvento(id)}
                                value={JSON.stringify(id)}
                            />
                        ))}
                </Picker>
            </View>

            <Text style={s.label}>
                Sector{eventoIdSeleccionado ? ` (${sectoresDisponibles.length} disponibles)` : ''}
            </Text>
            <View style={s.pickerContainer}>
                <Picker
                    selectedValue={sectorParaHabilitar}
                    onValueChange={(v) => setSectorParaHabilitar(String(v))}
                    enabled={!!eventoIdSeleccionado}
                >
                    <Picker.Item
                        label={eventoIdSeleccionado ? 'Seleccioná un sector' : 'Primero seleccioná un evento'}
                        value=""
                    />
                    {sectoresDisponibles.map((sector) => (
                        <Picker.Item
                            key={JSON.stringify(sector.id)}
                            label={sector.id.nombre}
                            value={JSON.stringify(sector.id)}
                        />
                    ))}
                </Picker>
            </View>

            <TouchableOpacity
                style={[s.botonPrimario, actionLoading && s.botonDeshabilitado]}
                onPress={habilitarSector}
                disabled={actionLoading}
            >
                <Text style={s.botonTexto}>{actionLoading ? 'Habilitando...' : 'Habilitar sector'}</Text>
            </TouchableOpacity>

            {/* Sectores ya habilitados para el evento seleccionado */}
            {eventoIdSeleccionado && (
                <>
                    <Text style={[s.subtitulo, { marginTop: 16 }]}>
                        Sectores habilitados para este evento
                    </Text>
                    {sectoresYaHabilitados.length === 0 ? (
                        <Text style={s.vacio}>No hay sectores habilitados para este evento.</Text>
                    ) : (
                        <FlatList
                            data={sectoresYaHabilitados}
                            keyExtractor={(item, index) => String(index)}
                            scrollEnabled={false}
                            renderItem={({ item }) => (
                                <Text style={s.detalle}>• {item.id.nombreSector}</Text>
                            )}
                        />
                    )}
                </>
            )}

            {/* Lista global si no hay evento seleccionado */}
            {!eventoIdSeleccionado && (
                <>
                    <Text style={[s.subtitulo, { marginTop: 16 }]}>Todos los sectores habilitados</Text>
                    {sectoresEvento.length === 0 ? (
                        <Text style={s.vacio}>No hay sectores habilitados en eventos.</Text>
                    ) : (
                        <FlatList
                            data={sectoresEvento}
                            keyExtractor={(item, index) => String(index)}
                            scrollEnabled={false}
                            renderItem={({ item }) => (
                                <Text style={s.detalle}>
                                    • {item.id.nombreSector} - {item.id.estadioNombre} - {item.id.fechaHoraPartido}
                                </Text>
                            )}
                        />
                    )}
                </>
            )}
        </View>
    );
};

  const renderMaestros = () => (
    <>
      <View style={s.cardSeccion}>
        <Text style={s.subtitulo}>Cargar nuevo equipo</Text>
        <TextInput style={s.input} placeholder="Nombre país" value={nuevoEquipo} onChangeText={setNuevoEquipo} />
        <TouchableOpacity style={[s.botonPrimario, actionLoading && s.botonDeshabilitado]} onPress={crearEquipo} disabled={actionLoading}>
          <Text style={s.botonTexto}>{actionLoading ? 'Cargando...' : 'Cargar equipo'}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.cardSeccion}>
        <Text style={s.subtitulo}>Cargar nuevo estadio</Text>
        <TextInput style={s.input} placeholder="Nombre del estadio" value={nuevoEstadioNombre} onChangeText={setNuevoEstadioNombre} />
        <TextInput style={s.input} placeholder="País" value={nuevoEstadioPais} onChangeText={setNuevoEstadioPais} />
        <TextInput style={s.input} placeholder="Ciudad" value={nuevoEstadioCiudad} onChangeText={setNuevoEstadioCiudad} />
        <TouchableOpacity style={[s.botonPrimario, actionLoading && s.botonDeshabilitado]} onPress={crearEstadio} disabled={actionLoading}>
          <Text style={s.botonTexto}>{actionLoading ? 'Cargando...' : 'Cargar estadio'}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.cardSeccion}>
        <Text style={s.subtitulo}>Cargar nuevo sector</Text>
        <Text style={s.label}>Estadio</Text>
        <View style={s.pickerContainer}>
          <Picker selectedValue={estadioParaSector} onValueChange={(v) => setEstadioParaSector(String(v))}>
            <Picker.Item label="Seleccioná un estadio" value="" />
            {estadios.map((estadio) => (
              <Picker.Item
                key={`sector-${JSON.stringify(estadio.id ?? estadio)}`}
                label={labelEstadio(estadio)}
                value={JSON.stringify(estadio.id ?? estadio)}
              />
            ))}
          </Picker>
        </View>

        <TextInput style={s.input} placeholder="Nombre del sector" value={nuevoSectorNombre} onChangeText={setNuevoSectorNombre} />
        <TextInput
          style={s.input}
          placeholder="Capacidad máxima"
          keyboardType="numeric"
          value={nuevoSectorCapacidad}
          onChangeText={setNuevoSectorCapacidad}
        />
        <TouchableOpacity style={[s.botonPrimario, actionLoading && s.botonDeshabilitado]} onPress={crearSector} disabled={actionLoading}>
          <Text style={s.botonTexto}>{actionLoading ? 'Cargando...' : 'Cargar sector'}</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <ScrollView style={s.root} contentContainerStyle={s.contenedor}>
      <Text style={s.titulo}>Gestión de eventos y sectores</Text>
      <Text style={s.descripcion}>Creá eventos, habilitá sectores y administrá catálogos de equipos/estadios/sectores.</Text>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={subtabs}
        keyExtractor={(item) => item.key}
        contentContainerStyle={s.subtabsRow}
        renderItem={({ item }) => (
          <TouchableOpacity style={[s.subtab, subtab === item.key && s.subtabActivo]} onPress={() => setSubtab(item.key)}>
            <Text style={[s.subtabTexto, subtab === item.key && s.subtabTextoActivo]}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <View style={s.estadoCentrado}>
          <ActivityIndicator size="large" color="#1a73e8" />
        </View>
      ) : (
        <>
          {subtab === 'eventos' && renderEventos()}
          {subtab === 'habilitarSectores' && renderHabilitarSectores()}
          {subtab === 'maestros' && renderMaestros()}
        </>
      )}
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
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, marginBottom: 10, backgroundColor: '#fff' },
  botonPrimario: { backgroundColor: '#1a73e8', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 6 },
  botonDeshabilitado: { opacity: 0.6 },
  botonTexto: { color: '#fff', fontWeight: '800' },
  estadoCentrado: { paddingVertical: 18, alignItems: 'center' },
  vacio: { color: '#9ca3af', fontStyle: 'italic' },
  detalle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
});


