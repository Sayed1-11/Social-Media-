import { useThemeStyles } from '@/hooks/useThemeStyles';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face';

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
  shares: number;
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
  userId?: string;
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

// API Configuration
const API_BASE_URL = 'http://localhost:3000';

// Updated Styles with message icon and notification badge
const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  messageIcon: {
    padding: 8,
    marginLeft: 8,
    position: 'relative',
  },
  // NEW: Notification badge styles
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  notificationText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // NEW: Popup notification styles
  popupNotification: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  notificationTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  notificationName: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
  },
  notificationMessage: {
    color: "white",
    fontSize: 12,
    opacity: 0.9,
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
  const { getAuthHeaders, isAuthenticated, user } = useAuth();
  const router = useRouter();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // NEW: Message notification state
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [newMessageNotification, setNewMessageNotification] = useState<{
    show: boolean;
    conversationId: string;
    message: any;
  } | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const { colors } = useThemeStyles();
  const styles = createStyles(colors);

  // Helper function to format time
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // NEW: Get token from auth headers
  const getToken = useCallback(async (): Promise<string | null> => {
    try {
      const authHeaders = await getAuthHeaders();
      const headers = authHeaders as Record<string, string>;
      
      const authKey = Object.keys(headers).find(
        key => key.toLowerCase() === 'authorization'
      );
      
      const authHeader = authKey ? headers[authKey] : null;
      
      if (!authHeader) {
        console.log('No Authorization header found');
        return null;
      }
  
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      
      if (!token) {
        console.log('Empty token found in Authorization header');
        return null;
      }
      
      console.log('✅ Token extracted successfully');
      return token;
    } catch (error) {
      console.error('❌ Error getting token from auth headers:', error);
      return null;
    }
  }, [getAuthHeaders]);

  // NEW: Calculate total unread messages from conversations
  const fetchUnreadMessageCount = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/conversations`, {
        credentials: 'include',
        headers: headers
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Calculate total unread count from all conversations
          const totalUnread = data.conversations.reduce((total: number, conv: any) => {
            return total + (conv.unreadCount || 0);
          }, 0);
          
          setUnreadMessageCount(totalUnread);
        }
      }
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    }
  };

  // NEW: Initialize WebSocket for real-time notifications
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const initializeWebSocket = async () => {
      const token = await getToken();
      if (!token) return;

      console.log("Initializing WebSocket connection for HomeScreen...");
      
      const newSocket = io("http://localhost:3000", {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('HomeScreen WebSocket connected successfully');
      });

      newSocket.on('disconnect', () => {
        console.log('HomeScreen WebSocket disconnected');
      });

      newSocket.on('connect_error', (error) => {
        console.error('HomeScreen WebSocket connection error:', error);
      });

      // Listen for new messages to update notification count
      newSocket.on('new_message', (data) => {
        console.log('New message received in HomeScreen:', data);
        
        // Increment unread count
        setUnreadMessageCount(prev => prev + 1);
        
        // Show popup notification
        setNewMessageNotification({
          show: true,
          conversationId: data.conversationId,
          message: data.message
        });

        // Auto-hide notification after 3 seconds
        setTimeout(() => {
          setNewMessageNotification(null);
        }, 3000);
      });

      // Listen for messages read events to update count
      newSocket.on('messages_read', (data) => {
        console.log('Messages read event in HomeScreen:', data);
        // Refresh unread count when messages are read
        fetchUnreadMessageCount();
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    };

    initializeWebSocket();
  }, [isAuthenticated, user, getToken]);

  // NEW: Handle notification press
  const handleNotificationPress = () => {
    if (newMessageNotification) {
      // Navigate to messages screen
      setNewMessageNotification(null);
      setUnreadMessageCount(0);
      router.push('/(tabs)/messages');
    }
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
  const fetchPosts = useCallback(async () => {
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
          userId: post.userId,
          username: post.user?.name?.toLowerCase().replace(/\s+/g, '') || 'user',
          name: post.user?.name || 'User',
          content: post.content,
          likes: post.likes.length,
          comments: post.comments.length,
          time: getTimeAgo(post.createdAt),
          userImage: post.user?.profilePicture || DEFAULT_AVATAR,
          image: post.image,
          isLiked: post.likes.some(like => like.userId === user?.id),
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
  }, [isAuthenticated, user?.id]);

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

  // NEW: Set up message polling and initial fetch
  useEffect(() => {
    if (!isAuthenticated) return;

    // Initial fetch
    fetchUnreadMessageCount();

    // Poll for new messages every 30 seconds
    const messageInterval = setInterval(() => {
      fetchUnreadMessageCount();
    }, 30000);

    return () => clearInterval(messageInterval);
  }, [isAuthenticated]);

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
  }, [isAuthenticated, fetchPosts]);

  // Listen for refresh events
  useFocusEffect(
    useCallback(() => {
      // This will run when the screen comes into focus
      console.log('Home screen focused - refreshing data...');
      fetchPosts();
      fetchStories();
      if (isAuthenticated) {
        fetchUnreadMessageCount();
      }
    }, [fetchPosts, isAuthenticated])
  );

  // Fixed Like/Unlike Post
  const likePost = async (postId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
        method: "POST",
        headers: headers as HeadersInit,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local state
        setPosts(prevPosts =>
          prevPosts.map(post => {
            if (post._id === postId) {
              const hasLiked = post.isLiked;
              return {
                ...post,
                likes: hasLiked ? post.likes - 1 : post.likes + 1,
                isLiked: !hasLiked
              };
            }
            return post;
          })
        );
      } else {
        throw new Error(data.message || "Failed to like post");
      }
    } catch (error) {
      console.error("Error liking post:", error);
      Alert.alert("Error", "Failed to like post");
    }
  };

  // Fixed Comment on Post
  const addComment = async (postId: string) => {
    if (!newComment.trim()) {
      Alert.alert("Error", "Please enter a comment");
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/comment`, {
        method: "POST",
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        } as HeadersInit,
        body: JSON.stringify({ content: newComment })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local state with the returned comment data
        setPosts(prevPosts =>
          prevPosts.map(post => {
            if (post._id === postId) {
              return {
                ...post,
                comments: post.comments + 1,
                commentsList: [
                  ...post.commentsList,
                  {
                    id: data.comment._id,
                    username: data.comment.user?.name?.toLowerCase().replace(/\s+/g, '') || 'user',
                    name: data.comment.user?.name || 'You',
                    comment: data.comment.content,
                    time: 'Just now'
                  }
                ]
              };
            }
            return post;
          })
        );
        setNewComment('');
        setCommentModalVisible(false);
        Alert.alert("Success", "Comment added successfully");
      } else {
        throw new Error(data.message || "Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Error", "Failed to add comment");
    }
  };

  // Fixed Share Post
  const sharePost = async (post: Post) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/posts/${post._id}/share`, {
        method: "POST",
        headers: headers as HeadersInit,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local state
        setPosts(prevPosts =>
          prevPosts.map(p => {
            if (p._id === post._id) {
              return {
                ...p,
                shares: p.shares + 1
              };
            }
            return p;
          })
        );
        Alert.alert("Success", "Post shared successfully");
      } else {
        throw new Error(data.message || "Failed to share post");
      }
    } catch (error) {
      console.error("Error sharing post:", error);
      
      // Fallback: Copy post link to clipboard
      const postLink = `https://socialapp.com/post/${post.id}`;
      if (Platform.OS === 'web') {
        navigator.clipboard.writeText(postLink);
        Alert.alert('Link Copied!', 'Post link has been copied to clipboard.');
      } else {
        try {
          await Sharing.shareAsync(postLink);
        } catch (shareError) {
          Clipboard.setStringAsync(postLink);
          Alert.alert('Link Copied!', 'Post link has been copied to clipboard.');
        }
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

  // NEW: Navigate to messages screen and clear notifications
  const navigateToMessages = () => {
    // Clear the badge when user goes to messages
    setUnreadMessageCount(0);
    setNewMessageNotification(null);
    router.push('/(tabs)/messages');
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

        <TouchableOpacity 
          style={styles.action}
          onPress={() => sharePost(item)}
        >
            <Ionicons name="share-outline" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* NEW: Message Notification Popup */}
      {newMessageNotification?.show && (
        <TouchableOpacity 
          style={styles.popupNotification}
          onPress={handleNotificationPress}
        >
          <View style={styles.notificationContent}>
            <Image 
              source={{ 
                uri: newMessageNotification.message.sender?.profilePicture || 
                'https://via.placeholder.com/40x40/007AFF/FFFFFF?text=U'
              }}
              style={styles.notificationAvatar}
            />
            <View style={styles.notificationTextContainer}>
              <Text style={styles.notificationName}>
                {newMessageNotification.message.sender?.name || 'User'}
              </Text>
              <Text style={styles.notificationMessage} numberOfLines={1}>
                {newMessageNotification.message.content}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setNewMessageNotification(null)}>
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* Updated Header with Message Icon and Notification Badge */}
      <View style={styles.appHeader}>
        <Text style={styles.appTitle}>SmartConnect</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            style={styles.messageIcon}
            onPress={navigateToMessages}
          >
            <Ionicons name="chatbubble-outline" size={24} color={colors.text} />
            {/* Notification Badge */}
            {unreadMessageCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>
                  {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View style={styles.storiesSection}>
            <FlatList
              data={stories}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.storyContainer}>
                  <View style={[
                    styles.storyCircle,
                    item.hasNewStory ? styles.hasNewStory : styles.seenStory,
                  ]}>
                    <Image 
                      source={{ uri: item.avatar }} 
                      style={styles.storyImage}
                    />
                    {item.isUser && (
                      <TouchableOpacity style={styles.addStoryButton}>
                        <Text style={styles.addStoryText}>+</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.storyUsername} numberOfLines={1}>
                    {item.isUser ? 'Your Story' : item.name}
                  </Text>
                </TouchableOpacity>
              )}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storiesList}
            />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={fetchPosts}
      />
      
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