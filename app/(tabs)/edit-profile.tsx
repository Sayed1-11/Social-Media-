// app/edit-profile.tsx
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useThemeStyles } from "../../hooks/useThemeStyles";
import { useAuth } from "../context/AuthContext";

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors } = useThemeStyles();
  const { user, getAuthHeaders, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"profile" | "cover" | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    bio: "",
    location: "",
    website: "",
    profilePicture: "",
    coverPhoto: "",
  });

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        username: user.username || "",
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
        profilePicture: user.profilePicture || "",
        coverPhoto: user.coverPhoto || "",
      });
    }
  }, [user]);

  const API_BASE_URL = "http://localhost:3000";

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Upload image using the same method as ProfileScreen
  const uploadImage = async (imageType: "profile" | "cover") => {
    try {
      setUploading(imageType);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: imageType === "profile" ? [1, 1] : [16, 9],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0] && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        
        const headers = await getAuthHeaders();
        
        // Upload to imgBB - same as ProfileScreen
        const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
          method: "POST",
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          } as HeadersInit,
          body: JSON.stringify({ image: base64Image }),
        });

        const uploadData = await uploadResponse.json();

        if (uploadResponse.ok && uploadData.success) {
          // Update form data with new image URL
          if (imageType === "profile") {
            setFormData(prev => ({
              ...prev,
              profilePicture: uploadData.url
            }));
          } else {
            setFormData(prev => ({
              ...prev,
              coverPhoto: uploadData.url
            }));
          }
          
          Alert.alert("Success", `${imageType === "profile" ? "Profile picture" : "Cover photo"} uploaded successfully!`);
        } else {
          throw new Error(uploadData.message || "Failed to upload image");
        }
      }
    } catch (error: any) {
      console.error(`Error uploading ${imageType} image:`, error);
      Alert.alert(
        "Error",
        error.message || `Failed to upload ${imageType === "profile" ? "profile picture" : "cover photo"}. Please try again.`
      );
    } finally {
      setUploading(null);
    }
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!formData.fullName.trim()) {
      Alert.alert("Error", "Full name is required");
      return;
    }

    if (!formData.username.trim()) {
      Alert.alert("Error", "Username is required");
      return;
    }

    try {
      setSaving(true);
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: "PUT",
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        } as HeadersInit,
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          username: formData.username.trim(),
          bio: formData.bio.trim(),
          location: formData.location.trim(),
          website: formData.website.trim(),
          profilePicture: formData.profilePicture,
          coverPhoto: formData.coverPhoto,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update user context
        if (updateUser) {
          updateUser({
            fullName: data.user.fullName,
            username: data.user.username,
            bio: data.user.bio,
            location: data.user.location,
            website: data.user.website,
            profilePicture: data.user.profilePicture,
            coverPhoto: data.user.coverPhoto,
            isProfileComplete: data.isProfileComplete
          });
        }
        
        Alert.alert("Success", "Profile updated successfully!");
        router.back();
      } else {
        throw new Error(data.message || "Failed to update profile");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to update profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // Remove profile picture
  const removeProfilePicture = () => {
    Alert.alert(
      "Remove Profile Picture",
      "Are you sure you want to remove your profile picture?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setFormData(prev => ({
              ...prev,
              profilePicture: ""
            }));
          },
        },
      ]
    );
  };

  // Remove cover photo
  const removeCoverPhoto = () => {
    Alert.alert(
      "Remove Cover Photo",
      "Are you sure you want to remove your cover photo?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setFormData(prev => ({
              ...prev,
              coverPhoto: ""
            }));
          },
        },
      ]
    );
  };

  const styles = createStyles(colors);

  const isUploadingProfile = uploading === "profile";
  const isUploadingCover = uploading === "cover";

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          onPress={handleSaveProfile}
          style={styles.saveButton}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Cover Photo Section */}
          <View style={styles.coverSection}>
            <Image
              source={{
                uri: formData.coverPhoto || 
                  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=300&fit=crop"
              }}
              style={styles.coverPhoto}
            />
            <View style={styles.coverOverlay}>
              <TouchableOpacity 
                style={styles.coverActionButton}
                onPress={() => uploadImage("cover")}
                disabled={isUploadingCover}
              >
                {isUploadingCover ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="camera" size={20} color="#fff" />
                    <Text style={styles.coverActionText}>Change Cover</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile Picture Section */}
          <View style={styles.profileImageSection}>
            <View style={styles.profileImageContainer}>
              <Image
                source={{
                  uri: formData.profilePicture || 
                    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
                }}
                style={styles.profileImage}
              />
              
              {/* Upload Button */}
              <TouchableOpacity 
                style={styles.profileImageEdit}
                onPress={() => uploadImage("profile")}
                disabled={isUploadingProfile}
              >
                {isUploadingProfile ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="camera" size={16} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
            
            <Text style={styles.profileImageText}>
              Tap camera icon to update profile picture
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.fullName}
                onChangeText={(value) => handleInputChange("fullName", value)}
                placeholder="Enter your full name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* Username */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.username}
                onChangeText={(value) => handleInputChange("username", value)}
                placeholder="Enter username"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
              />
            </View>

            {/* Bio */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.bio}
                onChangeText={(value) => handleInputChange("bio", value)}
                placeholder="Tell people about yourself..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={160}
              />
              <Text style={styles.charCount}>
                {formData.bio.length}/160
              </Text>
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.textInput}
                value={formData.location}
                onChangeText={(value) => handleInputChange("location", value)}
                placeholder="Where are you from?"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* Website */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Website</Text>
              <TextInput
                style={styles.textInput}
                value={formData.website}
                onChangeText={(value) => handleInputChange("website", value)}
                placeholder="Add your website link"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
          </View>

          {/* Remove Buttons Section */}
          <View style={styles.removeSection}>
            <Text style={styles.sectionTitle}>Manage Images</Text>
            
            {formData.profilePicture && (
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={removeProfilePicture}
              >
                <Ionicons name="trash-outline" size={18} color="#ff3b30" />
                <Text style={styles.removeButtonText}>Remove Profile Picture</Text>
              </TouchableOpacity>
            )}
            
            {formData.coverPhoto && (
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={removeCoverPhoto}
              >
                <Ionicons name="trash-outline" size={18} color="#ff3b30" />
                <Text style={styles.removeButtonText}>Remove Cover Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.back()}
              disabled={saving}
            >
              <Ionicons name="close-circle" size={20} color={colors.text} />
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Spacer */}
          <View style={styles.footerSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    backButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    saveButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
    },
    saveButtonText: {
      color: colors.accent,
      fontSize: 16,
      fontWeight: "600",
    },
    keyboardAvoid: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    coverSection: {
      height: 150,
      position: "relative",
      backgroundColor: colors.surface,
    },
    coverPhoto: {
      width: "100%",
      height: "100%",
    },
    coverOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "center",
      alignItems: "center",
    },
    coverActionButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255,255,255,0.2)",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      gap: 6,
    },
    coverActionText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "500",
    },
    profileImageSection: {
      alignItems: "center",
      marginTop: -40,
      marginBottom: 16,
      backgroundColor: "transparent",
    },
    profileImageContainer: {
      position: "relative",
    },
    profileImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 4,
      borderColor: colors.surface,
    },
    profileImageEdit: {
      position: "absolute",
      bottom: -4,
      right: -4,
      backgroundColor: colors.accent,
      borderRadius: 12,
      width: 32,
      height: 32,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: colors.surface,
    },
    profileImageText: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 8,
    },
    formSection: {
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
    },
    textInput: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      color: colors.text,
      fontSize: 16,
    },
    textArea: {
      minHeight: 100,
      paddingTop: 12,
    },
    charCount: {
      color: colors.textSecondary,
      fontSize: 12,
      textAlign: "right",
      marginTop: 4,
    },
    removeSection: {
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 16,
    },
    removeButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
      gap: 8,
    },
    removeButtonText: {
      color: "#ff3b30",
      fontSize: 16,
      fontWeight: "500",
    },
    actionSection: {
      paddingHorizontal: 16,
      gap: 12,
    },
    primaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 8,
      gap: 8,
    },
    primaryButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    secondaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "transparent",
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "500",
    },
    footerSpacer: {
      height: 40,
    },
  });