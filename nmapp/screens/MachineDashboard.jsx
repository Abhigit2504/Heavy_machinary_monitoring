import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const BASE_URL = 'http://192.168.1.5:8000';
const screenWidth = Dimensions.get('window').width;

const MachineDashboard = ({ navigation }) => {
  const [machines, setMachines] = useState([]);
  const [priorityUsage, setPriorityUsage] = useState([]);
  const [searchGfrid, setSearchGfrid] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [typedText, setTypedText] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-30)).current;

  const fullTextRef = useRef('');

  const chartAnim = useRef(new Animated.Value(1)).current;
  const cardAnimations = useRef([]).current;

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        fullTextRef.current = `Welcome, ${parsed.first_name} ${parsed.last_name}!`;
        typeText(); // start typing
        animateWelcome(); // animate
      }
    };
    fetchUser();
  }, []);

  const typeText = () => {
    let i = 0;
    const fullText = fullTextRef.current;
    const interval = setInterval(() => {
      if (i <= fullText.length) {
        setTypedText(fullText.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 60);
  };

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

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const [machineRes, priorityRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/machines/`),
        axios.get(`${BASE_URL}/api/priority-usage/`)
      ]);
      setMachines(machineRes.data);
      setPriorityUsage(priorityRes.data);
      chartAnim.setValue(0);
      Animated.timing(chartAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp)
      }).start();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  const hidePieChart = () => {
    Animated.timing(chartAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleChartPress = () => {
    Animated.sequence([
      Animated.timing(chartAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(chartAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start(() => navigation.navigate('Info'));
  };

  const getPieChartData = () => {
    const total = priorityUsage.length || 1;
    return priorityUsage.map((item, index) => {
      const hue = (index * 360) / total;
      return {
        name: `GFRID${item.gfrid}:${item.on_percent.toFixed(1)}%`,
        population: item.on_percent === 0 ? 0.01 : parseFloat(item.on_percent.toFixed(2)),
        color: `hsl(${hue}, 65%, 55%)`,
        legendFontColor: '#1F2937',
        legendFontSize: 14,
      };
    });
  };

  const formatTimestamp = (ts) => {
    if (!ts) return 'N/A';
    const parsed = dayjs(ts, 'YYYY-MM-DD HH:mm:ss');
    return parsed.isValid()
      ? parsed.format('DD-MMM-YYYY, hh:mm A')
      : 'Invalid';
  };

  const filteredMachines = machines.filter(machine =>
    machine.gfrid.toString().includes(searchGfrid)
  );

  const renderItem = ({ item, index }) => {
    if (!cardAnimations[index]) {
      cardAnimations[index] = new Animated.Value(0);
      Animated.timing(cardAnimations[index], {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }).start();
    }

    return (
      <Animated.View
        style={{
          opacity: cardAnimations[index],
          transform: [{
            translateY: cardAnimations[index].interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            })
          }]
        }}
      >
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('MachineDetail', { gfrid: item.gfrid })}
          activeOpacity={0.9}
        >
          <Text style={styles.cardText}>GFRID: {item.gfrid}</Text>
          <Text style={styles.cardSub}>Status: {item.status || 'N/A'}</Text>
          <Text style={styles.cardSub}>Last Seen: {formatTimestamp(item.last_seen)}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {typedText !== '' && (
        <Animated.Text
          style={[
            styles.welcomeText,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {typedText}
        </Animated.Text>
      )}

      <FlatList
        refreshing={loading}
        onRefresh={fetchMachines}
        ListHeaderComponent={
          <>
            {priorityUsage.length > 0 && (
              <Animated.View
                style={[styles.chartCard, {
                  transform: [{ scale: chartAnim }],
                  opacity: chartAnim,
                }]}
              >
                <TouchableOpacity style={styles.closeIcon} onPress={hidePieChart}>
                  <Ionicons name="close" size={20} color="#4B5563" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleChartPress} activeOpacity={0.9}>
                  <Text style={styles.chartTitle}>Past 1 Week ON % per GFRID</Text>
                  <View style={styles.chartWrapper}>
                    <PieChart
                      data={getPieChartData()}
                      width={screenWidth / 2}
                      height={220}
                      chartConfig={{
                        color: () => `#000`,
                        labelColor: () => '#1F2937',
                      }}
                      accessor="population"
                      backgroundColor="transparent"
                      paddingLeft="40"
                      hasLegend={false}
                      absolute
                    />
                    <View style={styles.legendWrapper}>
                      {getPieChartData().map((item, index) => (
                        <View key={index} style={styles.legendItem}>
                          <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                          <Text style={styles.legendText}>{item.name}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            )}

            <TextInput
              style={styles.input}
              placeholder="Search by GFRID"
              value={searchGfrid}
              onChangeText={setSearchGfrid}
              placeholderTextColor="#9CA3AF"
            />
          </>
        }
        data={filteredMachines}
        keyExtractor={(item) => item.gfrid.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F0F4F8',
    marginBottom: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1E40AF',
    textAlign: 'center',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    marginBottom: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderBottomWidth: 6,
    borderBottomColor: '#9f5ead',
  },
  cardText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  cardSub: {
    fontSize: 15,
    color: '#475569',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 28,
    borderRadius: 20,
    marginBottom: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    position: 'relative',
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 14,
    color: '#1E3A8A',
    textAlign: 'center',
  },
  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    padding: 6,
  },
  chartWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  legendWrapper: {
    flex: 1,
    flexWrap: 'wrap',
    paddingLeft: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 3,
  },
 legendText: {
  fontSize: 13,
  color: '#1F2937',
  flexShrink: 1,
  flexWrap: 'wrap',       // ✅ Allow wrapping
  maxWidth: screenWidth / 2.5, // ✅ Adjust based on your layout
},

});

export default MachineDashboard;








// import React, { useEffect, useState } from 'react';
// import { 
//   View, 
//   Text, 
//   FlatList, 
//   TextInput, 
//   StyleSheet, 
//   TouchableOpacity,
//   ActivityIndicator,
//   Button 
// } from 'react-native';
// import axios from 'axios';

// const BASE_URL = 'http://192.168.1.4:8000'; // Update with your actual server IP

// const MachineDashboard = ({ navigation }) => {
//   const [machines, setMachines] = useState([]);
//   const [searchGfrid, setSearchGfrid] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchMachines = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const res = await axios.get(`${BASE_URL}/api/machines/`);
//       setMachines(res.data);
//     } catch (error) {
//       console.error('Error fetching machines:', error);
//       setError('Failed to load machines. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchMachines();
//   }, []);

//   const filteredMachines = machines.filter(machine =>
//     machine.gfrid.toString().includes(searchGfrid)
//   );

//   const renderItem = ({ item }) => (
//     <TouchableOpacity
//       style={styles.card}
//       onPress={() => navigation.navigate('MachineDetail', { gfrid: item.gfrid })}
//     >
//       <Text style={styles.cardText}>Machine GFRID: {item.gfrid}</Text>
//       <Text style={styles.cardSub}>Last Alert: {item.last_alert || 'N/A'}</Text>
//       <Text style={styles.cardSub}>Last Seen: {item.last_seen || 'N/A'}</Text>
//     </TouchableOpacity>
//   );

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#0000ff" />
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.errorContainer}>
//         <Text style={styles.errorText}>{error}</Text>
//         <Button title="Retry" onPress={fetchMachines} />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>All Machines</Text>
//       <TextInput
//         style={styles.input}
//         placeholder="Search by GFRID"
//         value={searchGfrid}
//         onChangeText={setSearchGfrid}
//       />
//       <FlatList
//         data={filteredMachines}
//         keyExtractor={(item) => item.gfrid.toString()}
//         renderItem={renderItem}
//         contentContainerStyle={{ paddingBottom: 24 }}
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//     backgroundColor: '#fff',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   errorText: {
//     color: 'red',
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 16,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#ccc',
//     borderRadius: 8,
//     padding: 8,
//     marginBottom: 16,
//   },
//   card: {
//     backgroundColor: '#f1f1f1',
//     padding: 16,
//     marginBottom: 12,
//     borderRadius: 8,
//   },
//   cardText: {
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   cardSub: {
//     fontSize: 14,
//     color: '#666',
//     marginTop: 4,
//   },
// });

// export default MachineDashboard;