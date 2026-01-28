import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { ThemeContext } from '../../App';
import api from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
  const { theme, updateBranding, setUser } = useContext(ThemeContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha email e senha');
      return;
    }

    setLoading(true);
    try {
      // 1. Authenticate Teacher
      const res = await api.post('/auth/login-teacher', { email, password });
      
      if (res.data.success) {
        const teacherData = res.data.data;
        const token = res.data.token; // Assuming token response
        
        // 2. Fetch Franchise Branding (if available in response or separate call)
        // For MVP, we assume teacherData includes franchise info or we fetch it
        if (teacherData.franchiseId) {
            // Simulate fetching branding or use what's verified
            // For now, let's just log them in
        }

        setUser(teacherData);
        
        // If the backend sends branding info in login, use it:
        // updateBranding(teacherData.franchise.branding);
      } else {
        Alert.alert('Falha', 'Credenciais inválidas');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível conectar ao servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.primary }]}>ArenaHub</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Portal do Professor</Text>
      </View>

      <View style={[styles.form, { backgroundColor: theme.card }]}>
        <Text style={[styles.label, { color: theme.text }]}>Email</Text>
        <TextInput 
          style={[styles.input, { color: theme.text, borderColor: theme.textSecondary }]}
          placeholder="seu@email.com"
          placeholderTextColor="#64748B"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <Text style={[styles.label, { color: theme.text }]}>Senha</Text>
        <TextInput 
          style={[styles.input, { color: theme.text, borderColor: theme.textSecondary }]}
          placeholder="********"
          placeholderTextColor="#64748B"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity onPress={handleLogin} disabled={loading}>
          <LinearGradient
            colors={[theme.primary, theme.primary + 'DD']}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Acessando...' : 'ENTRAR'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 5,
  },
  form: {
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  }
});
