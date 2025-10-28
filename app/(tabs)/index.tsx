import { useThemeStyles } from '@/hooks/useThemeStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face';

// API Types based on your backend
type User = {
  _id: string;
  name: string;
  email: string;
  profilePicture: string;
  bio: string;
  isProfileComplete: boolean;
  postsCount?: number;
  friendsCount?: number;
};

type ApiPost = {
  _id: string;
  userId: string;
  user?: User;
  content: string;
  image?: string;
  imageData?: any;
  privacy: string;
  likes: Array<{
    userId: string;
    likedAt: Date;
  }>;
  comments: Array<{
    _id: string;
    userId: string;
    user?: User;
    content: string;
    createdAt: Date;
  }>;
  shares: number;
  createdAt: Date;
  updatedAt: Date;
};

type ApiStory = {
  _id: string;
  userId: string;
  user?: User;
  image: string;
  content: string;
  createdAt: Date;
  expiresAt: Date;
  seen?: boolean;
};

// Component Types
type Post = {
  id: string;
  username: string;
  name: string;
  content: string;
  likes: number;
  comments: number;
  time: string;
  userImage: string;
  image?: string;
  isLiked: boolean;
  commentsList: Array<{
    id: string;
    username: string;
    name: string;
    comment: string;
    time: string;
  }>;
  // For API operations
  _id?: string;
};

type StoryType = {
  id: string;
  username: string;
  name: string;
  avatar: string;
  hasNewStory: boolean;
  isUser: boolean;
  stories: Array<{
    id: string;
    type: 'image' | 'video';
    url: string;
    duration: number;
    seen: boolean;
    timestamp: string;
  }>;
  // For API operations
  _id?: string;
  userId?: string;
};

type CreateStoryType = {
  image: string;
  content: string;
};

type FriendRequest = {
  _id: string;
  requesterId: string;
  recipientId: string;
  requester?: User;
  status: string;
  createdAt: Date;
};

// API Configuration
const API_BASE_URL = 'http://localhost:3000';

// Styles remain the same as your original code
const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appHeader: {
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  listContent: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: colors.background,
  },
  
  // Stories Section
  storiesSection: {
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  storiesList: {
    paddingHorizontal: 4,
  },
  storyContainer: {
    alignItems: 'center',
    marginHorizontal: 6,
    width: 72,
  },
  storyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    position: 'relative',
    backgroundColor: colors.surface,
  },
  hasNewStory: {
    borderColor: colors.primary,
  },
  seenStory: {
    borderColor: colors.border,
  },
  storyImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  storyUsername: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  addStoryButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  addStoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  // Full Screen Story Viewer
  fullScreenStoryContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  progressBarContainer: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 4,
    zIndex: 1000,
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  storyHeader: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 50 : 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 1000,
  },
  storyAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  storyUserInfo: {
    flex: 1,
  },
  storyName: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  storyTime: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  storyContent: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  storyNavigation: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '30%',
    zIndex: 999,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 30 : 60,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '300',
  },
  actionButtons: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    zIndex: 1000,
    gap: 15,
  },
  actionButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 20,
  },

  // Story Creation
  createStoryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    alignSelf: 'center',
  },
  createStoryText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  createStoryModal: {
    backgroundColor: colors.surface,
    margin: 20,
    borderRadius: 15,
    padding: 20,
    maxWidth: 500,
    width: '90%',
    alignSelf: 'center',
  },
  createStoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  storyInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    marginBottom: 16,
  },
  storyPreview: {
    width: '100%',
    height: 400,
    borderRadius: 10,
    marginBottom: 16,
    backgroundColor: colors.background,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  fileInput: {
    marginBottom: 16,
  },
  fileInputText: {
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    padding: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 10,
    borderStyle: 'dashed',
  },

  // Post Styles
  post: {
    backgroundColor: colors.surface,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontWeight: '600',
    fontSize: 15,
    color: colors.text,
    marginBottom: 2,
  },
  username: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  moreButton: {
    padding: 4,
  },
  moreText: {
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontWeight: '400',
  },
  postImage: {
    width: '100%',
    height: 400,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 8,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  actionText: {
    marginLeft: 6,
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  likedAction: {
    color: colors.primary,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  commentsModal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  optionsModal: {
    backgroundColor: colors.surface,
    margin: 20,
    borderRadius: 15,
    padding: 10,
    maxWidth: 400,
    alignSelf: 'center',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  commentsList: {
    maxHeight: 400,
    padding: 16,
  },
  commentItem: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentName: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  commentTime: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  commentText: {
    color: colors.text,
    fontSize: 14,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 12,
    color: colors.text,
    marginRight: 10,
    maxHeight: 100,
  },
  commentSubmitButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  commentSubmitDisabled: {
    backgroundColor: colors.textSecondary,
  },
  commentSubmitText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  optionButton: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  reportOption: {
    color: colors.error,
  },
  cancelButton: {
    borderBottomWidth: 0,
    marginTop: 10,
  },
  cancelText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: colors.textSecondary,
  },
});

export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [selectedPostForOptions, setSelectedPostForOptions] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Story states
  const [stories, setStories] = useState<StoryType[]>([]);
  const [storyModalVisible, setStoryModalVisible] = useState(false);
  const [currentStory, setCurrentStory] = useState<StoryType | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const { getAuthHeaders, isAuthenticated } = useAuth();
  
  // Story creation states
  const [createStoryModalVisible, setCreateStoryModalVisible] = useState(false);
  const [newStory, setNewStory] = useState<CreateStoryType>({
    image: '',
    content: ''
  });
  const [storyImage, setStoryImage] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const { colors } = useThemeStyles();
  const styles = createStyles(colors);

  // Get token from storage
  const getToken = async () => {
    const realToken = await AsyncStorage.getItem('auth-token');
    if (realToken) return realToken;
    
    console.log('No valid token found. Please login first.');
    return null;
  };

  // Helper function to format time
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Fetch current user data
  const fetchCurrentUser = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/profile`, {
        credentials: 'include',
        headers: headers
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentUser(data.user);
          return data.user;
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  };

  // Fetch posts from API
  const fetchPosts = async () => {
    try {
      if (!isAuthenticated) {
        console.log('User not authenticated, redirecting to login...');
        return;
      }
      
      setLoading(true);
      
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/posts`, {
        credentials: 'include',
        headers: headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Transform API data to match component expectations
        const transformedPosts: Post[] = data.posts.map((post: ApiPost) => ({
          id: post._id,
          _id: post._id,
          username: post.user?.name?.toLowerCase().replace(/\s+/g, '') || 'user',
          name: post.user?.name || 'User',
          content: post.content,
          likes: post.likes.length,
          comments: post.comments.length,
          time: getTimeAgo(post.createdAt),
          userImage: post.user?.profilePicture || DEFAULT_AVATAR,
          image: post.image,
          isLiked: post.likes.some(like => like.userId === 'current-user-id'),
          commentsList: post.comments.map(comment => ({
            id: comment._id,
            username: comment.user?.name?.toLowerCase().replace(/\s+/g, '') || 'user',
            name: comment.user?.name || 'User',
            comment: comment.content,
            time: getTimeAgo(comment.createdAt)
          }))
        }));
        
        setPosts(transformedPosts);
      } else {
        throw new Error(data.message || 'Failed to load posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'Failed to load posts from server.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stories from API
  const fetchStories = async () => {
    try {
      if (!isAuthenticated) {
        console.log('User not authenticated, redirecting to login...');
        return;
      }
      
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/stories`, {
        credentials: 'include', 
        headers: headers 
      });
      
      let transformedStories: StoryType[] = [];
      
      // Always add current user's story (for creating new stories)
      const user = await fetchCurrentUser();
      if (user) {
        const userStory: StoryType = {
          id: 'current-user-story',
          username: user.name?.toLowerCase().replace(/\s+/g, '') || 'user',
          name: user.name || 'User',
          avatar: user.profilePicture || DEFAULT_AVATAR,
          hasNewStory: false,
          isUser: true,
          stories: []
        };
        transformedStories.push(userStory);
      }
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.stories.length > 0) {
          // Transform API stories and add them after user's story
          const apiStories: StoryType[] = data.stories.map((story: ApiStory) => ({
            id: story._id,
            _id: story._id,
            userId: story.userId,
            username: story.user?.name?.toLowerCase().replace(/\s+/g, '') || 'user',
            name: story.user?.name || 'User',
            avatar: story.user?.profilePicture || DEFAULT_AVATAR,
            hasNewStory: !story.seen,
            isUser: false,
            stories: [{
              id: story._id,
              type: 'image' as const,
              url: story.image,
              duration: 5,
              seen: story.seen || false,
              timestamp: getTimeAgo(story.createdAt)
            }]
          }));
          
          transformedStories = [...transformedStories, ...apiStories];
        }
      }
      
      setStories(transformedStories);
    } catch (error) {
      console.error('Error fetching stories:', error);
      
      // Even if API fails, show current user's story
      const user = await fetchCurrentUser();
      if (user) {
        const userStory: StoryType = {
          id: 'current-user-story',
          username: user.name?.toLowerCase().replace(/\s+/g, '') || 'user',
          name: user.name || 'User',
          avatar: user.profilePicture || DEFAULT_AVATAR,
          hasNewStory: false,
          isUser: true,
          stories: []
        };
        setStories([userStory]);
      }
    }
  };

  // Ensure current user is always shown in stories
  useEffect(() => {
    const ensureCurrentUserStory = async () => {
      if (stories.length === 0 || !stories.some(story => story.isUser)) {
        const user = await fetchCurrentUser();
        if (user) {
          const userStory: StoryType = {
            id: 'current-user-story',
            username: user.name?.toLowerCase().replace(/\s+/g, '') || 'user',
            name: user.name || 'User',
            avatar: user.profilePicture || DEFAULT_AVATAR,
            hasNewStory: false,
            isUser: true,
            stories: []
          };
          setStories(prev => [userStory, ...prev.filter(story => !story.isUser)]);
        }
      }
    };
    
    ensureCurrentUserStory();
  }, [stories]);

  // Fetch data on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts();
      fetchStories();
       const interval = setInterval(() => {
      fetchPosts(); // This will fetch new posts
    }, 30000);
    
    return () => clearInterval(interval); // Cleanup on unmount
  }
    
  }, [isAuthenticated]);

  // Enhanced Story Functions
  const openStory = (story: StoryType, storyIndex: number = 0) => {
    // If user clicks on their own empty story, open creation modal
    if (story.isUser && story.stories.length === 0) {
      setCreateStoryModalVisible(true);
      return;
    }
    
    // If story has no content, don't open viewer
    if (story.stories.length === 0) {
      Alert.alert('No Story', 'This user has no active stories.');
      return;
    }
    
    setCurrentStory(story);
    setCurrentStoryIndex(storyIndex);
    setProgress(0);
    setStoryModalVisible(true);
    
    // Mark story as seen
    setStories(prev => prev.map(s => 
      s.id === story.id 
        ? { ...s, hasNewStory: false, stories: s.stories.map(st => ({ ...st, seen: true })) }
        : s
    ));

    // Hide status bar for full screen experience
    if (Platform.OS !== 'web') {
      StatusBar.setHidden(true);
    }
  };

  const closeStory = () => {
    setStoryModalVisible(false);
    setCurrentStory(null);
    setCurrentStoryIndex(0);
    
    // Show status bar again
    if (Platform.OS !== 'web') {
      StatusBar.setHidden(false);
    }
  };

  const nextStory = () => {
    if (!currentStory) return;
    
    const nextIndex = currentStoryIndex + 1;
    if (nextIndex < currentStory.stories.length) {
      setCurrentStoryIndex(nextIndex);
      setProgress(0);
    } else {
      // Move to next user
      const currentUserIndex = stories.findIndex(s => s.id === currentStory.id);
      if (currentUserIndex < stories.length - 1) {
        const nextUser = stories[currentUserIndex + 1];
        openStory(nextUser, 0);
      } else {
        closeStory();
      }
    }
  };

  const previousStory = () => {
    if (!currentStory) return;
    
    const prevIndex = currentStoryIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStoryIndex(prevIndex);
      setProgress(0);
    } else {
      // Move to previous user
      const currentUserIndex = stories.findIndex(s => s.id === currentStory.id);
      if (currentUserIndex > 0) {
        const prevUser = stories[currentUserIndex - 1];
        const prevUserStories = prevUser.stories;
        openStory(prevUser, prevUserStories.length - 1);
      }
    }
  };

  // Progress bar animation
  useEffect(() => {
    if (!storyModalVisible || !currentStory) return;
    
    const currentStoryItem = currentStory.stories[currentStoryIndex];
    const duration = currentStoryItem.duration * 1000;
    const interval = 50;
    const steps = duration / interval;
    const increment = 100 / steps;
    
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          nextStory();
          return 0;
        }
        return prev + increment;
      });
    }, interval);
    
    return () => clearInterval(timer);
  }, [storyModalVisible, currentStory, currentStoryIndex]);

  // Story creation functions
  const handleImageUpload = async (event: any) => {
    if (Platform.OS === 'web') {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string;
          setStoryImage(imageUrl);
          setNewStory(prev => ({ ...prev, image: imageUrl }));
        };
        reader.readAsDataURL(file);
      }
    } else {
      // For React Native, you'd use expo-image-picker here
      Alert.alert('Info', 'Image picker would open here in mobile app');
    }
  };

  const createNewStory = async () => {
    if (!newStory.image.trim()) {
      Alert.alert('Error', 'Please select an image for your story');
      return;
    }

    try {
       const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/stories`, {
        method: 'POST',
        credentials: 'include', // This sends cookies automatically
      headers:  headers, // Get proper auth headers from context
        body: JSON.stringify(newStory)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh stories
          fetchStories();
          setCreateStoryModalVisible(false);
          setNewStory({ image: '', content: '' });
          setStoryImage('');
          Alert.alert('Success', 'Your story has been posted!');
        }
      } else {
        throw new Error('Failed to create story');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to post story. Please try again.');
    }
  };

  // Enhanced Story Renderer
  const renderStory = ({ item }: { item: StoryType }) => (
    <TouchableOpacity 
      style={styles.storyContainer}
      onPress={() => openStory(item, 0)}
    >
      <View style={[
        styles.storyCircle,
        item.hasNewStory ? styles.hasNewStory : styles.seenStory,
        item.stories.length === 0 && styles.seenStory // Empty stories show as seen
      ]}>
        <Image 
          source={{ uri: item.avatar }} 
          style={styles.storyImage}
        />
        {item.isUser && (
          <TouchableOpacity 
            style={styles.addStoryButton}
            onPress={(e) => {
              e.stopPropagation();
              setCreateStoryModalVisible(true);
            }}
          >
            <Text style={styles.addStoryText}>+</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.storyUsername} numberOfLines={1}>
        {item.isUser ? 'Your Story' : item.name}
      </Text>
    </TouchableOpacity>
  );

  // Full Screen Story Viewer
  const renderFullScreenStory = () => {
    if (!currentStory) return null;
    
    const currentStoryItem = currentStory.stories[currentStoryIndex];
    
    return (
      <Modal
        visible={storyModalVisible}
        animationType="fade"
        transparent={false}
        statusBarTranslucent={true}
        onRequestClose={closeStory}
      >
        <View style={styles.fullScreenStoryContainer}>
          {/* Progress Bars */}
          <View style={styles.progressBarContainer}>
            {currentStory.stories.map((_, index) => (
              <View key={index} style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressBarFill,
                    { 
                      width: index === currentStoryIndex 
                        ? `${progress}%` 
                        : index < currentStoryIndex ? '100%' : '0%' 
                    }
                  ]} 
                />
              </View>
            ))}
          </View>

          {/* Story Header */}
          <View style={styles.storyHeader}>
            <Image 
              source={{ uri: currentStory.avatar }} 
              style={styles.storyAvatar}
            />
            <View style={styles.storyUserInfo}>
              <Text style={styles.storyName}>{currentStory.name}</Text>
              <Text style={styles.storyTime}>{currentStoryItem.timestamp}</Text>
            </View>
          </View>

          {/* Story Content - Full Screen */}
          <Image 
            source={{ uri: currentStoryItem.url }} 
            style={styles.storyContent}
            resizeMode="cover"
          />

          {/* Navigation Areas */}
          <TouchableOpacity 
            style={[styles.storyNavigation, { left: 0 }]}
            onPress={previousStory}
          />
          <TouchableOpacity 
            style={[styles.storyNavigation, { right: 0 }]}
            onPress={nextStory}
          />

          {/* Close Button */}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={closeStory}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>❤️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>💬</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>📤</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Story Creation Modal
  const renderCreateStoryModal = () => (
    <Modal
      visible={createStoryModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setCreateStoryModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.createStoryModal}>
          <Text style={styles.createStoryTitle}>Create New Story</Text>
          
          {/* Image Upload */}
          {Platform.OS === 'web' ? (
            <>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                id="story-upload"
              />
              <label htmlFor="story-upload">
                <View style={styles.fileInput}>
                  <Text style={styles.fileInputText}>
                    {storyImage ? 'Change Image' : 'Choose Image'}
                  </Text>
                </View>
              </label>
            </>
          ) : (
            <TouchableOpacity 
              style={styles.fileInput}
              onPress={() => Alert.alert('Info', 'Image picker would open here')}
            >
              <Text style={styles.fileInputText}>
                {storyImage ? 'Change Image' : 'Choose Image'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Image Preview */}
          {storyImage && (
            <Image 
              source={{ uri: storyImage }} 
              style={styles.storyPreview}
              resizeMode="cover"
            />
          )}

          {/* Content Input */}
          <TextInput
            style={styles.storyInput}
            placeholder="Add a caption (optional)"
            value={newStory.content}
            onChangeText={(text) => setNewStory(prev => ({ ...prev, content: text }))}
            placeholderTextColor={colors.textSecondary}
            multiline
          />

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => setCreateStoryModalVisible(false)}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={createNewStory}
              disabled={!storyImage}
            >
              <Text style={styles.primaryButtonText}>Post Story</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Post Functions
  const likePost = async (postId: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update local state
          setPosts(posts.map(post => {
            if (post._id === postId) {
              const wasLiked = post.isLiked;
              return { 
                ...post, 
                likes: wasLiked ? post.likes - 1 : post.likes + 1,
                isLiked: !wasLiked
              };
            }
            return post;
          }));
        }
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const addComment = async (postId: string) => {
    if (!newComment.trim()) return;

    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/comment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newComment })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update local state
          setPosts(posts.map(post => {
            if (post._id === postId) {
              return {
                ...post,
                comments: post.comments + 1,
                commentsList: [...post.commentsList, {
                  id: data.comment._id,
                  username: 'currentuser',
                  name: 'You',
                  comment: newComment,
                  time: 'Just now'
                }]
              };
            }
            return post;
          }));
          setNewComment('');
          setCommentModalVisible(false);
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const sharePost = async (post: Post) => {
    const postLink = `https://socialapp.com/post/${post.id}`;
    
    if (Platform.OS === 'web') {
      navigator.clipboard.writeText(postLink);
      Alert.alert('Link Copied!', 'Post link has been copied to clipboard.');
    } else {
      try {
        await Sharing.shareAsync(postLink);
      } catch (error) {
        Clipboard.setStringAsync(postLink);
        Alert.alert('Link Copied!', 'Post link has been copied to clipboard.');
      }
    }
  };

  const downloadImage = async (post: Post | null) => {
    if (!post?.image) {
      Alert.alert('No Image', 'This post does not contain an image to download.');
      return;
    }

    try {
      if (Platform.OS === 'web') {
        window.open(post.image, '_blank');
        Alert.alert('Image Opened', 'Image opened in new tab. Right-click to save.');
      } else {
        await Sharing.shareAsync(post.image);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open image. Please try again.');
    }
    
    setOptionsModalVisible(false);
  };

  const openComments = (post: Post) => {
    setSelectedPost(post);
    setCommentModalVisible(true);
  };

  const openOptions = (post: Post) => {
    setSelectedPostForOptions(post);
    setOptionsModalVisible(true);
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.post}>
      <View style={styles.postHeader}>
        <Image 
          source={{ uri: item.userImage }} 
          style={styles.userAvatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.username}>@{item.username} · {item.time}</Text>
        </View>
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => openOptions(item)}
        >
          <Text style={styles.moreText}>⋯</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.content}>{item.content}</Text>
      
      {/* Display Image if exists */}
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.postImage} />
      )}
      
      <View style={styles.postActions}>
        <TouchableOpacity 
          onPress={() => likePost(item._id || item.id)} 
          style={styles.action}
        >
          <Text style={[
            styles.actionText,
            item.isLiked && styles.likedAction
          ]}>
            {item.isLiked ? '❤️' : '🤍'} {item.likes}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.action}
          onPress={() => openComments(item)}
        >
          <Text style={styles.actionText}>💬 {item.comments}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.action}>
          <Text style={styles.actionText}>🔄</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.action}
          onPress={() => sharePost(item)}
        >
          <Text style={styles.actionText}>📤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const HeaderComponent = () => (
    <View style={styles.header}>
      {/* Stories Section */}
      <View style={styles.storiesSection}>
        <FlatList
          data={stories}
          renderItem={renderStory}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesList}
        />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading posts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.appHeader}>
        <Text style={styles.appTitle}>SmartConnect</Text>
      </View>
      
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={HeaderComponent}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={fetchPosts}
      />
      
      {/* Story Modals */}
      {renderFullScreenStory()}
      {renderCreateStoryModal()}
      
      {/* Comments Modal */}
      <Modal
        visible={commentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.commentsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity 
                onPress={() => setCommentModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={selectedPost?.commentsList || []}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentName}>{item.name}</Text>
                    <Text style={styles.commentTime}>{item.time}</Text>
                  </View>
                  <Text style={styles.commentText}>{item.comment}</Text>
                </View>
              )}
              keyExtractor={item => item.id}
              style={styles.commentsList}
            />

            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                value={newComment}
                onChangeText={setNewComment}
                multiline
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity 
                style={[
                  styles.commentSubmitButton,
                  !newComment.trim() && styles.commentSubmitDisabled
                ]}
                onPress={() => selectedPost && addComment(selectedPost._id || selectedPost.id)}
                disabled={!newComment.trim()}
              >
                <Text style={styles.commentSubmitText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Options Modal */}
      <Modal
        visible={optionsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOptionsModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setOptionsModalVisible(false)}
        >
          <View style={styles.optionsModal}>
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => downloadImage(selectedPostForOptions)}
            >
              <Text style={styles.optionText}>📥 Download Image</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => {
                selectedPostForOptions && sharePost(selectedPostForOptions);
                setOptionsModalVisible(false);
              }}
            >
              <Text style={styles.optionText}>📤 Share Post</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => {
                Alert.alert('Report', 'Post reported successfully.');
                setOptionsModalVisible(false);
              }}
            >
              <Text style={[styles.optionText, styles.reportOption]}>🚨 Report Post</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionButton, styles.cancelButton]}
              onPress={() => setOptionsModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}