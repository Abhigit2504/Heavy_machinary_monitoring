import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity,
  Alert, ScrollView, FlatList
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import * as Animatable from 'react-native-animatable';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

// const BASE_URL = 'http://192.168.1.4:8000';
import { BASE_URL } from '../config';


// File-to-bin delete animation
Animatable.initializeRegistryWithDefinitions({
  binDrop: {
    from: { opacity: 1, translateY: 0, scale: 1, rotate: '0deg' },
    to: { opacity: 0, translateY: 100, scale: 0.5, rotate: '90deg' },
  },
});

const HistoryItem = ({ item, index, onDelete }) => {
  const animRef = useRef(null);

  const animateAndDelete = () => {
    animRef.current?.animate('binDrop', 500).then(() => {
      onDelete(item, index);
    });
  };

  return (
    <Animatable.View
      ref={animRef}
      animation="fadeInUp"
      duration={600}
      delay={index * 100}
      style={styles.itemBox}
    >
      <View style={styles.row}>
        <Ionicons name="document-text-outline" size={20} color="#1E40AF" />
        <Text style={styles.itemTitle}>Download Type: {item.type}</Text>
      </View>
      <View style={styles.row}>
        <Ionicons name="time-outline" size={18} color="#6B7280" />
        <Text style={styles.itemText}><Text style={styles.label}>On:</Text> {dayjs(item.downloadedAt).format('DD MMM YYYY, hh:mm A')}</Text>
      </View>
      <View style={styles.row}>
        <Ionicons name="calendar-outline" size={18} color="#6B7280" />
        <Text style={styles.itemText}><Text style={styles.label}>From:</Text> {dayjs(item.fromDate).format('DD MMM YYYY, hh:mm A')}</Text>
      </View>
      <View style={styles.row}>
        <Ionicons name="calendar-outline" size={18} color="#6B7280" />
        <Text style={styles.itemText}><Text style={styles.label}>To:</Text> {dayjs(item.toDate).format('DD MMM YYYY, hh:mm A')}</Text>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={animateAndDelete}>
        <Ionicons name="trash-outline" size={20} color="white" />
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </Animatable.View>
  );
};

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [undoItem, setUndoItem] = useState(null);
  const [undoTimeout, setUndoTimeout] = useState(null);

  const [showFilters, setShowFilters] = useState(false);
  const [showPicker, setShowPicker] = useState({ from: false, to: false });
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem('user');
      const user = JSON.parse(userData);
      const res = await axios.get(`${BASE_URL}/api/auth/history/list/?user_id=${user.id}`);
      setHistory(res.data);
      setFilteredHistory(res.data);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const deleteWithUndo = async (item, index) => {
    const updated = filteredHistory.filter((_, i) => i !== index);
    setFilteredHistory(updated);
    setUndoItem({ item, index });
    const timeout = setTimeout(async () => {
      try {
        await axios.delete(`${BASE_URL}/api/auth/history/delete/${item.id}/`);
        setUndoItem(null);
      } catch {
        Alert.alert('Error', 'Failed to delete from server');
      }
    }, 7000);
    setUndoTimeout(timeout);
  };

  const handleUndo = () => {
    if (undoTimeout) clearTimeout(undoTimeout);
    if (undoItem) {
      const restored = [...filteredHistory];
      restored.splice(undoItem.index, 0, undoItem.item);
      setFilteredHistory(restored);
      setUndoItem(null);
    }
  };

  const applyFilter = () => {
    if (!fromDate || !toDate) return;
    const filtered = history.filter((item) => {
      const itemDate = dayjs(item.downloadedAt);
      return itemDate.isAfter(fromDate) && itemDate.isBefore(toDate);
    });
    setFilteredHistory(filtered);
  };

  const clearFilter = () => {
    setFromDate(null);
    setToDate(null);
    setFilteredHistory(history);
  };

  return (
    <ScrollView contentContainerStyle={styles.pageContainer}>
      <View style={styles.fullCard}>
        <Text style={styles.header}>Download History</Text>

        <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.toggleFilterBtn}>
          <Ionicons name="options-outline" size={18} color="#1E3A8A" />
          <Text style={styles.toggleFilterText}>{showFilters ? 'Hide Filters' : 'Show Filters'}</Text>
        </TouchableOpacity>

        {showFilters && (
          <View style={styles.filterRow}>
            <TouchableOpacity onPress={() => setShowPicker({ from: true })} style={styles.filterBtn}>
              <Ionicons name="calendar-outline" size={16} color="#1E40AF" />
              <Text style={styles.filterText}>{fromDate ? dayjs(fromDate).format('DD MMM') : 'From'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPicker({ to: true })} style={styles.filterBtn}>
              <Ionicons name="calendar-outline" size={16} color="#1E40AF" />
              <Text style={styles.filterText}>{toDate ? dayjs(toDate).format('DD MMM') : 'To'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={applyFilter} style={styles.filterApplyBtn}>
              <Ionicons name="funnel-outline" size={16} color="white" />
              <Text style={styles.filterApplyText}>Apply</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearFilter} style={styles.filterResetBtn}>
              <Ionicons name="refresh-outline" size={16} color="#1E3A8A" />
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#1E40AF" />
        ) : (
          <FlatList
            data={filteredHistory}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => (
              <HistoryItem item={item} index={index} onDelete={deleteWithUndo} />
            )}
            scrollEnabled={false}
          />
        )}

        {undoItem && (
          <Animatable.View animation="fadeInUp" style={styles.undoBar}>
            <Text style={styles.undoText}>Item deleted</Text>
            <TouchableOpacity onPress={handleUndo}>
              <Text style={styles.undoBtn}>Undo</Text>
            </TouchableOpacity>
          </Animatable.View>
        )}

        <DateTimePickerModal
          isVisible={showPicker.from}
          mode="date"
          onConfirm={(date) => {
            setFromDate(date);
            setShowPicker({ from: false });
          }}
          onCancel={() => setShowPicker({ from: false })}
        />
        <DateTimePickerModal
          isVisible={showPicker.to}
          mode="date"
          minimumDate={fromDate || undefined}
          onConfirm={(date) => {
            setToDate(date);
            setShowPicker({ to: false });
          }}
          onCancel={() => setShowPicker({ to: false })}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#F1F5F9',
    marginTop: 40,
  },
  fullCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    elevation: 8,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 20,
    textAlign: 'center',
  },
  toggleFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: 10,
    backgroundColor: '#E0E7FF',
    padding: 8,
    borderRadius: 10,
  },
  toggleFilterText: {
    marginLeft: 6,
    color: '#1E3A8A',
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E7FF',
    padding: 10,
    borderRadius: 10,
    flex: 1,
  },
  filterText: {
    color: '#1E3A8A',
    marginLeft: 6,
    fontWeight: '500',
  },
  filterApplyBtn: {
    backgroundColor: '#1E3A8A',
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterApplyText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 4,
  },
  filterResetBtn: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  itemBox: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  itemText: {
    color: '#374151',
    marginLeft: 8,
    fontSize: 14,
    marginBottom: 4,
  },
  label: {
    fontWeight: '600',
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  deleteBtn: {
    marginTop: 12,
    backgroundColor: '#483b87',
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    elevation: 2,
  },
  deleteText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  undoBar: {
    marginTop: 16,
    backgroundColor: '#E0F2FE',
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  undoText: {
    color: '#0369A1',
    fontSize: 15,
    fontWeight: '500',
  },
  undoBtn: {
    color: '#1E40AF',
    fontWeight: '700',
    fontSize: 16,
  },
});
