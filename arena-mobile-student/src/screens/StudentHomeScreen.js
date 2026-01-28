import React, { useContext, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { ThemeContext } from '../../App';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { LucideMapPin, LucideClock, LucideAward } from 'lucide-react-native';

export default function StudentHomeScreen() {
  const { theme, user } = useContext(ThemeContext);
  const [location, setLocation] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  
  // Stats
  const [nextClass, setNextClass] = useState({ time: '18:00', name: 'Jiu-Jitsu Avançado', id: '123' });
  const [progress, setProgress] = useState(0.85); // 85% to next stripe

  const performCheckIn = async () => {
    setCheckingIn(true);
    try {
      // 1. Get GPS Location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos do GPS para confirmar que você está na academia.');
        setCheckingIn(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);

      // 2. Validate Geofence (Mock Logic)
      // Check if distance between location.coords and academyCoords < 100 meters
      const isClose = true; // Simulating success

      if (isClose) {
         // 3. Call API
         // await api.post('/attendance/checkin', { studentId: user._id, lat: location.coords.latitude, lng: location.coords.longitude });
         Alert.alert('Check-in Realizado!', `Presença confirmada na aula das ${nextClass.time}`);
      } else {
         Alert.alert('Longe demais', 'Você precisa estar na academia para fazer check-in.');
      }

    } catch (e) {
      Alert.alert('Erro', 'Não foi possível obter localização.');
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>

      {/* Header */}
      <View style={styles.header}>
         <View>
            <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Bem-vindo de volta,</Text>
            <Text style={{ color: theme.text, fontSize: 24, fontWeight: 'bold' }}>{user.name || 'Guerreiro'}</Text>
         </View>
         <View style={[styles.beltBadge, { backgroundColor: theme.background, borderColor: theme.primary, borderWidth: 1 }]}>
            <Text style={{ color: theme.primary, fontWeight: 'bold' }}>{user.belt || 'Branca'}</Text>
         </View>
      </View>

      {/* Main Check-in Card */}
      <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.primary }]}>
         <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>PRÓXIMA AULA (HOJE)</Text>
         <Text style={{ color: theme.text, fontSize: 36, fontWeight: '900', marginBottom: 5 }}>{nextClass.time}</Text>
         <Text style={{ color: theme.text, fontSize: 18, marginBottom: 20 }}>{nextClass.name}</Text>

         <TouchableOpacity onPress={performCheckIn} disabled={checkingIn}>
            <LinearGradient
                colors={[theme.primary, theme.primary + 'CC']}
                style={styles.checkinButton}
            >
                <LucideMapPin color="white" size={24} style={{ marginRight: 10 }} />
                <Text style={styles.checkinText}>
                    {checkingIn ? 'LOCALIZANDO...' : 'FAZER CHECK-IN'}
                </Text>
            </LinearGradient>
         </TouchableOpacity>
         <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 10, textAlign: 'center' }}>
            <LucideClock size={12} color={theme.textSecondary} /> Check-in liberado 15min antes
         </Text>
      </View>

      {/* Progress Section */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Meu Progresso</Text>
      <View style={[styles.progressCard, { backgroundColor: theme.card }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: theme.text, fontWeight: 'bold' }}>Rumo ao {user.degree || '1º Grau'}</Text>
              <Text style={{ color: theme.primary, fontWeight: 'bold' }}>{Math.round(progress * 100)}%</Text>
          </View>
          
          <View style={{ height: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 5 }}>
              <LinearGradient
                colors={[theme.primary, theme.primary]}
                style={{ width: `${progress * 100}%`, height: '100%', borderRadius: 5 }}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              />
          </View>
          <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 10 }}>
             Faltam 12 aulas para a graduação. Continue treinando!
          </Text>
      </View>
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 30 },
  beltBadge: { paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20 },
  card: { padding: 25, borderRadius: 24, marginBottom: 30, elevation: 10 },
  checkinButton: { flexDirection: 'row', height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  checkinText: { color: 'white', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15 },
  progressCard: { padding: 20, borderRadius: 16 }
});
