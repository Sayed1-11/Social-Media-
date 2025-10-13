import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { useTheme } from '../context/ThemeContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { colors, isDark } = useThemeStyles();
  const [activeTab, setActiveTab] = useState<'posts' | 'videos'>('posts');

  // Sample data for posts and videos
  const userPosts = [
    { id: '1', type: 'image', uri: 'https://images.unsplash.com/photo-1579546929662-711aa81148cf?w=300&h=300&fit=crop' },
    { id: '2', type: 'image', uri: 'https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=300&h=300&fit=crop' },
    { id: '3', type: 'image', uri: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=300&h=300&fit=crop' },
    { id: '4', type: 'image', uri: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=300&h=300&fit=crop' },
    { id: '5', type: 'image', uri: 'https://images.unsplash.com/photo-1536323760109-ca8c07450053?w=300&h=300&fit=crop' },
    { id: '6', type: 'image', uri: 'https://images.unsplash.com/photo-1567306301408-9b74779a11af?w=300&h=300&fit=crop' },
  ];

  const userVideos = [
    { id: '1', type: 'video', uri: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300&h=300&fit=crop', duration: '2:30' },
    { id: '2', type: 'video', uri: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=300&h=300&fit=crop', duration: '1:45' },
    { id: '3', type: 'video', uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop', duration: '3:15' },
    { id: '4', type: 'video', uri: 'https://images.unsplash.com/photo-1536431311719-398b6704d4cc?w=300&h=300&fit=crop', duration: '4:20' },
  ];

  const styles = createStyles(colors);

  const renderGridItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.gridItem}>
      <Image source={{ uri: item.uri }} style={styles.gridImage} />
      {item.type === 'video' && (
        <View style={styles.videoOverlay}>
          <Ionicons name="play-circle" size={32} color="#fff" />
          <Text style={styles.videoDuration}>{item.duration}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileContainer}>
            <View style={styles.profileImageContainer}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' }}
                style={styles.profileImage}
              />
              <TouchableOpacity style={styles.profileImageBadge}>
                <Ionicons name="camera" size={12} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>John Doe</Text>
              <Text style={styles.profileHandle}>@johndoe</Text>
              <View style={styles.profileStats}>
                <View style={styles.profileStat}>
                  <Text style={styles.profileStatNumber}>245</Text>
                  <Text style={styles.profileStatLabel}>Posts</Text>
                </View>
                <View style={styles.profileStat}>
                  <Text style={styles.profileStatNumber}>1.2K</Text>
                  <Text style={styles.profileStatLabel}>Followers</Text>
                </View>
                <View style={styles.profileStat}>
                  <Text style={styles.profileStatNumber}>456</Text>
                  <Text style={styles.profileStatLabel}>Following</Text>
                </View>
              </View>
                 <Text style={styles.profileBio}>Digital creator • Photography enthusiast • Travel lover</Text>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.editProfileButton}>
              <Ionicons name="create-outline" size={18} color={colors.text} />
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share-outline" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <Ionicons 
              name="grid-outline" 
              size={20} 
              color={activeTab === 'posts' ? colors.accent : colors.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
              Posts
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'videos' && styles.activeTab]}
            onPress={() => setActiveTab('videos')}
          >
            <Ionicons 
              name="videocam-outline" 
              size={20} 
              color={activeTab === 'videos' ? colors.accent : colors.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === 'videos' && styles.activeTabText]}>
              Videos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content Grid */}
        <View style={styles.gridContainer}>
          <FlatList
            data={activeTab === 'posts' ? userPosts : userVideos}
            renderItem={renderGridItem}
            keyExtractor={(item) => item.id}
            numColumns={3}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gridContent}
          />
        </View>

        {/* Empty State */}
        {(activeTab === 'posts' && userPosts.length === 0) || 
         (activeTab === 'videos' && userVideos.length === 0) ? (
          <View style={styles.emptyState}>
            <Ionicons 
              name={activeTab === 'posts' ? "images-outline" : "videocam-outline"} 
              size={64} 
              color={colors.textSecondary} 
            />
            <Text style={styles.emptyStateText}>
              No {activeTab === 'posts' ? 'posts' : 'videos'} yet
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {activeTab === 'posts' 
                ? 'Share your first post with the world!' 
                : 'Upload your first video to get started!'}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');
const gridItemSize = (width - 4) / 3; // Accounting for 2px gap between items

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontWeight: 'bold',
    color: colors.text,
  },
  settingsButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: colors.surface,
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: colors.accent,
  },
  profileImageBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.accent,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileHandle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  profileBio: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 12,
    marginTop: 8,
    marginLeft:18,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  profileStat: {
    alignItems: 'center',
    flex: 1,
  },
  profileStatNumber: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  profileStatLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
  },
  editProfileText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  shareButton: {
    padding: 10,
    backgroundColor: colors.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: colors.accent + '20', // 20% opacity
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.accent,
  },
  gridContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  gridContent: {
    paddingBottom: 16,
  },
  gridItem: {
    width: gridItemSize,
    height: gridItemSize,
    margin: 0.5,
    backgroundColor: colors.surface,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoDuration: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});