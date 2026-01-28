import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ThemeContext } from '../../App';
import api from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
  const { theme, updateBranding, setUser } = useContext(ThemeContext);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email) {
        Alert.alert('Erro', 'Por favor, digite seu email');
        return;
    }

    setLoading(true);

    try {
      // 1. Check if email exists and which franchise it belongs to
      // POST /auth/check-student-email (This endpoint needs existence)
      // For now, we simulate or use existing flow
      const res = await api.post('/auth/student-login-check', { email });
      
      if (res.data.success) {
          // If valid, we might ask for password if implemented, or perform magic link
          // For this MVP, let's assume direct login if using "email only" flow from legacy
          // or simulate data return
          const studentData = res.data.student;
          
          if(!studentData) throw new Error("Dados não encontrados");

          // Update Global State
          setUser(studentData);
          
          // Apply Branding from Franchise
          if (studentData.franchiseId && studentData.franchiseId.branding) {
             updateBranding(studentData.franchiseId.branding);
          }
      } else {
         Alert.alert('Acesso Negado', 'Email não encontrado.');
      }

    } catch (e) {
      console.error(e);
      // Fallback for demo
      // setUser({ name: 'Alexandre', email: email, belt: 'Azul', degree: '2º Grau' });
      Alert.alert('Erro', 'Falha na conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.primary }]}>ArenaHub</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Portal do Aluno</Text>
      </View>

      <View style={[styles.form, { backgroundColor: theme.card }]}>
        <Text style={[styles.label, { color: theme.text }]}>Email Cadastrado</Text>
        <TextInput 
          style={[styles.input, { color: theme.text, borderColor: theme.textSecondary }]}
          placeholder="seu@email.com"
          placeholderTextColor="#64748B"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TouchableOpacity onPress={handleLogin} disabled={loading}>
          <LinearGradient
            colors={[theme.primary, theme.primary + 'DD']}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Verificando...' : 'ACESSAR'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 42, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1 },
  subtitle: { fontSize: 16, marginTop: 5 },
  form: { padding: 24, borderRadius: 16, elevation: 8 },
  label: { marginBottom: 8, fontWeight: '600' },
  input: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.05)' },
  button: { height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 }
});
