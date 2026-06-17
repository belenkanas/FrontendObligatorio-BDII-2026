import { useCallback, useState } from "react";
import api from "../../services/api";
import { useFocusEffect } from "expo-router";
import {
    Alert,
    FlatList,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
} from "react-native";

type Usuario = {
    id?: number;
    mail: string;
    documentoTipo?: string;
    documentoNumeroDoc?: string;
    direccionCalle?: string;
    direccionNumero?: string;
    direccionCodigoPostal?: string;
    direccionPais?: string;
    direccionLocalidad?: string;
};

type Perfil = {
    id?: number;
    usuario: Usuario;
};

type General = {
    id_general: number;
    perfil: Perfil;
    fecha_registro?: string; // ISO date string generado por el backend
    estadoVerificacionId?: 'pendiente' | 'verificado' | 'rechazado' | string;
};

function formatFecha(iso?: string) {
    if (!iso) return 'Fecha no informada';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function AdminSolicitudesScreen() {
    const [solicitudes, setSolicitudes] = useState<General[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const cargarSolicitudes = async () => {
        try {
            if (!refreshing) setLoading(true);
            const response = await api.get(
                "/administradores/verificaciones/pendientes"
            );

            setSolicitudes(Array.isArray(response.data) ? response.data : []);
        } catch (err: any) {
            setSolicitudes([]);
            console.warn("Error cargando solicitudes:", err?.message ?? err);
            Alert.alert("Error", "No se pudieron cargar las solicitudes");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            cargarSolicitudes();
        }, [])
    );

    const responder = async (
        idGeneral: number,
        estado: "verificado" | "rechazado"
    ) => {
        try {
            await api.post("/administradores/verificaciones/responder", {
                idGeneral,
                estado,
            });

            Alert.alert(
                "Hecho",
                estado === "verificado"
                    ? "Usuario verificado correctamente"
                    : "Usuario rechazado"
            );

            cargarSolicitudes();
        } catch (err: any) {
            Alert.alert("Error", err.response?.data || "No se pudo procesar la solicitud");
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#1a73e8" />
                <Text style={styles.estadoTexto}>Cargando solicitudes...</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={solicitudes}
            keyExtractor={(item: any) => item.id?.toString() ?? item.id_general?.toString() ?? Math.random().toString()}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => {
                        setRefreshing(true);
                        cargarSolicitudes();
                    }}
                />
            }
            ListEmptyComponent={() => (
                <View style={styles.center}>
                    <Text>No hay solicitudes pendientes</Text>
                </View>
            )}
            renderItem={({ item }) => (
                <View style={styles.card}>
                    <Text style={styles.titulo}>{item.perfil?.usuario?.mail}</Text>

                    <Text style={styles.detalle}>Tipo de documento: {item.perfil?.usuario?.documentoTipo}</Text>
                    <Text style={styles.detalle}>Número de documento: {item.perfil?.usuario?.documentoNumeroDoc}</Text>
                    <Text style={styles.detalle}>País: {item.perfil?.usuario?.direccionPais}</Text>
                    <Text style={styles.detalle}>Localidad: {item.perfil?.usuario?.direccionLocalidad}</Text>
                    <Text style={styles.detalle}>Calle: {item.perfil?.usuario?.direccionCalle}</Text>
                    <Text style={styles.detalle}>Número: {item.perfil?.usuario?.direccionNumero}</Text>
                    <Text style={styles.detalle}>Código postal: {item.perfil?.usuario?.direccionCodigoPostal}</Text>
                    <Text style={styles.detalle}>Fecha registro: {formatFecha(item.fecha_registro)}</Text>
                    <Text style={styles.detalle}>Estado de verificación de identidad: {item.estadoVerificacionId ?? 'pendiente'}</Text>

                    <View style={styles.botones}>
                        <TouchableOpacity
                            style={[styles.boton, styles.aprobar]}
                            onPress={() => responder(item.id_general, "verificado")}
                        >
                            <Text style={styles.botonTexto}>Verificar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.boton, styles.rechazar]}
                            onPress={() => responder(item.id_general, "rechazado")}
                        >
                            <Text style={styles.botonTexto}>Rechazar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        />
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    estadoTexto: {
        marginTop: 12,
        color: "#64748b",
    },
    card: {
        backgroundColor: "#fff",
        margin: 12,
        padding: 14,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    titulo: {
        fontWeight: "800",
        fontSize: 16,
        marginBottom: 6,
    },
    detalle: {
        color: "#475569",
        marginBottom: 6,
    },
    botones: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 8,
    },
    boton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
    },
    botonTexto: {
        color: "#fff",
        fontWeight: "700",
    },
    aprobar: {
        backgroundColor: "#16a34a",
    },
    rechazar: {
        backgroundColor: "#b91c1c",
    },
});