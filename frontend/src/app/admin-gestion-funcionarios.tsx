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

export default function AdminGestionFuncionariosScreen() {
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

    const cargarFuncionarios = async () => {
        setLoading(true);
        try {
            const res = await api.get('/funcionarios');
            setFuncionarios(Array.isArray(res.data) ? res.data : []);
        } catch {
            Alert.alert('Error', 'No se pudieron cargar los funcionarios.');
        } finally {
            setLoading(false);
        }   
    };

    useEffect(() => {
        cargarFuncionarios();
    }, []);
}
