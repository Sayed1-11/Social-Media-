import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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
} from 'react-native';

// Emoji data
const emojiCategories = [
  {
    category: 'Smileys & People',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾']
  },
  {
    category: 'Animals & Nature',
    emojis: ['🐵', '🐒', '🦍', '🦧', '🐶', '🐕', '🦮', '🐩', '🐺', '🦊', '🦝', '🐱', '🐈', '🦁', '🐯', '🐅', '🐆', '🐴', '🐎', '🦄', '🦓', '🦌', '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗', '🐽', '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦏', '🦛', '🐭', '🐁', '🐀', '🐹', '🐰', '🐇', '🐿️', '🦔', '🦇', '🐻', '🐨', '🐼', '🦥', '🦦', '🦨', '🦘', '🦡', '🐾', '🦃', '🐔', '🐓', '🐣', '🐤', '🐥', '🐦', '🐧', '🕊️', '🦅', '🦆', '🦢', '🦉', '🦩', '🦚', '🦜', '🐸', '🐊', '🐢', '🦎', '🐍', '🐲', '🐉', '🦕', '🦖', '🐳', '🐋', '🐬', '🐟', '🐠', '🐡', '🦈', '🐙', '🐚', '🐌', '🦋', '🐛', '🐜', '🐝', '🐞', '🦗', '🕷️', '🕸️', '🦂', '🦟', '🦠', '💐', '🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃']
  }
];

export default function CreatePostScreen() {
  const [postContent, setPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState(0);
  const router = useRouter();

  // Pick Image
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera roll permissions to make this work!');
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
        setSelectedVideo(null); // Clear video if image is selected
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Pick Video
  const pickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera roll permissions to make this work!');
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
        setSelectedImage(null); // Clear image if video is selected
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick video');
    }
  };

  // Get Current Location
  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need location permissions to make this work!');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      
      // Reverse geocode to get address
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const locationName = `${address.city}, ${address.region}, ${address.country}`;
      setSelectedLocation(locationName);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    }
  };

  // Add Emoji to Text
  const addEmoji = (emoji: string) => {
    setPostContent(prev => prev + emoji);
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

  const handleSubmit = async () => {
    if (!postContent.trim() && !selectedImage && !selectedVideo) {
      Alert.alert('Error', 'Please write something or add media before posting.');
      return;
    }

    if (postContent.length > 280) {
      Alert.alert('Error', 'Post must be less than 280 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create post object with all data
      const postData = {
        content: postContent,
        image: selectedImage,
        video: selectedVideo,
        location: selectedLocation,
        timestamp: new Date().toISOString(),
      };
      
      console.log('Creating post:', postData);
      
      // Show success message
      Alert.alert('Success', 'Your post has been published!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset everything
            setPostContent('');
            setSelectedImage(null);
            setSelectedVideo(null);
            setSelectedLocation(null);
            router.back();
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDraft = () => {
    if (postContent.trim() || selectedImage || selectedVideo) {
      Alert.alert('Draft Saved', 'Your post has been saved as draft.');
    }
    router.back();
  };

  const characterCount = postContent.length;
  const characterLimit = 280;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Create New Post</Text>
        
        {/* Post Content Input */}
        <TextInput
          style={styles.textInput}
          placeholder="What's happening?"
          value={postContent}
          onChangeText={setPostContent}
          multiline
          maxLength={characterLimit}
          textAlignVertical="top"
          autoFocus
        />

        {/* Selected Media Preview */}
        {selectedImage && (
          <View style={styles.mediaPreview}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <TouchableOpacity style={styles.removeMediaButton} onPress={removeMedia}>
              <Text style={styles.removeMediaText}>×</Text>
            </TouchableOpacity>
          </View>
        )}

        {selectedVideo && (
          <View style={styles.mediaPreview}>
            <View style={styles.videoPreview}>
              <Text style={styles.videoPreviewText}>🎥 Video Selected</Text>
            </View>
            <TouchableOpacity style={styles.removeMediaButton} onPress={removeMedia}>
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
              characterCount > characterLimit * 0.8 && { color: '#FF9800' },
              characterCount > characterLimit * 0.9 && { color: '#F44336' },
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
                : null
            ]} 
            onPress={handleSubmit}
            disabled={
              (!postContent.trim() && !selectedImage && !selectedVideo) || 
              postContent.length > characterLimit || 
              isSubmitting
            }
          >
            <Text style={styles.postButtonText}>
              {isSubmitting ? 'Posting...' : 'Post'}
            </Text>
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
            
            <TouchableOpacity style={styles.featureIcon} onPress={getLocation}>
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
                
                {/* Emoji Category Tabs */}
                <View style={styles.emojiCategories}>
                  {emojiCategories.map((category, index) => (
                    <TouchableOpacity
                      key={category.category}
                      style={[
                        styles.categoryTab,
                        activeEmojiCategory === index && styles.activeCategoryTab
                      ]}
                      onPress={() => setActiveEmojiCategory(index)}
                    >
                      <Text style={[
                        styles.categoryText,
                        activeEmojiCategory === index && styles.activeCategoryText
                      ]}>
                        {category.category.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Emoji Grid */}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1DA1F2',
  },
  textInput: {
    minHeight: 120,
    fontSize: 16,
    lineHeight: 24,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    textAlignVertical: 'top',
  },
  mediaPreview: {
    position: 'relative',
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  videoPreview: {
    width: '100%',
    height: 150,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPreviewText: {
    fontSize: 16,
    color: '#666',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeMediaText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  locationPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  locationText: {
    fontSize: 14,
    color: '#1DA1F2',
  },
  removeLocationText: {
    color: '#666',
    fontSize: 18,
    fontWeight: 'bold',
  },
  characterCount: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  characterCountText: {
    fontSize: 14,
    color: '#657786',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  draftButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1DA1F2',
  },
  postButton: {
    backgroundColor: '#1DA1F2',
  },
  disabledButton: {
    backgroundColor: '#a0d2f7',
  },
  draftButtonText: {
    color: '#1DA1F2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  postButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  features: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  featureIcons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  featureIcon: {
    alignItems: 'center',
  },
  featureIconText: {
    fontSize: 24,
    marginBottom: 5,
  },
  featureIconLabel: {
    fontSize: 12,
    color: '#657786',
  },
  // Emoji Picker Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  emojiPicker: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  emojiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  emojiTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  emojiCategories: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeCategoryTab: {
    backgroundColor: '#1DA1F2',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  activeCategoryText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emojiGrid: {
    padding: 10,
  },
  emojiItem: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
});