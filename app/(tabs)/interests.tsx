// app/interests.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const INTERESTS = [
  { id: 'technology', name: 'Technology', icon: 'laptop-outline' },
  { id: 'sports', name: 'Sports', icon: 'basketball-outline' },
  { id: 'music', name: 'Music', icon: 'musical-notes-outline' },
  { id: 'art', name: 'Art', icon: 'color-palette-outline' },
  { id: 'travel', name: 'Travel', icon: 'airplane-outline' },
  { id: 'food', name: 'Food', icon: 'restaurant-outline' },
  { id: 'fitness', name: 'Fitness', icon: 'fitness-outline' },
  { id: 'gaming', name: 'Gaming', icon: 'game-controller-outline' },
  { id: 'reading', name: 'Reading', icon: 'book-outline' },
  { id: 'photography', name: 'Photography', icon: 'camera-outline' },
  { id: 'science', name: 'Science', icon: 'flask-outline' },
  { id: 'nature', name: 'Nature', icon: 'leaf-outline' },
];

export default function InterestsScreen() {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { completeInterests } = useAuth();
  const router = useRouter();

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleContinue = async () => {
    if (selectedInterests.length < 3) {
      Alert.alert('Select Interests', 'Please choose at least 3 interests to continue.');
      return;
    }

    console.log('🎯 Starting interests upload...');
    console.log('📤 Selected interests:', selectedInterests);
    
    setIsLoading(true);
    try {
      // Try to save interests, but navigate even if it fails
      try {
        await completeInterests(selectedInterests);
        console.log('✅ Interests saved successfully!');
      } catch (error: any) {
        console.log('⚠️ Interests save failed, but continuing to edit profile:', error.message);
        // Continue navigation even if save fails
      }
      
      // Navigate to edit-profile
      console.log('🔄 Navigating to edit-profile...');
      router.push('/(tabs)/edit-profile');
      
    } catch (error: any) {
      console.error('❌ Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    console.log('⏭️ Skipping interests, navigating to edit-profile...');
    router.push('/(tabs)/edit-profile');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Interests</Text>
          <Text style={styles.subtitle}>
            Select at least 3 interests to personalize your experience
          </Text>
        </View>

        {/* Interests Grid */}
        <View style={styles.interestsGrid}>
          {INTERESTS.map(interest => (
            <TouchableOpacity
              key={interest.id}
              style={[
                styles.interestCard,
                selectedInterests.includes(interest.id) && styles.interestCardSelected,
              ]}
              onPress={() => toggleInterest(interest.id)}
              disabled={isLoading}
            >
              <Ionicons
                name={interest.icon as any}
                size={24}
                color={selectedInterests.includes(interest.id) ? '#1DA1F2' : '#666'}
              />
              <Text
                style={[
                  styles.interestText,
                  selectedInterests.includes(interest.id) && styles.interestTextSelected,
                ]}
              >
                {interest.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Selected Count */}
        <View style={styles.selectedCount}>
          <Text style={styles.selectedCountText}>
            {selectedInterests.length}/12 selected
          </Text>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (selectedInterests.length < 3 || isLoading) && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={selectedInterests.length < 3 || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueButtonText}>
              Continue ({selectedInterests.length})
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={isLoading}
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  interestCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  interestCardSelected: {
    borderColor: '#1DA1F2',
    backgroundColor: '#F0F8FF',
  },
  interestText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  interestTextSelected: {
    color: '#1DA1F2',
  },
  selectedCount: {
    alignItems: 'center',
    marginTop: 20,
  },
  selectedCountText: {
    color: '#666',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
  },
  continueButton: {
    backgroundColor: '#1DA1F2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  continueButtonDisabled: {
    backgroundColor: '#a0d2f7',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
  },
});