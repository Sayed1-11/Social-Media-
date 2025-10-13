import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

export default function MapScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  const latitude = parseFloat(params.latitude as string) || 37.78825;
  const longitude = parseFloat(params.longitude as string) || -122.4324;

  const handleOpenGoogleMaps = () => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const handleShareLocation = () => {
    Alert.alert('Location Shared', 'Your location has been shared with friends!');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Location</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.locationCard}>
          <Ionicons name="location" size={48} color="#ff375f" />
          <Text style={styles.locationTitle}>Current Location</Text>
          
          <View style={styles.coordinates}>
            <Text style={styles.coordinateLabel}>Latitude</Text>
            <Text style={styles.coordinateValue}>{latitude.toFixed(6)}</Text>
            
            <Text style={styles.coordinateLabel}>Longitude</Text>
            <Text style={styles.coordinateValue}>{longitude.toFixed(6)}</Text>
          </View>

          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleOpenGoogleMaps}
          >
            <Ionicons name="map" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Open in Google Maps</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleShareLocation}
          >
            <Ionicons name="share-social" size={20} color="#ff375f" />
            <Text style={styles.secondaryButtonText}>Share Location</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Ionicons name="information-circle" size={24} color="#666" />
          <Text style={styles.infoText}>
            For interactive maps with real-time location sharing, download our mobile app!
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#0a0a0a',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  locationCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  locationTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 24,
  },
  coordinates: {
    width: '100%',
    marginBottom: 24,
  },
  coordinateLabel: {
    color: '#666',
    fontSize: 14,
    marginBottom: 4,
  },
  coordinateValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#ff375f',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ff375f',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  secondaryButtonText: {
    color: '#ff375f',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff375f',
  },
  infoText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});