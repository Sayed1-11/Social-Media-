import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
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

interface Participant {
  _id: string;
  name: string;
  username: string;
  profilePicture?: string;
}

interface LastMessage {
  _id: string;
  content: string;
  senderId: string;
  createdAt: string;
  type: string;
}

interface Conversation {
  _id: string;
  participant: Participant;
  lastMessage?: LastMessage;
  unreadCount: number;
  updatedAt: string;
  createdAt: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
}

// Utility function to remove duplicates
const removeDuplicates = (conversations: Conversation[]): Conversation[] => {
  const seen = new Set();
  return conversations.filter(conv => {
    if (seen.has(conv._id)) {
      console.warn(`Duplicate conversation found: ${conv._id}`);
      return false;
    }
    seen.add(conv._id);
    return true;
  });
};

export default function MessagesScreen() {
  const { colors } = useThemeStyles();
  const { user, getAuthHeaders } = useAuth();
  const router = useRouter();
  const styles = createStyles(colors);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasMore: false,
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // NEW: WebSocket state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newMessageNotification, setNewMessageNotification] = useState<{
    show: boolean;
    conversationId: string;
    message: any;
  } | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Use ref to track conversations for the fetch function without causing re-renders
  const conversationsRef = useRef<Conversation[]>([]);
  
  // Get token from auth headers - Fixed version
  const getToken = useCallback(async (): Promise<string | null> => {
    try {
      const authHeaders = await getAuthHeaders();
      
      // Type assertion to safely access properties
      const headers = authHeaders as Record<string, string>;
      
      // Find authorization header (case insensitive)
      const authKey = Object.keys(headers).find(
        key => key.toLowerCase() === 'authorization'
      );
      
      const authHeader = authKey ? headers[authKey] : null;
      
      if (!authHeader) {
        console.log('No Authorization header found. Available headers:', Object.keys(headers));
        return null;
      }
  
      // Extract token from "Bearer <token>"
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

  // Load token on component mount
  useEffect(() => {
    const loadToken = async () => {
      const extractedToken = await getToken();
      setToken(extractedToken);
    };
    
    loadToken();
  }, [getToken]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // NEW: Initialize WebSocket connection
  useEffect(() => {
    if (!token || !user) {
      console.log('WebSocket: Waiting for token or user...');
      return;
    }

    console.log("Initializing WebSocket connection with token...");
    
    const newSocket = io("http://localhost:3000", {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected successfully');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    // NEW: Listen for new messages
    newSocket.on('new_message', (data) => {
      console.log('New message received via WebSocket:', data);
      
      const { conversationId, message } = data;
      
      // Update conversations list with new message and move to top
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
                type: message.type
              },
              updatedAt: new Date().toISOString(),
              unreadCount: conv.unreadCount + 1
            };
          }
          return conv;
        });

        // Move the updated conversation to the top
        const conversationIndex = updatedConversations.findIndex(conv => conv._id === conversationId);
        if (conversationIndex > 0) {
          const [movedConversation] = updatedConversations.splice(conversationIndex, 1);
          updatedConversations.unshift(movedConversation);
        }

        return updatedConversations;
      });

      // Show popup notification
      setNewMessageNotification({
        show: true,
        conversationId,
        message
      });

      // Auto-hide notification after 3 seconds
      setTimeout(() => {
        setNewMessageNotification(null);
      }, 3000);
    });

    // NEW: Listen for messages read events
    newSocket.on('messages_read', (data) => {
      console.log('Messages read event:', data);
      // You can update UI if needed when messages are read by other participants
    });

    // NEW: Listen for typing events
    newSocket.on('user_typing', (data) => {
      console.log('User typing:', data);
      // Handle typing indicators if needed
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up WebSocket connection');
      newSocket.disconnect();
    };
  }, [token, user]);

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    return conversations.filter(
      (conv) =>
        conv.participant.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        conv.participant.username
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (conv.lastMessage?.content || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  // FIXED: Improved fetchConversations with better lastMessage handling
  const fetchConversations = useCallback(
    async (showRefresh = false, loadMore = false) => {
      try {
        setError(null);

        if (loadMore) {
          setLoadingMore(true);
        } else if (!showRefresh) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const page = loadMore ? pagination.currentPage + 1 : 1;
        const authHeaders = await getAuthHeaders();
        const headers = {
          ...authHeaders,
          "Content-Type": "application/json",
        };

        const response = await fetch(
          `http://localhost:3000/conversations`,
          {
            method: "GET",
            headers,
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch conversations: ${response.status}`);
        }

        const data = await response.json();
        console.log("API Response:", data);
        
        if (data.success) {
          // FIXED: Better handling of conversation data
          const validConversations = (data.conversations || [])
            .filter((conv: any) => {
              // Ensure conversation has participant
              if (!conv.participant || !conv.participant._id) {
                console.warn('Skipping conversation without participant:', conv._id);
                return false;
              }
              return true;
            })
            .map((conv: any) => {
              // Calculate unread count for current user
              const userUnreadCount = conv.unreadCounts?.find(
                (uc: any) => uc.userId === user?.id
              )?.count || 0;

              // FIXED: Improved lastMessage handling
              let lastMessage = undefined;
              
              if (conv.lastMessage && typeof conv.lastMessage === 'object') {
                lastMessage = {
                  _id: conv.lastMessage._id || conv._id + '_msg',
                  content: conv.lastMessage.content || conv.lastMessage || "",
                  senderId: conv.lastMessage.senderId || "",
                  createdAt: conv.lastMessage.createdAt || conv.updatedAt || conv.createdAt || new Date().toISOString(),
                  type: conv.lastMessage.type || "text"
                };
              } else if (typeof conv.lastMessage === 'string') {
                // Handle case where lastMessage is just a string
                lastMessage = {
                  _id: conv._id + '_msg',
                  content: conv.lastMessage,
                  senderId: "",
                  createdAt: conv.updatedAt || conv.createdAt || new Date().toISOString(),
                  type: "text"
                };
              }

              return {
                _id: conv._id,
                participant: {
                  _id: conv.participant._id,
                  name: conv.participant.name || "Unknown User",
                  username: conv.participant.username || "unknown",
                  profilePicture: conv.participant.profilePicture || undefined
                },
                lastMessage: lastMessage,
                unreadCount: userUnreadCount,
                updatedAt: conv.updatedAt || conv.createdAt || new Date().toISOString(),
                createdAt: conv.createdAt || new Date().toISOString()
              };
            });

          console.log("Processed conversations:", validConversations);

          // Remove duplicates based on _id
          const uniqueConversations = removeDuplicates(validConversations);

          // Sort conversations by updatedAt (most recent first)
          const sortedConversations = uniqueConversations.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );

          if (loadMore) {
            // Use ref instead of state to avoid dependency issues
            const currentConversations = conversationsRef.current;
            const existingIds = new Set(currentConversations.map(c => c._id));
            const newConversations = sortedConversations.filter((conv: Conversation) => 
              !existingIds.has(conv._id)
            );
            setConversations((prev) => [...prev, ...newConversations]);
          } else {
            setConversations(sortedConversations);
          }

          setPagination(
            data.pagination || {
              currentPage: page,
              totalPages: 1,
              totalCount: sortedConversations.length,
              hasMore: false,
            }
          );
        } else {
          throw new Error(data.message || "Failed to load conversations");
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
        setError(
          error instanceof Error ? error.message : "Unknown error occurred"
        );
        setRetryCount((prev) => prev + 1);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [getAuthHeaders, pagination.currentPage, user?.id]
  );

  const fetchWithRetry = useCallback(
    async (attempt = 0, isRefresh = false) => {
      try {
        await fetchConversations(isRefresh);
        setRetryCount(0);
      } catch (error) {
        if (attempt < 3) {
          setTimeout(
            () => fetchWithRetry(attempt + 1, isRefresh),
            1000 * Math.pow(2, attempt)
          );
        }
      }
    },
    [fetchConversations]
  );

  const onRefresh = useCallback(() => {
    fetchConversations(true, false);
  }, [fetchConversations]);

  const loadMoreConversations = useCallback(() => {
    if (pagination.hasMore && !loadingMore && !loading) {
      fetchConversations(false, true);
    }
  }, [pagination.hasMore, loadingMore, loading, fetchConversations]);

  // Real-time updates with WebSocket or polling
  useEffect(() => {
    let isMounted = true;
    
    const interval = setInterval(() => {
      if (!loading && !refreshing && isMounted && !isConnected) {
        // Only poll if WebSocket is not connected
        fetchConversations(true, false);
      }
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [loading, refreshing, fetchConversations, isConnected]);

  // Initial fetch
  useEffect(() => {
    let isMounted = true;
    
    if (isMounted) {
      fetchConversations();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const formatTime = (dateString: string) => {
    try {
      if (!dateString) return "";
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else if (diffInHours < 168) {
        return date.toLocaleDateString([], { weekday: "short" });
      } else {
        return date.toLocaleDateString([], { month: "short", day: "numeric" });
      }
    } catch {
      return "";
    }
  };

  // FIXED: Improved last message preview function
  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.lastMessage) {
      return "No messages yet";
    }

    const message = conversation.lastMessage.content;
    
    // Handle different message types
    if (!message) {
      switch (conversation.lastMessage.type) {
        case 'image':
          return '📷 Image';
        case 'video':
          return '🎥 Video';
        case 'file':
          return '📎 File';
        default:
          return 'Message';
      }
    }

    // Check if message exists and is a string before accessing length
    if (typeof message !== 'string') {
      return "Message unavailable";
    }

    // Truncate long messages
    return message.length > 50 ? message.substring(0, 50) + "..." : message;
  };

  const handleConversationPress = (conversation: Conversation) => {
    if (!conversation.participant) {
      console.error("Cannot navigate: Conversation missing participant");
      return;
    }

    // Hide any active notification when navigating to chat
    setNewMessageNotification(null);

    router.push({
      pathname: `/chat/${conversation._id}`,
      params: {
        participantId: conversation.participant._id,
        participantName: conversation.participant.name,
      },
    });
  };

  // NEW: Handle notification press
  const handleNotificationPress = () => {
    if (newMessageNotification) {
      handleConversationPress({
        _id: newMessageNotification.conversationId,
        participant: { 
          _id: newMessageNotification.message.senderId,
          name: newMessageNotification.message.sender?.name || 'User',
          username: newMessageNotification.message.sender?.username || 'user'
        },
        unreadCount: 0,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      } as Conversation);
    }
  };

  // FIXED: Improved conversation render with better fallbacks
  const renderConversation = ({ item, index }: { item: Conversation; index: number }) => {
    const hasLastMessage = item.lastMessage && item.lastMessage._id;
    const lastMessageTime = hasLastMessage ? formatTime(item.lastMessage!.createdAt) : '';
    const messagePreview = getLastMessagePreview(item);

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleConversationPress(item)}
        accessibilityLabel={`Conversation with ${item.participant.name}`}
        accessibilityHint="Opens chat conversation"
        accessibilityRole="button"
      >
        <View style={styles.avatarContainer}>
          {item.participant.profilePicture ? (
            <Image
              source={{ uri: item.participant.profilePicture }}
              style={styles.avatar}
              onError={(e) => {
                console.log("Failed to load avatar for:", item.participant.name);
              }}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {item.participant.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {item.unreadCount > 99 ? "99+" : item.unreadCount}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.participantName} numberOfLines={1}>
              {item.participant.name}
            </Text>
            {hasLastMessage && (
              <Text style={styles.timeText}>
                {lastMessageTime}
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
              {messagePreview}
            </Text>
            {item.unreadCount > 0 && <View style={styles.unreadDot} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.footerLoaderText}>
          Loading more conversations...
        </Text>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
          <Text style={styles.connectionStatus}>
            {token ? (isConnected ? "🟢 Real-time connected" : "🟡 Connecting...") : "🟡 Getting token..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && conversations.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={styles.errorTitle}>Unable to load conversations</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryCountText}>Retry attempt: {retryCount}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchWithRetry(0, false)}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={styles.connectionIndicator}>
            <View style={[
              styles.connectionDot, 
              isConnected ? styles.connected : styles.disconnected
            ]} />
            <Text style={styles.connectionText}>
              {isConnected ? "Live" : "Offline"}
            </Text>
          </View>
        </View>
        {conversations.length > 0 && (
          <Text style={styles.conversationCount}>
            {pagination.totalCount}{" "}
            {pagination.totalCount === 1 ? "conversation" : "conversations"}
          </Text>
        )}
      </View>

      {/* Search Bar */}
      {conversations.length > 0 && (
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
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
      )}

      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item, index) => `${item._id}-${index}`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onEndReached={loadMoreConversations}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="chatbubble-outline"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyStateTitle}>
              {searchQuery
                ? "No matching conversations"
                : "No conversations yet"}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery
                ? "Try adjusting your search terms"
                : "Start a conversation with your friends to see them here"}
            </Text>
            {searchQuery && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => setSearchQuery("")}
              >
                <Text style={styles.clearSearchText}>Clear Search</Text>
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
      />
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
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    headerTitle: {
      color: colors.text,
      fontSize: 24,
      fontWeight: "bold",
    },
    connectionIndicator: {
      flexDirection: "row",
      alignItems: "center",
    },
    connectionDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    connected: {
      backgroundColor: '#4CAF50',
    },
    disconnected: {
      backgroundColor: '#FF9800',
    },
    connectionText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '500',
    },
    connectionStatus: {
      marginTop: 8,
      color: colors.textSecondary,
      fontSize: 12,
    },
    conversationCount: {
      color: colors.textSecondary,
      fontSize: 14,
      marginTop: 4,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchIcon: {
      marginRight: 12,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: 16,
      paddingVertical: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 12,
      color: colors.textSecondary,
      fontSize: 16,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    errorTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "bold",
      marginTop: 16,
      marginBottom: 8,
    },
    errorText: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 12,
    },
    retryCountText: {
      color: colors.textSecondary,
      fontSize: 12,
      marginBottom: 20,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    conversationItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    avatarContainer: {
      position: "relative",
      marginRight: 12,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    avatarPlaceholder: {
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "bold",
    },
    unreadBadge: {
      position: "absolute",
      top: -2,
      right: -2,
      backgroundColor: '#FF3B30',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: colors.background,
    },
    unreadCount: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "bold",
    },
    conversationContent: {
      flex: 1,
    },
    conversationHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    participantName: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
      flex: 1,
      marginRight: 8,
    },
    timeText: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    messagePreview: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    lastMessage: {
      color: colors.textSecondary,
      fontSize: 14,
      flex: 1,
      marginRight: 8,
    },
    unreadMessage: {
      color: colors.text,
      fontWeight: "600",
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 80,
      paddingHorizontal: 40,
    },
    emptyStateTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "bold",
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateText: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: "center",
      lineHeight: 20,
    },
    clearSearchButton: {
      marginTop: 16,
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: colors.primary,
      borderRadius: 8,
    },
    clearSearchText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
    },
    emptyListContainer: {
      flexGrow: 1,
      justifyContent: "center",
    },
    listContainer: {
      flexGrow: 1,
    },
    footerLoader: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 16,
    },
    footerLoaderText: {
      marginLeft: 8,
      color: colors.textSecondary,
      fontSize: 14,
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
    notificationText: {
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
  });