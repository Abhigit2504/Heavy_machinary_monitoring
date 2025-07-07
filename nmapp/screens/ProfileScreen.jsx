import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ onLogout }) {
  const [user, setUser] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
        animateWelcome();
      }
    };
    fetchUser();
  }, []);

  const animateWelcome = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const logout = async () => {
    await AsyncStorage.clear();
    setShowLogoutModal(false);
    onLogout();
  };

  const handleDownloadPress = () => {
    navigation.navigate('DownloadScreen');
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          alignItems: 'center',
          width: '100%',
        }}
      >
        <Ionicons name="person-circle-outline" size={100} color="#1E3A8A" />

        {user ? (
          <Animatable.View
            animation="fadeInUp"
            duration={800}
            delay={300}
            style={styles.card}
          >
            <Text style={styles.cardTitle}>
              Welcome, {user.first_name} {user.last_name}!
            </Text>
            <Text style={styles.cardInfo}>
              👤 Username: <Text style={styles.cardValue}>{user.username}</Text>
            </Text>
            <Text style={styles.cardInfo}>
              <Ionicons name="mail-outline" size={19} /> Email:{' '}
              <Text style={styles.cardValue}>{user.email}</Text>
            </Text>
          </Animatable.View>
        ) : (
          <Text style={styles.title}>Loading user info...</Text>
        )}

        <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadPress}>
          <Ionicons name="cloud-download-outline" size={20} color="white" />
          <Text style={styles.downloadText}>Download Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={() => setShowLogoutModal(true)}>
          <Ionicons name="log-out-outline" size={20} color="white" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* 🔒 Logout Confirmation Modal */}
      <Modal transparent visible={showLogoutModal} animationType="fade">
        <View style={styles.modalBackdrop}>
          <Animatable.View
            animation="bounceIn"
            duration={600}
            style={styles.modalCard}
          >
            <Ionicons name="alert-circle-outline" size={40} color="#dc2626" />
            <Text style={styles.modalText}>Are you sure you want to logout?</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#6B7280' }]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#DC2626' }]}
                onPress={logout}
              >
                <Text style={styles.modalButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 16,
  },
  cardInfo: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  cardValue: {
    fontWeight: '600',
    color: '#111827',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E3A8A',
    marginTop: 10,
    marginBottom: 14,
    textAlign: 'center',
  },
  downloadButton: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 24,
    alignItems: 'center',
    gap: 8,
    elevation: 3,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  downloadText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
    gap: 8,
    elevation: 3,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    padding: 25,
    width: '80%',
    borderRadius: 16,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  modalText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
