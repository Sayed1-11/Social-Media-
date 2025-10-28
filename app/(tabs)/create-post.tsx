import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useAuth } from '../context/AuthContext';

// Emoji data
const emojiCategories = [
  {
    category: "Smileys & People",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
      "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
    ],
  },
  {
    category: "Animals & Nature",
    emojis: [
      "🐵", "🐒", "🦍", "🐶", "🐕", "🐩", "🐺", "🦊", "🐱", "🐈",
      "🦁", "🐯", "🐅", "🐆", "🐴", "🐎", "🦄", "🦓", "🦌", "🐮",
    ],
  },
];

// Location type icons
const locationTypeIcons = {
  city: "🏙️",
  beach: "🏖️",
  park: "🌳",
  landmark: "🗽",
  attraction: "🎡",
  cafe: "☕",
  restaurant: "🍽️",
  mall: "🛍️",
  entertainment: "🎬",
  default: "📍",
} as const;

// Create a type for the location types
type LocationType = keyof typeof locationTypeIcons;

const popularLocations: { id: string; name: string; type: LocationType }[] = [
  { id: '1', name: 'Dhaka, Bangladesh', type: 'city' },
  { id: '2', name: 'Gulshan', type: 'city' },
  { id: '3', name: 'Banani', type: 'city' },
  { id: '4', name: 'Dhanmondi', type: 'city' },
  { id: '5', name: 'Uttara', type: 'city' },
  { id: '11', name: 'Lalbagh Fort', type: 'landmark' },
  { id: '12', name: 'Ahsan Manzil', type: 'landmark' },
  { id: '18', name: 'Bashundhara City Mall', type: 'mall' },
  { id: '22', name: 'Hatirjheel', type: 'park' },
  { id: '34', name: 'North End Coffee', type: 'cafe' },
];

// Helper function to get the icon safely
const getLocationIcon = (type: string): string => {
  return locationTypeIcons[type as LocationType] || locationTypeIcons.default;
};

export default function CreatePostScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { getAuthHeaders, isAuthenticated, user } = useAuth();
  
  const [postContent, setPostContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState(0);
  const [privacy, setPrivacy] = useState<"public" | "friends" | "private">("public");

  const API_BASE_URL = 'http://localhost:3000';

  // Handle incoming image from TabLayout
  useEffect(() => {
    console.log("CreatePost params received:", params);

    if (params.imageUri) {
      const imageUri = params.imageUri as string;
      console.log("Setting selected image from params:", imageUri);
      setSelectedImage(imageUri);
      setSelectedVideo(null);
    }
  }, [params]);

  // Get current location for the "Current Location" option
  useEffect(() => {
    getCurrentLocationName();
  }, []);

  const getCurrentLocationName = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const locationName = `${address.city}, ${address.region}, ${address.country}`;
      setCurrentLocation(locationName);
    } catch (error) {
      console.log("Failed to get current location name");
    }
  };

  // Helper function to convert image URI to base64
  const convertImageToBase64 = async (uri: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new Error('Failed to process image');
    }
  };

  // Upload image to server - FIXED IMPLEMENTATION
  const uploadImage = async (imageUri: string): Promise<string> => {
    try {
      console.log("Starting image upload...");
      
      // Convert image to base64
      const base64Image = await convertImageToBase64(imageUri);
      
      const headers = await getAuthHeaders();
      
      const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          type: 'post'
        }),
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status: ${uploadResponse.status}`);
      }

      const uploadData = await uploadResponse.json();
      
      if (!uploadData.success || !uploadData.url) {
        throw new Error(uploadData.message || 'Failed to upload image');
      }

      console.log("Image uploaded successfully:", uploadData.url);
      return uploadData.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image. Please try again.');
    }
  };

  // Pick Image
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Sorry, we need camera roll permissions to make this work!"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
        setSelectedVideo(null);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  // Pick Video
  const pickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Sorry, we need camera roll permissions to make this work!"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedVideo(result.assets[0].uri);
        setSelectedImage(null);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick video");
    }
  };

  // Get Current Location
  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Sorry, we need location permissions to make this work!"
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const locationName = `${address.city}, ${address.region}, ${address.country}`;
      setSelectedLocation(locationName);
      setShowLocationPicker(false);
    } catch (error) {
      Alert.alert("Error", "Failed to get location");
    }
  };

  // Add Emoji to Text
  const addEmoji = (emoji: string) => {
    setPostContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Remove Media
  const removeMedia = () => {
    setSelectedImage(null);
    setSelectedVideo(null);
  };

  // Remove Location
  const removeLocation = () => {
    setSelectedLocation(null);
  };

  // Handle location selection from the modal
  const handleLocationSelect = (locationName: string) => {
    setSelectedLocation(locationName);
    setShowLocationPicker(false);
    setLocationSearchQuery("");
  };

  // Filter locations based on search query
  const filteredLocations = popularLocations.filter((location) =>
    location.name.toLowerCase().includes(locationSearchQuery.toLowerCase())
  );


const handleSubmit = async () => {
  if (!postContent.trim() && !selectedImage && !selectedVideo) {
    Alert.alert(
      "Error",
      "Please write something or add media before posting."
    );
    return;
  }

  if (postContent.length > 280) {
    Alert.alert("Error", "Post must be less than 280 characters.");
    return;
  }

  if (!isAuthenticated) {
    Alert.alert("Error", "Please login to create a post.");
    return;
  }

  setIsSubmitting(true);

  try {
    let imageBase64 = "";

    // Convert image to base64 if selected
    if (selectedImage) {
      console.log("Converting image to base64...");
      imageBase64 = await convertImageToBase64(selectedImage);
      console.log("Image converted to base64");
    }

    // Prepare post data for API - send base64 directly
    const postData = {
      content: postContent,
      image: imageBase64, // Send base64 directly
      privacy: privacy,
      location: selectedLocation,
    };

    console.log("Creating post with data:", {
      content: postData.content,
      hasImage: !!postData.image,
      privacy: postData.privacy
    });

    const headers = await getAuthHeaders();
    
    console.log("Sending request to:", `${API_BASE_URL}/posts`);
    
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    console.log("Response status:", response.status);
    
    const data = await response.json();
    console.log("Response data:", data);

    if (response.ok && data.success) {
      console.log("Post created successfully:", data);
      
      Alert.alert("Success", "Your post has been created!");
      
      // Clear form
      setPostContent("");
      setSelectedImage(null);
      setSelectedVideo(null);
      setSelectedLocation(null);
      
      setTimeout(() => {
        router.replace("/");
      }, 500);
    } else {
      console.error("API Error:", data);
      throw new Error(data.message || `Server returned ${response.status}`);
    }
  } catch (error) {
    console.error('Error creating post:', error);
    Alert.alert(
      "Error", 
      error instanceof Error ? error.message : "Failed to create post. Please try again."
    );
  } finally {
    setIsSubmitting(false);
  }
};

  const handleDraft = () => {
    if (postContent.trim() || selectedImage || selectedVideo) {
      Alert.alert("Draft Saved", "Your post has been saved as draft.");
    }
    router.back();
  };

  const characterCount = postContent.length;
  const characterLimit = 280;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Create New Post</Text>

        {/* Privacy Selector */}
        <View style={styles.privacyContainer}>
          <Text style={styles.privacyLabel}>Privacy:</Text>
          <View style={styles.privacyOptions}>
            <TouchableOpacity 
              style={[
                styles.privacyOption, 
                privacy === 'public' && styles.privacyOptionActive
              ]}
              onPress={() => setPrivacy('public')}
            >
              <Text style={[
                styles.privacyOptionText,
                privacy === 'public' && styles.privacyOptionTextActive
              ]}>🌍 Public</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.privacyOption, 
                privacy === 'friends' && styles.privacyOptionActive
              ]}
              onPress={() => setPrivacy('friends')}
            >
              <Text style={[
                styles.privacyOptionText,
                privacy === 'friends' && styles.privacyOptionTextActive
              ]}>👥 Friends</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.privacyOption, 
                privacy === 'private' && styles.privacyOptionActive
              ]}
              onPress={() => setPrivacy('private')}
            >
              <Text style={[
                styles.privacyOptionText,
                privacy === 'private' && styles.privacyOptionTextActive
              ]}>🔒 Private</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Post Content Input */}
        <TextInput
          style={styles.textInput}
          placeholder="What's happening?"
          value={postContent}
          onChangeText={setPostContent}
          multiline
          maxLength={characterLimit}
          textAlignVertical="top"
          autoFocus={!selectedImage}
        />

        {/* Selected Media Preview */}
        {selectedImage && (
          <View style={styles.mediaPreview}>
            <Image
              source={{ uri: selectedImage }}
              style={styles.previewImage}
            />
            <TouchableOpacity
              style={styles.removeMediaButton}
              onPress={removeMedia}
            >
              <Text style={styles.removeMediaText}>×</Text>
            </TouchableOpacity>
          </View>
        )}

        {selectedVideo && (
          <View style={styles.mediaPreview}>
            <View style={styles.videoPreview}>
              <Text style={styles.videoPreviewText}>🎥 Video Selected</Text>
              <Text style={styles.videoNote}>Note: Video upload not yet supported</Text>
            </View>
            <TouchableOpacity
              style={styles.removeMediaButton}
              onPress={removeMedia}
            >
              <Text style={styles.removeMediaText}>×</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Selected Location */}
        {selectedLocation && (
          <View style={styles.locationPreview}>
            <Text style={styles.locationText}>📍 {selectedLocation}</Text>
            <TouchableOpacity onPress={removeLocation}>
              <Text style={styles.removeLocationText}>×</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Character Count */}
        <View style={styles.characterCount}>
          <Text
            style={[
              styles.characterCountText,
              characterCount > characterLimit * 0.8 && { color: "#FF9800" },
              characterCount > characterLimit * 0.9 && { color: "#F44336" },
            ]}
          >
            {characterCount}/{characterLimit}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.draftButton]}
            onPress={handleDraft}
          >
            <Text style={styles.draftButtonText}>Save Draft</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.postButton,
              (!postContent.trim() && !selectedImage && !selectedVideo) ||
              postContent.length > characterLimit ||
              isSubmitting
                ? styles.disabledButton
                : null,
            ]}
            onPress={handleSubmit}
            disabled={
              (!postContent.trim() && !selectedImage && !selectedVideo) ||
              postContent.length > characterLimit ||
              isSubmitting
            }
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Media Options */}
        <View style={styles.features}>
          <Text style={styles.featuresTitle}>Add to your post</Text>
          <View style={styles.featureIcons}>
            <TouchableOpacity style={styles.featureIcon} onPress={pickImage}>
              <Text style={styles.featureIconText}>📷</Text>
              <Text style={styles.featureIconLabel}>Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.featureIcon} onPress={pickVideo}>
              <Text style={styles.featureIconText}>🎥</Text>
              <Text style={styles.featureIconLabel}>Video</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.featureIcon}
              onPress={() => setShowLocationPicker(true)}
            >
              <Text style={styles.featureIconText}>📍</Text>
              <Text style={styles.featureIconLabel}>Location</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.featureIcon}
              onPress={() => setShowEmojiPicker(true)}
            >
              <Text style={styles.featureIconText}>😊</Text>
              <Text style={styles.featureIconLabel}>Emoji</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Emoji Picker Modal */}
      <Modal
        visible={showEmojiPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEmojiPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowEmojiPicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.emojiPicker}>
                <View style={styles.emojiHeader}>
                  <Text style={styles.emojiTitle}>Choose an Emoji</Text>
                  <TouchableOpacity onPress={() => setShowEmojiPicker(false)}>
                    <Text style={styles.closeButton}>×</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.emojiCategories}>
                  {emojiCategories.map((category, index) => (
                    <TouchableOpacity
                      key={category.category}
                      style={[
                        styles.categoryTab,
                        activeEmojiCategory === index &&
                          styles.activeCategoryTab,
                      ]}
                      onPress={() => setActiveEmojiCategory(index)}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          activeEmojiCategory === index &&
                            styles.activeCategoryText,
                        ]}
                      >
                        {category.category.split(" ")[0]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <FlatList
                  data={emojiCategories[activeEmojiCategory].emojis}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.emojiItem}
                      onPress={() => addEmoji(item)}
                    >
                      <Text style={styles.emoji}>{item}</Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item, index) => index.toString()}
                  numColumns={8}
                  contentContainerStyle={styles.emojiGrid}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Location Picker Modal */}
      <Modal
        visible={showLocationPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.locationPicker}>
            <View style={styles.locationHeader}>
              <Text style={styles.locationTitle}>Choose a Location</Text>
              <TouchableOpacity onPress={() => setShowLocationPicker(false)}>
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search for places..."
                value={locationSearchQuery}
                onChangeText={setLocationSearchQuery}
              />
              <Text style={styles.searchIcon}>🔍</Text>
            </View>

            <TouchableOpacity
              style={styles.locationOption}
              onPress={getLocation}
            >
              <Text style={styles.locationOptionIcon}>🎯</Text>
              <View style={styles.locationOptionText}>
                <Text style={styles.locationOptionName}>Current Location</Text>
                <Text style={styles.locationOptionAddress}>
                  {currentLocation || "Get your current location"}
                </Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Popular Locations</Text>
            <FlatList
              data={filteredLocations}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.locationOption}
                  onPress={() => handleLocationSelect(item.name)}
                >
                  <Text style={styles.locationOptionIcon}>
                    {getLocationIcon(item.type)}
                  </Text>
                  <View style={styles.locationOptionText}>
                    <Text style={styles.locationOptionName}>{item.name}</Text>
                    <Text style={styles.locationOptionType}>
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              style={styles.locationsList}
              showsVerticalScrollIndicator={false}
            />

            <TouchableOpacity
              style={styles.customLocationOption}
              onPress={() => {
                if (locationSearchQuery.trim()) {
                  handleLocationSelect(locationSearchQuery);
                } else {
                  Alert.alert(
                    "Enter Location",
                    "Please type a location name first."
                  );
                }
              }}
            >
              <Text style={styles.customLocationText}>
                {locationSearchQuery.trim()
                  ? `Add "${locationSearchQuery}" as location`
                  : "Type to add custom location"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#1DA1F2",
  },
  privacyContainer: {
    marginBottom: 15,
  },
  privacyLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  privacyOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  privacyOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e1e8ed",
    alignItems: "center",
    marginHorizontal: 4,
  },
  privacyOptionActive: {
    backgroundColor: "#1DA1F2",
    borderColor: "#1DA1F2",
  },
  privacyOptionText: {
    fontSize: 14,
    color: "#657786",
  },
  privacyOptionTextActive: {
    color: "white",
    fontWeight: "600",
  },
  textInput: {
    minHeight: 120,
    fontSize: 16,
    lineHeight: 24,
    borderWidth: 1,
    borderColor: "#e1e8ed",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    textAlignVertical: "top",
  },
  mediaPreview: {
    position: "relative",
    marginBottom: 15,
    borderRadius: 12,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  videoPreview: {
    width: "100%",
    height: 150,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  videoPreviewText: {
    fontSize: 16,
    color: "#666",
  },
  videoNote: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  removeMediaButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  removeMediaText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  locationPreview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0f8ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  locationText: {
    fontSize: 14,
    color: "#1DA1F2",
  },
  removeLocationText: {
    color: "#666",
    fontSize: 18,
    fontWeight: "bold",
  },
  characterCount: {
    alignItems: "flex-end",
    marginBottom: 20,
  },
  characterCountText: {
    fontSize: 14,
    color: "#657786",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    marginHorizontal: 5,
  },
  draftButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#1DA1F2",
  },
  postButton: {
    backgroundColor: "#1DA1F2",
  },
  disabledButton: {
    backgroundColor: "#a0d2f7",
  },
  draftButtonText: {
    color: "#1DA1F2",
    fontSize: 16,
    fontWeight: "bold",
  },
  postButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  features: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  featureIcons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  featureIcon: {
    alignItems: "center",
  },
  featureIconText: {
    fontSize: 24,
    marginBottom: 5,
  },
  featureIconLabel: {
    fontSize: 12,
    color: "#657786",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  emojiPicker: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
  },
  emojiHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  emojiTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    fontSize: 24,
    color: "#666",
  },
  emojiCategories: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeCategoryTab: {
    backgroundColor: "#1DA1F2",
  },
  categoryText: {
    fontSize: 14,
    color: "#666",
  },
  activeCategoryText: {
    color: "white",
    fontWeight: "bold",
  },
  emojiGrid: {
    padding: 10,
  },
  emojiItem: {
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 24,
  },
  locationPicker: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  locationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    borderWidth: 1,
    borderColor: "#e1e8ed",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchIcon: {
    fontSize: 18,
    color: "#657786",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    color: "#333",
  },
  locationsList: {
    maxHeight: 300,
  },
  locationOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  locationOptionIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 30,
  },
  locationOptionText: {
    flex: 1,
  },
  locationOptionName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  locationOptionAddress: {
    fontSize: 14,
    color: "#657786",
    marginTop: 2,
  },
  locationOptionType: {
    fontSize: 12,
    color: "#657786",
    marginTop: 2,
    textTransform: "capitalize",
  },
  customLocationOption: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#f0f8ff",
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1DA1F2",
    borderStyle: "dashed",
  },
  customLocationText: {
    color: "#1DA1F2",
    fontSize: 16,
    fontWeight: "500",
  },
});