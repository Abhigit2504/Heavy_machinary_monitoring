// import React from "react";
// import { createNativeStackNavigator } from "@react-navigation/native-stack";
// import TabNavigator from './TabNavigator';
// import MachineDetail from "../screens/MachineDetail";
// import DownloadScreen from "../screens/DownloadScreen"

// const Stack = createNativeStackNavigator();

// const AppNavigator = () => {
//   return (
//     <Stack.Navigator initialRouteName="Tabs">
//       <Stack.Screen
//         name="Tabs"
//         component={TabNavigator}
//         options={{ headerShown: false }}
//       />
//       <Stack.Screen name="MachineDetail" component={MachineDetail} />
//       <Stack.Screen name="DownloadScreen" component={DownloadScreen} />
      

//     </Stack.Navigator>
//   );
// };

// export default AppNavigator;



// AppNavigator.js
import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from '@react-native-async-storage/async-storage';

import TabNavigator from './TabNavigator';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MachineDetail from '../screens/MachineDetail';
import DownloadScreen from '../screens/DownloadScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        setIsLoggedIn(!!token);
      } catch (err) {
        console.error("Token check error:", err);
        setIsLoggedIn(false);
      }
    };

    checkLogin();
  }, []);

  if (isLoggedIn === null) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        <>
          <Stack.Screen name="Tabs">
            {(props) => (
              <TabNavigator
                {...props}
                initialTab={props.route?.params?.screen || 'Dashboard'}
                onLogout={async () => {
                  await AsyncStorage.clear();
                  setIsLoggedIn(false);
                }}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="MachineDetail" component={MachineDetail} options={{ headerShown: true, title: 'Machine Detail' }} />
          <Stack.Screen name="DownloadScreen" component={DownloadScreen} options={{ headerShown: true, title: 'Download Report' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} onLogin={() => setIsLoggedIn(true)} />}
          </Stack.Screen>
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;