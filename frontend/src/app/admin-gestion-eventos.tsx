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

type Evento = {
    id: number;
    nombre: string;
    fecha: string;
    lugar: string;
}

export default function AdminGestionEventosScreen() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

}
