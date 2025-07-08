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

  return (
    <View style={styles.screen}>
      <Animated.View
        style={[
          styles.cardContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Ionicons name="person-circle-outline" size={100} color="#1E3A8A" />

        {user ? (
          <Animatable.View animation="fadeInUp" duration={800} delay={300} style={styles.card}>
            <Text style={styles.nameText}>
              Welcome, {user.first_name} {user.last_name}!
            </Text>
            <Text style={styles.infoText}>
              👤 Username: <Text style={styles.valueText}>{user.username}</Text>
            </Text>
            <Text style={styles.infoText}>
              <Ionicons name="mail-outline" size={17} /> Email:{' '}
              <Text style={styles.valueText}>{user.email}</Text>
            </Text>
          </Animatable.View>
        ) : (
          <Text style={styles.loadingText}>Loading user info...</Text>
        )}

        <TouchableOpacity style={styles.actionButtonBlue} onPress={() => navigation.navigate('DownloadScreen')}>
          <Ionicons name="cloud-download-outline" size={20} color="white" />
          <Text style={styles.buttonText}>Download Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButtonGreen} onPress={() => navigation.navigate('HistoryScreen')}>
          <Ionicons name="time-outline" size={20} color="white" />
          <Text style={styles.buttonText}>View History</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButtonRed} onPress={() => setShowLogoutModal(true)}>
          <Ionicons name="log-out-outline" size={20} color="white" />
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Logout Modal */}
      <Modal transparent visible={showLogoutModal} animationType="fade">
        <View style={styles.modalBackdrop}>
          <Animatable.View animation="zoomIn" duration={400} style={styles.modalCard}>
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
  screen: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    width: width * 0.9,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
  },
  card: {
    width: '100%',
    marginTop: 10,
    marginBottom: 20,
  },
  nameText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 10,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  valueText: {
    fontWeight: '600',
    color: '#111827',
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
    marginVertical: 20,
  },
actionButtonBlue: {
  flexDirection: 'row',
  backgroundColor: '#5457a8', 
  paddingVertical: 12,
  paddingHorizontal: 24,
  borderRadius: 12,
  marginTop: 16,
  alignItems: 'center',
  gap: 8,
  width: '100%',
  justifyContent: 'center',
},
  actionButtonGreen: {
    flexDirection: 'row',
      backgroundColor: '#8c2b81', 
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 12,
    alignItems: 'center',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
  },
  actionButtonRed: {
    flexDirection: 'row',
    backgroundColor: '#7f9dba',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 12,
    alignItems: 'center',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 20,
    width: '80%',
    alignItems: 'center',
    elevation: 10,
  },
  modalText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginVertical: 20,
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
