import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation, onLogin }) {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const iconAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const iconOpacity = useRef(new Animated.Value(1)).current;
  const iconScale = useRef(new Animated.Value(1)).current;

  const alertOpacity = useRef(new Animated.Value(0)).current;
  const alertScale = useRef(new Animated.Value(0.8)).current;

  const showAlert = (message) => {
    setAlertMessage(message);
    setAlertVisible(true);

    // Animate alert in
    Animated.parallel([
      Animated.timing(alertOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(alertScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideAlert = () => {
    Animated.parallel([
      Animated.timing(alertOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(alertScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setAlertVisible(false);
    });
  };

  const login = async () => {
    if (!emailOrUsername || !password) {
      showAlert('Please enter both email/username and password');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://192.168.1.5:8000/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_or_username: emailOrUsername, password }),
      });

      const rawText = await response.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (err) {
        showAlert('Invalid response from server');
        return;
      }

      if (response.ok && data.user) {
        await AsyncStorage.setItem('accessToken', data.access);
        await AsyncStorage.setItem('refreshToken', data.refresh);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));

        Animated.parallel([
          Animated.timing(iconAnim, {
            toValue: {
              x: width / 2 - 100,
              y: height / 2 - 100,
            },
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(iconOpacity, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(iconScale, {
            toValue: 0.2,
            duration: 700,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onLogin(); // Navigate after animation
        });
      } else {
        showAlert(data.error || 'Invalid credentials');
      }
    } catch (error) {
      showAlert(error.message || 'Something went wrong');
    }

    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.animatedIconWrapper,
          {
            transform: [
              { translateX: iconAnim.x },
              { translateY: iconAnim.y },
              { scale: iconScale },
            ],
            opacity: iconOpacity,
          },
        ]}
      >
        <Ionicons name="person-circle-outline" size={120} color="#5d6da6" />
      </Animated.View>

      <Text style={styles.heading}>Login</Text>

      <TextInput
        placeholder="Email or Username"
        style={styles.input}
        value={emailOrUsername}
        onChangeText={setEmailOrUsername}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.passwordWrapper}>
        <TextInput
          placeholder="Password"
          secureTextEntry={!showPassword}
          style={styles.passwordInput}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeIcon}
        >
          <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#5d6da6" style={{ marginTop: 20 }} />
      ) : (
        <Button title="Login" onPress={login} color="#5d6da6" />
      )}

      <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{ marginTop: 20 }}>
        <Text style={styles.linkText}>Don't have an account? Register here</Text>
      </TouchableOpacity>

      {/* 🔔 Animated Alert Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={alertVisible}
        onRequestClose={hideAlert}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ scale: alertScale }],
                opacity: alertOpacity,
              },
            ]}
          >
            <Text style={styles.modalTitle}>⚠️ Alert</Text>
            <Text style={styles.modalMessage}>{alertMessage}</Text>
            <Pressable style={styles.closeButton} onPress={hideAlert}>
              <Text style={styles.closeButtonText}>OK</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F0F4F8',
  },
  animatedIconWrapper: {
    position: 'absolute',
    top: height / 2 - 220,
    left: width / 2 - 60,
    zIndex: 10,
  },
  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1E3A8A',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 45,
    backgroundColor: '#fff',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    height: 45,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 4,
  },
  linkText: {
    color: '#5d6da6',
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    width: '80%',
    padding: 25,
    borderRadius: 16,
    elevation: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#dc2626',
  },
  modalMessage: {
    fontSize: 16,
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#5d6da6',
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
