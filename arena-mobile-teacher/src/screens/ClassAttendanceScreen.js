import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { ThemeContext } from '../../App';
import { LucideCheckCircle, LucideXCircle, LucideSearch } from 'lucide-react-native';

export default function ClassAttendanceScreen({ route }) {
  const { theme } = useContext(ThemeContext);
  const [students, setStudents] = useState([]);
  
  // Mock Data Loading
  useEffect(() => {
    // In real app, fetch students for route.params.classId
    setStudents([
      { id: '1', name: 'Carlos Silva', belt: 'Azul', degree: '2º Grau', status: 'pending', avatar: 'https://i.pravatar.cc/150?u=1' },
      { id: '2', name: 'Ana Souza', belt: 'Branca', degree: '4º Grau', status: 'pending', avatar: 'https://i.pravatar.cc/150?u=2' },
      { id: '3', name: 'Roberto Firmino', belt: 'Roxa', degree: 'Nenhum', status: 'present', avatar: 'https://i.pravatar.cc/150?u=3' }, // Already here
    ]);
  }, []);

  const togglePresence = (id) => {
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, status: s.status === 'present' ? 'pending' : 'present' };
      }
      return s;
    }));
  };

  const getBeltColor = (belt) => {
    const map = {
      'Branca': '#F8FAFC',
      'Azul': '#3B82F6',
      'Roxa': '#A855F7',
      'Marrom': '#92400E',
      'Preta': '#0F172A'
    };
    return map[belt] || '#FFF';
  };

  const renderItem = ({ item }) => {
    const isPresent = item.status === 'present';
    const beltColor = getBeltColor(item.belt);

    return (
      <TouchableOpacity 
        style={[styles.studentCard, { backgroundColor: theme.card, borderColor: isPresent ? theme.success : 'transparent', borderWidth: 1 }]}
        onPress={() => togglePresence(item.id)}
        activeOpacity={0.7}
      >
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
             <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: beltColor, marginRight: 6, borderWidth: 1, borderColor: '#333' }} />
             <Text style={[styles.belt, { color: theme.textSecondary }]}>{item.belt} • {item.degree}</Text>
          </View>
        </View>

        <View style={[styles.statusIcon, { opacity: isPresent ? 1 : 0.2 }]}>
          <LucideCheckCircle size={32} color={theme.success} fill={isPresent ? theme.success + '20' : 'transparent'} />
        </View>
      </TouchableOpacity>
    );
  };

  const handleConfirmAll = () => {
    Alert.alert('Sucesso', 'Chamada realizada com sucesso!');
    // API Call here
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Chamada</Text>
        <Text style={{ color: theme.primary }}>{students.filter(s => s.status === 'present').length}/{students.length}</Text>
      </View>

      <FlatList
        data={students}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.card }]}>
        <TouchableOpacity 
            style={[styles.confirmBtn, { backgroundColor: theme.primary }]}
            onPress={handleConfirmAll}
        >
            <Text style={styles.confirmText}>CONFIRMAR CHAMADA</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
  },
  info: {
    flex: 1,
    marginLeft: 15,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  belt: {
    fontSize: 12,
  },
  statusIcon: {
    marginLeft: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
  },
  confirmBtn: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  confirmText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
