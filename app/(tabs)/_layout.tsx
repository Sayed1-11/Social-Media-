import { useThemeStyles } from "@/hooks/useThemeStyles";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { Tabs, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function TabLayout() {
  const { colors } = useThemeStyles();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;

    Animated.spring(animation, {
      toValue,
      friction: 5,
      useNativeDriver: true,
    }).start();

    setIsOpen(!isOpen);
  };

  const handleOpenCamera = async () => {
    try {
      // First, check if we're on web
      if (Platform.OS === 'web') {
        Alert.alert(
          'Camera Not Available', 
          'Camera access is limited on web. Please use the mobile app for full camera functionality.'
        );
        return;
      }

      // For mobile: Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required', 
          'Sorry, we need camera permissions to take photos.'
        );
        return;
      }

      // Launch camera directly - use launchCameraAsync for mobile
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        cameraType: ImagePicker.CameraType.back, // Use back camera
      });

      console.log('Camera result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log('Photo taken:', result.assets[0].uri);
        // Navigate to create-post with the captured image
        router.push({
          pathname: "/create-post",
          params: { imageUri: result.assets[0].uri }
        });
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  // Alternative: Open image picker (gallery) instead of camera
  const handleOpenImagePicker = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need gallery access to select photos.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log('Image selected:', result.assets[0].uri);
        router.push({
          pathname: "/create-post",
          params: { imageUri: result.assets[0].uri }
        });
      }
    } catch (error) {
      console.error('Error opening image picker:', error);
      Alert.alert('Error', 'Failed to open gallery.');
    }
  };

  // Updated handleAction to handle both camera and gallery
  const handleAction = (action: string) => {
    toggleMenu();
    
    switch (action) {
      case "post":
        router.push("/create-post");
        break;
      case "photo":
        // On web, use image picker. On mobile, use camera.
        if (Platform.OS === 'web') {
          handleOpenImagePicker();
        } else {
          handleOpenCamera();
        }
        break;
      case "location":
        handleOpenLocation();
        break;
    }
  };

  const handleOpenLocation = async () => {
    if (!navigator.geolocation) {
      Alert.alert('Error', 'Geolocation is not supported by your browser');
      return;
    }

    Alert.alert('Getting Location', 'Please allow location access...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        router.push({
          pathname: "/map",
          params: { 
            latitude: latitude.toString(),
            longitude: longitude.toString()
          }
        });
      },
      (error) => {
        let errorMessage = 'Unable to get your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access was denied. Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        Alert.alert('Location Error', errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000
      }
    );
  };

  // Your existing animation styles...
  const postStyle = {
    transform: [
      { scale: animation },
      {
        translateX: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -90],
        }),
      },
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0],
        }),
      },
    ],
  };

  const photoStyle = {
    transform: [
      { scale: animation },
      {
        translateX: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0],
        }),
      },
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -90],
        }),
      },
    ],
  };

  const locationStyle = {
    transform: [
      { scale: animation },
      {
        translateX: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 90],
        }),
      },
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0],
        }),
      },
    ],
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textSecondary,
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            height: 60,
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            zIndex: 10,
            elevation: 10,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <View style={focused ? styles.activeIcon : styles.icon}>
                <Ionicons
                  name={focused ? "home" : "home-outline"}
                  color={color}
                  size={24}
                />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="friends"
          options={{
            title: "Friends",
            tabBarIcon: ({ color, focused }) => (
              <View style={focused ? styles.activeIcon : styles.icon}>
                <Ionicons
                  name={focused ? "people" : "people-outline"}
                  color={color}
                  size={24}
                />
              </View>
            ),
          }}
        />

        {/* Empty slot for the center FAB position */}
        <Tabs.Screen
          name="create-post"
          options={{
            title: "Create",
            tabBarButton: () => null,
          }}
        />
        
        {/* Add map screen route */}
        <Tabs.Screen
          name="map"
          options={{
            title: "Map",
            tabBarButton: () => null,
          }}
        />
        
        <Tabs.Screen
          name="notifications"
          options={{
            title: "Notifications",
            tabBarIcon: ({ color, focused }) => (
              <View style={focused ? styles.activeIcon : styles.icon}>
                <Ionicons
                  name={focused ? "notifications" : "notifications-outline"}
                  color={color}
                  size={24}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="menu"
          options={{
            title: "Menu",
            tabBarIcon: ({ color, focused }) => (
              <View style={focused ? styles.activeIcon : styles.icon}>
                <Ionicons
                  name={focused ? "menu" : "menu-outline"}
                  color={color}
                  size={24}
                />
              </View>
            ),
          }}
        />
      </Tabs>

 <View style={styles.fabContainer} pointerEvents="box-none">
        {/* Left - Post */}
        <Animated.View 
          style={[styles.fabOption, postStyle]} 
          pointerEvents={isOpen ? 'auto' : 'none'}
        >
          <TouchableOpacity
            style={styles.fabOptionButton}
            onPress={() => handleAction("post")}
          >
            <Text style={styles.fabOptionText}>📝</Text>
            <Text style={styles.fabOptionLabel}>Post</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Up - Photo */}
        <Animated.View 
          style={[styles.fabOption, photoStyle]} 
          pointerEvents={isOpen ? 'auto' : 'none'}
        >
          <TouchableOpacity
            style={styles.fabOptionButton}
            onPress={() => handleAction("photo")}
          >
            <Text style={styles.fabOptionText}>
              {Platform.OS === 'web' ? '🖼️' : '📷'}
            </Text>
            <Text style={styles.fabOptionLabel}>
              {Platform.OS === 'web' ? 'Gallery' : 'Camera'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Right - Location */}
        <Animated.View 
          style={[styles.fabOption, locationStyle]} 
          pointerEvents={isOpen ? 'auto' : 'none'}
        >
          <TouchableOpacity
            style={styles.fabOptionButton}
            onPress={() => handleAction("location")}
          >
            <Text style={styles.fabOptionText}>🚏</Text>
            <Text style={styles.fabOptionLabel}>Location</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Center FAB */}
        <TouchableOpacity
          style={[styles.fab, isOpen && styles.fabOpen]}
          onPress={toggleMenu}
        >
          <Text style={styles.fabText}>{isOpen ? "×" : "+"}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  icon: {
    padding: 8,
  },
  activeIcon: {
    padding: 8,
    backgroundColor: "rgba(255, 55, 95, 0.1)",
    borderRadius: 20,
  },
  fabContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ff375f",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#ff375f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabOpen: {
    backgroundColor: "#ff375f",
    transform: [{ rotate: "45deg" }],
  },
  fabText: {
    color: "white",
    fontSize: 28,
    fontWeight: "300",
  },
  fabOption: {
    position: "absolute",
    backgroundColor: "#111111",
    borderRadius: 30,
    width: 70,
    height: 70,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  fabOptionButton: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  fabOptionText: {
    fontSize: 20,
    marginBottom: 4,
  },
  fabOptionLabel: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "500",
  },
});