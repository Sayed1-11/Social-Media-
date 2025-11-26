// app/(tabs)/create-story.tsx
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, FlashMode, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const API_BASE_URL = "https://serverside-app.onrender.com";

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    content: {
      flex: 1,
    },
    // Camera Styles
    cameraContainer: {
      flex: 1,
      backgroundColor: '#000',
    },
    camera: {
      flex: 1,
    },
    cameraControls: {
      position: 'absolute',
      bottom: 40,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    captureButton: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: 'white',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 4,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    captureButtonInner: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: 'white',
    },
    cameraActions: {
      position: 'absolute',
      top: 60,
      right: 20,
      alignItems: 'center',
      gap: 20,
    },
    cameraAction: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Gallery Styles
    galleryContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    galleryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    galleryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    galleryGrid: {
      padding: 4,
    },
    imageItem: {
      width: (screenWidth - 16) / 3,
      height: (screenWidth - 16) / 3,
      margin: 2,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    selectedOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Preview Styles
    previewContainer: {
      flex: 1,
      backgroundColor: '#000',
    },
    previewImage: {
      width: '100%',
      height: '100%',
    },
    previewControls: {
      position: 'absolute',
      bottom: 40,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    previewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 25,
      gap: 8,
    },
    previewButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    captionContainer: {
      position: 'absolute',
      top: 60,
      left: 0,
      right: 0,
      paddingHorizontal: 20,
    },
    captionInput: {
      backgroundColor: 'rgba(0,0,0,0.7)',
      color: 'white',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 20,
      fontSize: 16,
      textAlign: 'center',
    },
    // Tab Styles
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    activeTabText: {
      color: colors.primary,
    },
    // Loading
    loadingContainer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    permissionContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.background,
    },
    permissionText: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 20,
    },
    permissionButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
    },
    permissionButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    emptyGallery: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emptyGalleryText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 10,
    },
  });

type CreateStoryTab = 'camera' | 'gallery';

export default function CreateStoryScreen() {
  const [activeTab, setActiveTab] = useState<CreateStoryTab>('camera');
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showCaption, setShowCaption] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const { colors } = useThemeStyles();
  const styles = createStyles(colors);
  const { getAuthHeaders, user } = useAuth();

  // Request gallery permissions and load images
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera roll permissions to select images!');
      }
    })();
  }, []);

  const loadGalleryImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const imageUris = result.assets.map(asset => asset.uri);
        setGalleryImages(imageUris);
      }
    } catch (error) {
      console.error('Error loading gallery images:', error);
      Alert.alert('Error', 'Failed to load images from gallery');
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: true,
          skipProcessing: true,
        });
        if (photo.uri) {
          setCapturedImage(photo.uri);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      }
    }
  };

  const toggleCameraType = () => {
    setCameraType((current: CameraType) => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlashMode((current: FlashMode) => (current === 'off' ? 'on' : 'off'));
  };

  const handleImageSelect = (imageUri: string) => {
    setSelectedImage(imageUri);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setSelectedImage(null);
    setCaption('');
    setShowCaption(false);
  };

  // Convert image URI to base64
  const convertImageToBase64 = async (imageUri: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function() {
        const reader = new FileReader();
        reader.onloadend = function() {
          // Remove the data:image/jpeg;base64, prefix
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(xhr.response);
      };
      xhr.onerror = reject;
      xhr.responseType = 'blob';
      xhr.open('GET', imageUri, true);
      xhr.send(null);
    });
  };

  // Upload story with base64 image
  const uploadStory = async () => {
    const imageUri = capturedImage || selectedImage;
    if (!imageUri) {
      Alert.alert('Error', 'No image selected');
      return;
    }

    try {
      setIsUploading(true);
      
      let base64Image: string;

      if (capturedImage) {
        // For camera images, we need to capture again with base64
        const photo = await cameraRef.current?.takePictureAsync({
          quality: 0.7,
          base64: true,
          skipProcessing: true,
        });
        
        if (!photo?.base64) {
          throw new Error('Failed to get base64 data from camera');
        }
        base64Image = photo.base64;
      } else {
        // For gallery images, convert URI to base64
        base64Image = await convertImageToBase64(imageUri);
      }

      if (!base64Image) {
        throw new Error('Failed to convert image to base64');
      }

      console.log('📸 Base64 image length:', base64Image.length);

      // Get auth headers
      const authHeaders = await getAuthHeaders();
      const authToken = authHeaders.Authorization || authHeaders.authorization;
      
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      // Prepare the payload exactly as the server expects
      const payload = {
        image: base64Image,
        content: caption.trim() || "",
      };


      const response = await fetch(`${API_BASE_URL}/stories`, {
        method: 'POST',
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📡 Response status:', response.status);

      const responseText = await response.text();
      console.log('📨 Response:', responseText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { message: `Server error: ${response.status}` };
        }
        throw new Error(errorData.message || `Upload failed with status: ${response.status}`);
      }

      const result = JSON.parse(responseText);
      console.log('✅ Story upload successful:', result);

      if (result.success) {
        // SUCCESS: Show alert and then redirect to home page
router.replace('/');
      } else {
        throw new Error(result.message || 'Upload failed');
      }

    } catch (error) {
      console.error('💥 Error uploading story:', error);
      
      let userMessage = 'Failed to upload story. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Network request failed')) {
          userMessage = 'Network error. Please check your internet connection.';
        } else if (error.message.includes('Failed to fetch')) {
          userMessage = 'Cannot connect to server. Please try again later.';
        } else if (error.message.includes('No authentication token')) {
          userMessage = 'Authentication error. Please log in again.';
        } else if (error.message.includes('base64')) {
          userMessage = 'Failed to process image. Please try another photo.';
        } else {
          userMessage = error.message;
        }
      }
      
      Alert.alert('Upload Failed', userMessage);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle close button - go back to previous screen
  const handleClose = () => {
    if (capturedImage || selectedImage) {
      // If in preview mode, ask for confirmation
      Alert.alert(
        'Discard Story?',
        'Are you sure you want to discard this story?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } else {
      // If in create mode, just go back
      router.back();
    }
  };

  const openGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          We need your permission to use the camera
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Preview Mode
  if (capturedImage || selectedImage) {
    const imageSource: ImageSourcePropType = { 
      uri: (capturedImage || selectedImage) as string 
    };

    return (
      <View style={styles.previewContainer}>
        <Image
          source={imageSource}
          style={styles.previewImage}
          resizeMode="cover"
        />
        
        {showCaption && (
          <View style={styles.captionContainer}>
            <TextInput
              style={styles.captionInput}
              placeholder="Add a caption..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={150}
              autoFocus={showCaption}
            />
          </View>
        )}

        <View style={styles.previewControls}>
          <TouchableOpacity 
            style={styles.previewButton} 
            onPress={handleRetake}
            disabled={isUploading}
          >
            <Ionicons name="camera-reverse" size={20} color="white" />
            <Text style={styles.previewButtonText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.previewButton} 
            onPress={() => setShowCaption(!showCaption)}
            disabled={isUploading}
          >
            <Ionicons 
              name={showCaption ? "text" : "text-outline"} 
              size={20} 
              color="white" 
            />
            <Text style={styles.previewButtonText}>
              {showCaption ? 'Hide Caption' : 'Add Caption'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.previewButton, { backgroundColor: colors.primary }]} 
            onPress={uploadStory}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="white" />
                <Text style={styles.previewButtonText}>Share</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {isUploading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="white" />
            <Text style={{ color: 'white', marginTop: 10, textAlign: 'center' }}>
              Uploading story...
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={handleClose}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Story</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'camera' && styles.activeTab]}
          onPress={() => setActiveTab('camera')}
        >
          <Text style={[styles.tabText, activeTab === 'camera' && styles.activeTabText]}>
            Camera
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'gallery' && styles.activeTab]}
          onPress={() => setActiveTab('gallery')}
        >
          <Text style={[styles.tabText, activeTab === 'gallery' && styles.activeTabText]}>
            Gallery
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'camera' ? (
          <View style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={cameraType}
              flash={flashMode}
              mode="picture"
            />
            
            <View style={styles.cameraActions}>
              <TouchableOpacity 
                style={styles.cameraAction} 
                onPress={toggleFlash}
              >
                <Ionicons 
                  name={flashMode === 'on' ? 'flash' : 'flash-off'} 
                  size={24} 
                  color="white" 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cameraAction} 
                onPress={toggleCameraType}
              >
                <Ionicons name="camera-reverse" size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cameraAction} 
                onPress={openGallery}
              >
                <Ionicons name="images" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.cameraControls}>
              <TouchableOpacity 
                style={styles.captureButton} 
                onPress={takePicture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.galleryContainer}>
            <View style={styles.galleryHeader}>
              <Text style={styles.galleryTitle}>Select from Gallery</Text>
              <TouchableOpacity onPress={loadGalleryImages}>
                <Ionicons name="refresh" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {galleryImages.length > 0 ? (
              <ScrollView contentContainerStyle={styles.galleryGrid}>
                {galleryImages.map((imageUri, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.imageItem}
                    onPress={() => handleImageSelect(imageUri)}
                  >
                    <Image 
                      source={{ uri: imageUri }} 
                      style={styles.image} 
                    />
                    {selectedImage === imageUri && (
                      <View style={styles.selectedOverlay}>
                        <Ionicons name="checkmark-circle" size={30} color="white" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyGallery}>
                <Ionicons 
                  name="images-outline" 
                  size={64} 
                  color={colors.textSecondary} 
                />
                <Text style={styles.emptyGalleryText}>
                  No images selected{'\n'}Tap refresh to choose from your gallery
                </Text>
                <TouchableOpacity 
                  style={[styles.previewButton, { backgroundColor: colors.primary, marginTop: 20 }]} 
                  onPress={loadGalleryImages}
                >
                  <Ionicons name="refresh" size={20} color="white" />
                  <Text style={styles.previewButtonText}>Browse Gallery</Text>
                </TouchableOpacity>
              </View>
            )}

            {selectedImage && (
              <View style={styles.previewControls}>
                <TouchableOpacity 
                  style={[styles.previewButton, { backgroundColor: colors.primary }]} 
                  onPress={() => setCapturedImage(selectedImage)}
                >
                  <Ionicons name="checkmark" size={20} color="white" />
                  <Text style={styles.previewButtonText}>Use This Photo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}