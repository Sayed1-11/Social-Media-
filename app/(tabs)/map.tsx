import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

interface Location {
  latitude: number;
  longitude: number;
}

export default function MapScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  const [currentLocation, setCurrentLocation] = useState<Location>({
    latitude: parseFloat(params.latitude as string) || 37.7749,
    longitude: parseFloat(params.longitude as string) || -122.4194,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Get user's actual location
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (Platform.OS === 'web') {
      setIsLoading(true);
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setCurrentLocation({
              latitude,
              longitude,
            });
            setIsLoading(false);
          },
          (error) => {
            console.log('Error getting location:', error);
            setIsLoading(false);
            // Keep the default location if geolocation fails
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          }
        );
      } else {
        setIsLoading(false);
        Alert.alert('Error', 'Geolocation is not supported by your browser');
      }
    } else {
      // For mobile, use the passed location or get from device
      if (params.latitude && params.longitude) {
        setCurrentLocation({
          latitude: parseFloat(params.latitude as string),
          longitude: parseFloat(params.longitude as string),
        });
      }
    }
  };

  const handleOpenGoogleMaps = () => {
    const url = `https://www.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}&z=15`;
    Linking.openURL(url).catch(err => 
      Alert.alert('Error', 'Could not open Google Maps')
    );
  };

  const handleOpenAppleMaps = () => {
    const url = `https://maps.apple.com/?q=${currentLocation.latitude},${currentLocation.longitude}&z=15`;
    Linking.openURL(url).catch(err => 
      Alert.alert('Error', 'Could not open Apple Maps')
    );
  };

  const handleShareLocation = () => {
    const locationUrl = `https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`;
    const locationText = `My current location: ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`;
    
    if (Platform.OS === 'web') {
      // Try Web Share API first
      if (navigator.share) {
        navigator.share({
          title: 'My Current Location',
          text: locationText,
          url: locationUrl,
        })
        .then(() => console.log('Location shared successfully'))
        .catch((error) => {
          // If Web Share fails, fallback to clipboard
          copyToClipboard(locationUrl);
        });
      } else {
        // Fallback to clipboard
        copyToClipboard(locationUrl);
      }
    } else {
      // For mobile, show alert with location info
      Alert.alert(
        'Location Shared', 
        `Location shared: ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`
      );
    }
  };

  const copyToClipboard = (text: string) => {
    if (Platform.OS === 'web') {
      navigator.clipboard.writeText(text)
        .then(() => Alert.alert('Copied!', 'Location link copied to clipboard'))
        .catch(() => Alert.alert('Location', `Share this link: ${text}`));
    }
  };

  const handleUpdateLocation = () => {
    getCurrentLocation();
  };

  // Google Maps embed URL (no API key required for basic embed)
  const getMapEmbedUrl = () => {
    return `https://maps.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}&z=15&output=embed`;
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
        {/* Map Display */}
        <View style={styles.mapContainer}>
          {/* <View style={styles.mapHeader}>
            <Ionicons name="map" size={20} color="#fff" />
            <Text style={styles.mapTitle}>Live Location Map</Text>
            {isLoading && (
              <Text style={styles.loadingText}>Getting your location...</Text>
            )}
          </View> */}
          
          {/* Google Maps Embed */}
          <View style={styles.mapEmbedContainer}>
            <iframe
              src={getMapEmbedUrl()}
              style={styles.mapIframe}
              frameBorder="0"
              scrolling="no"
              marginHeight={0}
              marginWidth={0}
              title="Current Location Map"
            />
          </View>
          
     
        </View>

        {/* Location Controls */}
        <View style={styles.controlsCard}>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]}
              onPress={handleUpdateLocation}
              disabled={isLoading}
            >
              <Ionicons 
                name={isLoading ? "refresh-circle" : "refresh"} 
                size={20} 
                color="#fff" 
              />
              <Text style={styles.buttonText}>
                {isLoading ? 'Updating...' : 'Update Location'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]}
              onPress={handleOpenGoogleMaps}
            >
              <Ionicons name="map" size={20} color="#ff375f" />
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Open in Maps
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.tertiaryButton]}
              onPress={handleShareLocation}
            >
              <Ionicons name="share-social" size={20} color="#fff" />
              <Text style={styles.buttonText}>Share Location</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Platform Info */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              {Platform.OS === 'web' ? 'Web Location Services' : 'Mobile Location'}
            </Text>
            <Text style={styles.infoText}>
              {Platform.OS === 'web' 
                ? "Using your browser's location services. For best accuracy, allow location access and use a mobile device."
                : "Using your device's GPS for precise location tracking."}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
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
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    marginHorizontal: 0,
    marginVertical:12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  mapTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingText: {
    color: '#ff375f',
    fontSize: 12,
    marginLeft: 'auto',
    fontStyle: 'italic',
  },
  mapEmbedContainer: {
    flex: 1,
    minHeight: 300,
  },
  mapIframe: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  mapOverlayText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  mapCoordinates: {
    color: '#ff375f',
    fontSize: 12,
    fontWeight: '500',
  },
  controlsCard: {
    backgroundColor: '#1a1a1a',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationDetails: {
    marginLeft: 12,
    flex: 1,
  },
  locationLabel: {
    color: '#666',
    fontSize: 14,
    marginBottom: 4,
  },
  locationCoordinates: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonsContainer: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#ff375f',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ff375f',
  },
  tertiaryButton: {
    backgroundColor: '#2a2a2a',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#ff375f',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1a1a1a',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    color: '#666',
    fontSize: 12,
    lineHeight: 16,
  },
});