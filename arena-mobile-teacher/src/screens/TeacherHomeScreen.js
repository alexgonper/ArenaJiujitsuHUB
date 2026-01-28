import React, { useContext, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { ThemeContext } from '../../App';
import api from '../services/api';
import { format } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import { LucideClock, LucideUsers, LucideChevronRight } from 'lucide-react-native';

export default function TeacherHomeScreen() {
  const { theme, user } = useContext(ThemeContext);
  const navigation = useNavigation();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      // Fetch classes for today
      // Assuming endpoint exists or we mock it for now
      // const res = await api.get(`/teachers/${user._id}/classes?date=${new Date().toISOString()}`);
      // MOCK DATA based on user schema structure
      const mockClasses = [
        { _id: '1', time: '18:00', name: 'Jiu-Jitsu Fundamentals', level: 'Iniciante', students: 12 },
        { _id: '2', time: '19:30', name: 'Competition Training', level: 'Avançado', students: 8 },
      ];
      setClasses(mockClasses);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchSchedule} tintColor={theme.primary} />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: theme.textSecondary }]}>Bem-vindo Sensei,</Text>
        <Text style={[styles.name, { color: theme.text }]}>{user?.name || 'Professor'}</Text>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Sua Próxima Aula</Text>
      
      {classes.length > 0 ? (
        <TouchableOpacity 
          style={[styles.highlightCard, { backgroundColor: theme.card, borderColor: theme.primary }]}
          onPress={() => navigation.navigate('Attendance', { classId: classes[0]._id })}
        >
          <View style={[styles.badge, { backgroundColor: theme.primary }]}>
            <Text style={styles.badgeText}>AGORA</Text>
          </View>
          
          <View style={styles.cardContent}>
            <View>
              <Text style={[styles.classTime, { color: theme.text }]}>{classes[0].time}</Text>
              <Text style={[styles.className, { color: theme.textSecondary }]}>{classes[0].name}</Text>
            </View>
            <View style={styles.stat}>
                <LucideUsers size={20} color={theme.primary} />
                <Text style={[styles.statValue, { color: theme.text }]}>{classes[0].students}</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <Text style={{ color: theme.primary, fontWeight: 'bold' }}>INICIAR CHAMADA</Text>
            <LucideChevronRight size={20} color={theme.primary} />
          </View>
        </TouchableOpacity>
      ) : (
        <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
          <Text style={{ color: theme.textSecondary }}>Nenhuma aula agendada para hoje.</Text>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 30 }]}>Cronograma do Dia</Text>
      
      {classes.map((cls, index) => (
        <View key={index} style={[styles.rowItem, { borderBottomColor: theme.card }]}>
           <Text style={[styles.rowTime, { color: theme.text }]}>{cls.time}</Text>
           <View style={{ flex: 1, marginLeft: 15 }}>
             <Text style={[styles.rowName, { color: theme.text }]}>{cls.name}</Text>
             <Text style={[styles.rowLevel, { color: theme.textSecondary }]}>{cls.level}</Text>
           </View>
        </View>
      ))}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
  },
  greeting: {
    fontSize: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
  },
  highlightCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 12,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  classTime: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  className: {
    fontSize: 16,
  },
  stat: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 10,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 15,
  },
  emptyState: {
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
  },
  rowItem: {
    flexDirection: 'row',
    paddingVertical: 15,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  rowTime: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  rowName: {
    fontWeight: '600',
    fontSize: 16,
  },
  rowLevel: {
    fontSize: 14,
  }
});
