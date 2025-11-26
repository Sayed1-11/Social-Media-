import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { io, Socket } from "socket.io-client";
import { useThemeStyles } from "../../hooks/useThemeStyles";
import { useAuth } from "../context/AuthContext";

interface User {
  _id: string;
  name: string;
  username: string;
  profilePicture?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

interface Conversation {
  _id: string;
  participant: User;
  lastMessage?: {
    _id: string;
    content: string;
    senderId: string;
    createdAt: string;
    type: string;
  };
  unreadCount: number;
  updatedAt: string;
  createdAt: string;
}

// Error Boundary Component
class ConversationErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Conversation Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorFallbackStyles.container}>
          <Ionicons name="warning-outline" size={48} color="#FF6B35" />
          <Text style={errorFallbackStyles.text}>Something went wrong</Text>
          <TouchableOpacity 
            style={errorFallbackStyles.retryButton}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={errorFallbackStyles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const errorFallbackStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  text: {
    fontSize: 16,
    color: '#1A1A1A',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Optimized Socket Manager
const useSocketManager = (token: string | null, user: any) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token || !user) return;

    // Prevent duplicate connections
    if (socketRef.current?.connected) {
      return;
    }

    console.log("🔄 Initializing WebSocket connection...");
    
    const newSocket = io("https://serverside-app.onrender.com", {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    const handleConnect = () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
    };

    const handleDisconnect = (reason: string) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
    };

    const handleConnectError = (error: Error) => {
      console.error('❌ WebSocket connection error:', error);
      setIsConnected(false);
    };

    newSocket.on('connect', handleConnect);
    newSocket.on('disconnect', handleDisconnect);
    newSocket.on('connect_error', handleConnectError);

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      console.log('🧹 Cleaning up WebSocket');
      newSocket.off('connect', handleConnect);
      newSocket.off('disconnect', handleDisconnect);
      newSocket.off('connect_error', handleConnectError);
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [token, user]);

  return { socket, isConnected };
};

// Debounce hook for search
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function MessagesScreen() {
  const { colors } = useThemeStyles();
  const { user, getAuthHeaders } = useAuth();
  const router = useRouter();
  const styles = createStyles(colors);

  // Core states
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Modal states
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchingFriends, setSearchingFriends] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<User[]>([]);

  // Token state
  const [token, setToken] = useState<string | null>(null);

  // Notification state
  const [newMessageNotification, setNewMessageNotification] = useState<{
    show: boolean;
    conversationId: string;
    message: any;
  } | null>(null);

  // Animations
  const modalAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(500)).current;

  // Refs for stability
  const conversationsRef = useRef<Conversation[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Socket management
  const { socket, isConnected } = useSocketManager(token, user);

  // Get token safely
  const getToken = useCallback(async () => {
    try {
      const authHeaders = await getAuthHeaders();
      const headers = authHeaders as Record<string, string>;
      const authKey = Object.keys(headers).find(
        key => key.toLowerCase() === 'authorization'
      );
      const authHeader = authKey ? headers[authKey] : null;
      
      return authHeader?.replace(/^Bearer\s+/i, '').trim() || null;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }, [getAuthHeaders]);

  // Load token
  useEffect(() => {
    const loadToken = async () => {
      const extractedToken = await getToken();
      setToken(extractedToken);
    };
    
    loadToken();
  }, [getToken]);

  // Update conversations ref
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Handle new messages via WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: any) => {
      try {
        const { conversationId, message } = data;
        
        setConversations(prev => {
          const updatedConversations = prev.map(conv => {
            if (conv._id === conversationId) {
              return {
                ...conv,
                lastMessage: {
                  _id: message._id,
                  content: message.content,
                  senderId: message.senderId,
                  createdAt: message.createdAt,
                  type: message.type || "text"
                },
                updatedAt: new Date().toISOString(),
                unreadCount: conv.unreadCount + 1
              };
            }
            return conv;
          });

          // Move updated conversation to top
          const conversationIndex = updatedConversations.findIndex(conv => conv._id === conversationId);
          if (conversationIndex > 0) {
            const [movedConversation] = updatedConversations.splice(conversationIndex, 1);
            updatedConversations.unshift(movedConversation);
          }

          return updatedConversations;
        });

        // Show notification
        setNewMessageNotification({
          show: true,
          conversationId,
          message
        });
      } catch (error) {
        console.error('Error handling new message:', error);
      }
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket]);

  // Auto-hide notification
  useEffect(() => {
    if (newMessageNotification?.show) {
      const timer = setTimeout(() => {
        setNewMessageNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [newMessageNotification]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // Refresh when app becomes active
        fetchConversations(true);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  // Fetch conversations with error handling
  const fetchConversations = useCallback(async (showRefresh = false) => {
    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setError(null);
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const authHeaders = await getAuthHeaders();
      
      const response = await fetch(
        `https://serverside-app.onrender.com/conversations`,
        {
          method: "GET",
          headers: {
            ...authHeaders,
            "Content-Type": "application/json",
          },
          signal: abortController.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load conversations: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const validConversations: Conversation[] = (data.conversations || [])
          .filter((conv: any) => conv.participant && conv.participant._id)
          .map((conv: any) => {
            const userUnreadCount = conv.unreadCounts?.find(
              (uc: any) => uc.userId === user?.id
            )?.count || 0;

            let lastMessage = undefined;
            
            if (conv.lastMessage && typeof conv.lastMessage === 'object') {
              lastMessage = {
                _id: conv.lastMessage._id || conv._id + '_msg',
                content: conv.lastMessage.content || "",
                senderId: conv.lastMessage.senderId || "",
                createdAt: conv.lastMessage.createdAt || conv.updatedAt,
                type: conv.lastMessage.type || "text"
              };
            }

            return {
              _id: conv._id,
              participant: {
                _id: conv.participant._id,
                name: conv.participant.name || "Unknown User",
                username: conv.participant.username || "unknown",
                profilePicture: conv.participant.profilePicture,
                isOnline: conv.participant.isOnline || false
              },
              lastMessage,
              unreadCount: userUnreadCount,
              updatedAt: conv.updatedAt || conv.createdAt,
              createdAt: conv.createdAt
            };
          });

        // Remove duplicates using Map
        const uniqueConversations = Array.from(
          new Map(validConversations.map(conv => [conv._id, conv])).values()
        );

        // Sort by date with proper typing
        const sortedConversations = uniqueConversations.sort((a: Conversation, b: Conversation) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        setConversations(sortedConversations);
      } else {
        throw new Error(data.message || "Failed to load conversations");
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
        return;
      }
      console.error("Error fetching conversations:", error);
      setError(error.message || "Unknown error occurred");
    } finally {
      setLoading(false);
      setRefreshing(false);
      abortControllerRef.current = null;
    }
  }, [getAuthHeaders, user?.id]);

  // Search friends with debouncing
  const searchFriends = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchingFriends(true);
      const authHeaders = await getAuthHeaders();
      
      const response = await fetch(
        `https://serverside-app.onrender.com/users/search/${encodeURIComponent(query)}`,
        {
          method: "GET",
          headers: {
            ...authHeaders,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      
      if (data.success) {
        const filteredResults = (data.users || []).filter(
          (userResult: User) => 
            userResult._id !== user?.id && 
            !selectedFriends.some(selected => selected._id === userResult._id)
        );
        setSearchResults(filteredResults);
      }
    } catch (error) {
      console.error('Error searching friends:', error);
      setSearchResults([]);
    } finally {
      setSearchingFriends(false);
    }
  }, [getAuthHeaders, user?.id, selectedFriends]);

  // Debounced friend search
  useEffect(() => {
    if (friendSearchQuery.trim()) {
      searchFriends(friendSearchQuery);
    } else {
      setSearchResults([]);
    }
  }, [friendSearchQuery, searchFriends]);

  // Friend selection handlers
  const handleSelectFriend = useCallback((friend: User) => {
    setSelectedFriends(prev => [...prev, friend]);
    setFriendSearchQuery("");
    setSearchResults([]);
  }, []);

  const handleRemoveFriend = useCallback((friendId: string) => {
    setSelectedFriends(prev => prev.filter(friend => friend._id !== friendId));
  }, []);

  // Start new conversation
  const startNewConversation = async () => {
    if (selectedFriends.length === 0) return;

    try {
      const authHeaders = await getAuthHeaders();
      const participantId = selectedFriends[0]._id;
      
      const response = await fetch(
        `https://serverside-app.onrender.com/conversations`,
        {
          method: "POST",
          headers: {
            ...authHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ participantId }),
        }
      );

      if (!response.ok) throw new Error('Failed to create conversation');

      const data = await response.json();
      
      if (data.success) {
        closeNewMessageModal();
        router.push({
          pathname: `/chat/${data.conversation._id}`,
          params: {
            participantId,
            participantName: selectedFriends[0].name,
          },
        });
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      Alert.alert('Error', 'Failed to start conversation. Please try again.');
    }
  };

  // Modal animations
  const openNewMessageModal = () => {
    setShowNewMessageModal(true);
    setSelectedFriends([]);
    setFriendSearchQuery("");
    setSearchResults([]);
    
    Animated.parallel([
      Animated.timing(modalAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeNewMessageModal = () => {
    Animated.parallel([
      Animated.timing(modalAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: 500,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowNewMessageModal(false);
    });
  };

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return conversations;

    const query = debouncedSearchQuery.toLowerCase();
    return conversations.filter(
      (conv) =>
        conv.participant.name.toLowerCase().includes(query) ||
        conv.participant.username.toLowerCase().includes(query) ||
        (conv.lastMessage?.content || '').toLowerCase().includes(query)
    );
  }, [conversations, debouncedSearchQuery]);

  // Refresh handler
  const onRefresh = useCallback(() => {
    fetchConversations(true);
  }, [fetchConversations]);

  // Format time
  const formatTime = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      } else if (diffInHours < 168) {
        return date.toLocaleDateString([], { weekday: "short" });
      } else {
        return date.toLocaleDateString([], { month: "short", day: "numeric" });
      }
    } catch {
      return "";
    }
  }, []);

  // Get message preview
  const getLastMessagePreview = useCallback((conversation: Conversation) => {
    if (!conversation.lastMessage) {
      return "No messages yet";
    }

    const message = conversation.lastMessage.content;
    
    if (!message) {
      switch (conversation.lastMessage.type) {
        case 'image': return '📷 Image';
        case 'video': return '🎥 Video';
        case 'file': return '📎 File';
        default: return 'Message';
      }
    }

    return message.length > 50 ? message.substring(0, 50) + "..." : message;
  }, []);

  // Conversation press handler
  const handleConversationPress = useCallback((conversation: Conversation) => {
    setNewMessageNotification(null);
    router.push({
      pathname: `/chat/${conversation._id}`,
      params: {
        participantId: conversation.participant._id,
        participantName: conversation.participant.name,
      },
    });
  }, [router]);

  // Notification press handler
  const handleNotificationPress = useCallback(() => {
    if (newMessageNotification) {
      const conversation = conversations.find(c => c._id === newMessageNotification.conversationId);
      if (conversation) {
        handleConversationPress(conversation);
      }
    }
  }, [newMessageNotification, conversations, handleConversationPress]);

  // Optimized conversation renderer
  const renderConversation = useCallback(({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleConversationPress(item)}
    >
      <View style={styles.avatarContainer}>
        {item.participant.profilePicture ? (
          <Image
            source={{ uri: item.participant.profilePicture }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {item.participant.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {item.participant.isOnline && (
          <View style={styles.onlineIndicator} />
        )}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.participantName} numberOfLines={1}>
            {item.participant.name}
          </Text>
          {item.lastMessage && (
            <Text style={styles.timeText}>
              {formatTime(item.lastMessage.createdAt)}
            </Text>
          )}
        </View>

        <View style={styles.messagePreview}>
          <Text
            style={[
              styles.lastMessage,
              item.unreadCount > 0 && styles.unreadMessage,
            ]}
            numberOfLines={1}
          >
            {getLastMessagePreview(item)}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {item.unreadCount > 99 ? "99+" : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  ), [handleConversationPress, formatTime, getLastMessagePreview, styles]);

  // Render search result
  const renderSearchResult = useCallback(({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => handleSelectFriend(item)}
    >
      <View style={styles.avatarContainer}>
        {item.profilePicture ? (
          <Image
            source={{ uri: item.profilePicture }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {item.isOnline && <View style={styles.onlineIndicator} />}
      </View>
      <View style={styles.searchResultInfo}>
        <Text style={styles.searchResultName}>{item.name}</Text>
        <Text style={styles.searchResultUsername}>@{item.username}</Text>
      </View>
      <Ionicons name="add-circle" size={24} color={colors.primary} />
    </TouchableOpacity>
  ), [handleSelectFriend, colors.primary, styles]);

  // Render selected friend
  const renderSelectedFriend = useCallback((friend: User) => (
    <View key={friend._id} style={styles.selectedFriend}>
      <View style={styles.selectedFriendAvatar}>
        {friend.profilePicture ? (
          <Image
            source={{ uri: friend.profilePicture }}
            style={styles.smallAvatar}
          />
        ) : (
          <View style={[styles.smallAvatar, styles.avatarPlaceholder]}>
            <Text style={styles.smallAvatarText}>
              {friend.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.selectedFriendName} numberOfLines={1}>
        {friend.name}
      </Text>
      <TouchableOpacity
        onPress={() => handleRemoveFriend(friend._id)}
        style={styles.removeFriendButton}
      >
        <Ionicons name="close" size={16} color={colors.text} />
      </TouchableOpacity>
    </View>
  ), [handleRemoveFriend, colors.text, styles]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, []);

  return (
    <ConversationErrorBoundary>
      <SafeAreaView style={styles.container}>
      
      

        {/* Message Notification */}
        {newMessageNotification?.show && (
          <TouchableOpacity 
            style={styles.popupNotification}
            onPress={handleNotificationPress}
          >
            <View style={styles.notificationContent}>
              <View style={styles.notificationAvatar}>
                <Text style={styles.notificationAvatarText}>
                  {newMessageNotification.message.sender?.name?.charAt(0) || 'U'}
                </Text>
              </View>
              <View style={styles.notificationText}>
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

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Messages</Text>
            <TouchableOpacity 
              style={styles.newMessageButton}
              onPress={openNewMessageModal}
            >
              <Ionicons name="create-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Loading State */}
        {loading && !refreshing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading conversations...</Text>
          </View>
        )}

        {/* Error State */}
        {error && conversations.length === 0 && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.errorTitle}>Unable to load conversations</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => fetchConversations()}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Conversations List */}
        {!loading && (
          <FlatList
            data={filteredConversations}
            renderItem={renderConversation}
            keyExtractor={(item) => item._id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons
                  name="chatbubble-outline"
                  size={64}
                  color={colors.textSecondary}
                />
                <Text style={styles.emptyStateTitle}>
                  {searchQuery ? "No matching conversations" : "No messages yet"}
                </Text>
                <Text style={styles.emptyStateText}>
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "Start a conversation to see messages here"}
                </Text>
                {!searchQuery && (
                  <TouchableOpacity
                    style={styles.startChatButton}
                    onPress={openNewMessageModal}
                  >
                    <Text style={styles.startChatText}>Start a Chat</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              filteredConversations.length === 0
                ? styles.emptyListContainer
                : styles.listContainer
            }
            initialNumToRender={12}
            maxToRenderPerBatch={8}
            windowSize={7}
            removeClippedSubviews={true}
          />
        )}

        {/* New Message Modal */}
        <Modal
          visible={showNewMessageModal}
          animationType="none"
          transparent={true}
          statusBarTranslucent
        >
          <Animated.View 
            style={[
              styles.modalOverlay,
              { opacity: modalAnimation }
            ]}
          >
            <Animated.View 
              style={[
                styles.modalContent,
                { transform: [{ translateY: slideAnimation }] }
              ]}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={closeNewMessageModal}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>New Message</Text>
                <TouchableOpacity 
                  onPress={startNewConversation}
                  disabled={selectedFriends.length === 0}
                  style={[
                    styles.nextButton,
                    selectedFriends.length === 0 && styles.nextButtonDisabled
                  ]}
                >
                  <Text style={[
                    styles.nextButtonText,
                    selectedFriends.length === 0 && styles.nextButtonTextDisabled
                  ]}>
                    Next
                  </Text>
                </TouchableOpacity>
              </View>

              {selectedFriends.length > 0 && (
                <View style={styles.selectedFriendsContainer}>
                  <Text style={styles.selectedFriendsLabel}>To:</Text>
                  <View style={styles.selectedFriendsList}>
                    {selectedFriends.map(renderSelectedFriend)}
                  </View>
                </View>
              )}

              <View style={styles.modalSearchContainer}>
                <Ionicons
                  name="search"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.modalSearchIcon}
                />
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="Search friends..."
                  placeholderTextColor={colors.textSecondary}
                  value={friendSearchQuery}
                  onChangeText={setFriendSearchQuery}
                  autoFocus
                />
                {searchingFriends && (
                  <ActivityIndicator size="small" color={colors.primary} />
                )}
              </View>

              {friendSearchQuery.length > 0 && (
                <FlatList
                  data={searchResults}
                  renderItem={renderSearchResult}
                  keyExtractor={(item) => item._id}
                  style={styles.searchResultsList}
                  keyboardShouldPersistTaps="handled"
                  ListEmptyComponent={
                    searchingFriends ? (
                      <View style={styles.searchLoading}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={styles.searchLoadingText}>Searching...</Text>
                      </View>
                    ) : (
                      <View style={styles.noResults}>
                        <Text style={styles.noResultsText}>No friends found</Text>
                      </View>
                    )
                  }
                />
              )}
            </Animated.View>
          </Animated.View>
        </Modal>
      </SafeAreaView>
    </ConversationErrorBoundary>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    connectionStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 8,
      backgroundColor: '#F8F9FA',
    },
    connectionDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    connectionText: {
      fontSize: 12,
      color: '#6C757D',
      fontWeight: '500',
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: '#FFFFFF',
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#1A1A1A',
    },
    newMessageButton: {
      padding: 8,
    },
    conversationCount: {
      fontSize: 14,
      color: '#6C757D',
      marginTop: 4,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#E9ECEF',
    },
    searchIcon: {
      marginRight: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: '#1A1A1A',
      paddingVertical: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
    },
    loadingText: {
      fontSize: 16,
      color: '#6C757D',
      marginTop: 12,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: '#FFFFFF',
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#1A1A1A',
      marginTop: 16,
      marginBottom: 8,
    },
    errorText: {
      fontSize: 14,
      color: '#6C757D',
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },
    retryButton: {
      backgroundColor: '#007AFF',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    listContainer: {
      paddingVertical: 8,
    },
    emptyListContainer: {
      flexGrow: 1,
    },
    conversationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: '#FFFFFF',
    },
    avatarContainer: {
      position: 'relative',
      marginRight: 16,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
    },
    avatarPlaceholder: {
      backgroundColor: '#007AFF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: 'bold',
    },
    onlineIndicator: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 14,
      height: 14,
      backgroundColor: '#4CAF50',
      borderWidth: 2,
      borderColor: '#FFFFFF',
      borderRadius: 7,
    },
    conversationContent: {
      flex: 1,
    },
    conversationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    participantName: {
      fontSize: 17,
      fontWeight: '600',
      color: '#1A1A1A',
      flex: 1,
    },
    timeText: {
      fontSize: 13,
      color: '#6C757D',
    },
    messagePreview: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    lastMessage: {
      fontSize: 15,
      color: '#6C757D',
      flex: 1,
    },
    unreadMessage: {
      color: '#1A1A1A',
      fontWeight: '500',
    },
    unreadBadge: {
      backgroundColor: '#FF3B30',
      borderRadius: 12,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
    unreadCount: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: 'bold',
      paddingHorizontal: 6,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
      paddingVertical: 80,
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#1A1A1A',
      marginTop: 16,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyStateText: {
      fontSize: 14,
      color: '#6C757D',
      textAlign: 'center',
      lineHeight: 20,
    },
    startChatButton: {
      marginTop: 20,
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: '#007AFF',
      borderRadius: 20,
    },
    startChatText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    popupNotification: {
      position: 'absolute',
      top: 60,
      left: 20,
      right: 20,
      backgroundColor: '#007AFF',
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 1000,
    },
    notificationContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    notificationAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    notificationAvatarText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    notificationText: {
      flex: 1,
      marginRight: 12,
    },
    notificationName: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 2,
    },
    notificationMessage: {
      color: '#FFFFFF',
      fontSize: 13,
      opacity: 0.9,
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E9ECEF',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#1A1A1A',
    },
    nextButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    nextButtonDisabled: {
      opacity: 0.5,
    },
    nextButtonText: {
      color: '#007AFF',
      fontSize: 16,
      fontWeight: '600',
    },
    nextButtonTextDisabled: {
      color: '#6C757D',
    },
    selectedFriendsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#E9ECEF',
    },
    selectedFriendsLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1A1A1A',
      marginRight: 12,
    },
    selectedFriendsList: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    selectedFriend: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F8F9FA',
      borderRadius: 16,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginRight: 8,
      marginBottom: 4,
    },
    selectedFriendAvatar: {
      marginRight: 6,
    },
    smallAvatar: {
      width: 20,
      height: 20,
      borderRadius: 10,
    },
    smallAvatarText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: 'bold',
    },
    selectedFriendName: {
      fontSize: 14,
      color: '#1A1A1A',
      marginRight: 4,
      maxWidth: 100,
    },
    removeFriendButton: {
      padding: 2,
    },
    modalSearchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E9ECEF',
    },
    modalSearchIcon: {
      marginRight: 12,
    },
    modalSearchInput: {
      flex: 1,
      fontSize: 16,
      color: '#1A1A1A',
      paddingVertical: 8,
    },
    searchResultsList: {
      maxHeight: 300,
    },
    searchResultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#E9ECEF',
    },
    searchResultInfo: {
      flex: 1,
      marginLeft: 12,
    },
    searchResultName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1A1A1A',
    },
    searchResultUsername: {
      fontSize: 14,
      color: '#6C757D',
    },
    searchLoading: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    searchLoadingText: {
      fontSize: 14,
      color: '#6C757D',
      marginLeft: 8,
    },
    noResults: {
      padding: 20,
      alignItems: 'center',
    },
    noResultsText: {
      fontSize: 14,
      color: '#6C757D',
    },
  });