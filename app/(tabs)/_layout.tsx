import { useThemeStyles } from "@/hooks/useThemeStyles";
import { Ionicons } from "@expo/vector-icons";
import { NavigationState } from "@react-navigation/native";
import { Tabs, useNavigation, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../context/AuthContext";

// Define proper types for Ionicons names
type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface FriendRequest {
  _id: string;
  requesterId: string;
  recipientId: string;
  status: string;
  createdAt: string;
  requester?: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
}

export default function TabLayout() {
  const { colors } = useThemeStyles();
  const { user, getAuthHeaders } = useAuth();
  const navigation = useNavigation();

  const [unreadCount, setUnreadCount] = useState(0);
  const [friendRequestsCount, setFriendRequestsCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const router = useRouter();

  // Get token from auth headers
  const getToken = async (): Promise<string | null> => {
    try {
      const authHeaders = await getAuthHeaders();
      const headers = authHeaders as Record<string, string>;

      const authKey = Object.keys(headers).find(
        (key) => key.toLowerCase() === "authorization"
      );

      const authHeader = authKey ? headers[authKey] : null;

      if (!authHeader) {
        return null;
      }

      const token = authHeader.replace(/^Bearer\s+/i, "").trim();
      return token || null;
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  };

  // Fetch friend requests count
  const fetchFriendRequestsCount = async () => {
    try {
      const authHeaders = await getAuthHeaders();
      const headers = {
        ...authHeaders,
        "Content-Type": "application/json",
      };

      const response = await fetch("https://serverside-app.onrender.com/friends/requests", {
        method: "GET",
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFriendRequestsCount(data.requests?.length || 0);
        }
      }
    } catch (error) {
      console.error("Error fetching friend requests count:", error);
    }
  };

  // Initialize WebSocket for real-time notifications and friend requests
  useEffect(() => {
    const initializeWebSocket = async () => {
      try {
        const token = await getToken();

        if (!token) {
          console.log("No token available for notifications");
          return;
        }

        // Disconnect existing socket if any
        if (socketRef.current) {
          socketRef.current.disconnect();
        }

        socketRef.current = io("https://serverside-app.onrender.com", {
          auth: { token },
          transports: ["websocket", "polling"],
        });

        socketRef.current.on("connect", () => {
          console.log("✅ Connected to WebSocket in TabLayout");
          socketRef.current?.emit("subscribe_notifications");
          socketRef.current?.emit("get_unread_count");
        });

        // Notification events
        socketRef.current.on("unread_count_updated", (data) => {
          console.log(
            "🔄 Unread count updated in TabLayout:",
            data.unreadCount
          );
          setUnreadCount(data.unreadCount);
        });

        socketRef.current.on("unread_count", (data) => {
          console.log("📊 Initial unread count:", data.unreadCount);
          setUnreadCount(data.unreadCount);
        });

        socketRef.current.on("new_notification", (data) => {
          // When new notification arrives, increment count
          setUnreadCount((prev) => prev + 1);

          // If it's a friend request notification, also update friend requests count
          if (data.notification?.type === "friend_request") {
            setFriendRequestsCount((prev) => prev + 1);
          }
        });

        // Friend request events (we'll simulate these since backend might not have specific events)
        socketRef.current.on("friend_request_received", () => {
          setFriendRequestsCount((prev) => prev + 1);
        });

        socketRef.current.on("friend_request_accepted", () => {
          // Optionally handle when someone accepts your friend request
        });

        socketRef.current.on("friend_request_declined", () => {
          // Optionally handle when someone declines your friend request
        });

        socketRef.current.on("connect_error", (error) => {
          console.error("❌ WebSocket connection error in TabLayout:", error);
        });
      } catch (error) {
        console.error("Error initializing WebSocket in TabLayout:", error);
      }
    };

    initializeWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Fetch initial counts on component mount
  useEffect(() => {
    const fetchInitialCounts = async () => {
      try {
        const authHeaders = await getAuthHeaders();
        const headers = {
          ...authHeaders,
          "Content-Type": "application/json",
        };

        // Fetch unread notifications count
        const notificationsResponse = await fetch(
          "https://serverside-app.onrender.com/notifications/unread-count",
          {
            method: "GET",
            headers,
          }
        );

        if (notificationsResponse.ok) {
          const notificationsData = await notificationsResponse.json();
          if (notificationsData.success) {
            setUnreadCount(notificationsData.unreadCount);
          }
        }

        // Fetch friend requests count
        await fetchFriendRequestsCount();
      } catch (error) {
        console.error("Error fetching initial counts:", error);
      }
    };

    fetchInitialCounts();
  }, []);

  // Listen for navigation events to refresh friend requests count
  useEffect(() => {
    const unsubscribe = navigation.addListener("state", (e) => {
      const state = e.data.state as NavigationState;
      const currentRoute = state.routes[state.index];

      // Check the current route name
      if (
        currentRoute.name === "friends" ||
        currentRoute.name === "notifications"
      ) {
        fetchFriendRequestsCount();
      }
    });

    return unsubscribe;
  }, [navigation]);

  // Custom Notification Icon with Badge
  const NotificationIconWithBadge = ({
    color,
    focused,
  }: {
    color: string;
    focused: boolean;
  }) => (
    <View style={styles.iconContainer}>
      <View style={[
        styles.iconWrapper,
        focused && styles.activeIconWrapper
      ]}>
        <Ionicons
          name={focused ? "notifications" : "notifications-outline"}
          color={focused ? colors.primary : color}
          size={26}
        />
      </View>
      {unreadCount > 0 && (
        <View
          style={[
            styles.badge,
            unreadCount > 9 && styles.badgeLarge,
            unreadCount > 99 && styles.badgeExtraLarge,
          ]}
        >
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      )}
    </View>
  );

  // Custom Friends Icon with Badge
  const FriendsIconWithBadge = ({
    color,
    focused,
  }: {
    color: string;
    focused: boolean;
  }) => (
    <View style={styles.iconContainer}>
      <View style={[
        styles.iconWrapper,
        focused && styles.activeIconWrapper
      ]}>
        <Ionicons
          name={focused ? "people" : "people-outline"}
          color={focused ? colors.primary : color}
          size={26}
        />
      </View>
      {friendRequestsCount > 0 && (
        <View
          style={[
            styles.badge,
            styles.friendsBadge,
            friendRequestsCount > 9 && styles.badgeLarge,
            friendRequestsCount > 99 && styles.badgeExtraLarge,
          ]}
        >
          <Text style={styles.badgeText}>
            {friendRequestsCount > 99 ? "99+" : friendRequestsCount}
          </Text>
        </View>
      )}
    </View>
  );

  // Custom Icon Component for other tabs with proper typing
  const CustomTabIcon = ({ 
    focused, 
    inactiveName, 
    activeName, 
    color 
  }: { 
    focused: boolean; 
    inactiveName: IoniconsName; 
    activeName: IoniconsName; 
    color: string;
  }) => (
    <View style={styles.iconContainer}>
      <View style={[
        styles.iconWrapper,
        focused && styles.activeIconWrapper
      ]}>
        <Ionicons
          name={focused ? activeName : inactiveName}
          color={focused ? colors.primary : color}
          size={26}
        />
      </View>
    </View>
  );

  // Create Post Icon Component
  const CreatePostIcon = ({ 
    color, 
    focused 
  }: { 
    color: string; 
    focused: boolean;
  }) => (
    <View style={styles.iconContainer}>
      <View style={[
        styles.createIconWrapper,
        focused && styles.activeCreateIconWrapper
      ]}>
        <Ionicons
          name={focused ? "add" : "add-outline"}
          color={focused ? "#fff" : colors.text}
          size={28}
        />
      </View>
    </View>
  );

  // Menu Icon Component
  const MenuIcon = ({ 
    color, 
    focused 
  }: { 
    color: string; 
    focused: boolean;
  }) => (
    <View style={styles.iconContainer}>
      <View style={[
        styles.iconWrapper,
        focused && styles.activeIconWrapper
      ]}>
        <Ionicons
          name={focused ? "menu" : "menu-outline"}
          color={focused ? colors.primary : color}
          size={26}
        />
      </View>
    </View>
  );

  // Home Icon Component
  const HomeIcon = ({ 
    color, 
    focused 
  }: { 
    color: string; 
    focused: boolean;
  }) => (
    <View style={styles.iconContainer}>
      <View style={[
        styles.iconWrapper,
        focused && styles.activeIconWrapper
      ]}>
        <Ionicons
          name={focused ? "home" : "home-outline"}
          color={focused ? colors.primary : color}
          size={26}
        />
      </View>
    </View>
  );

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          headerShown: false,
          tabBarShowLabel: true,
          tabBarStyle: {
            height: 70,
            backgroundColor: colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingBottom: 8,
            paddingTop: 8,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: -2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginBottom: 4,
          },
          tabBarItemStyle: {
            paddingVertical: 6,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <HomeIcon color={color} focused={focused} />
            ),
          }}
        />

        <Tabs.Screen
          name="friends"
          options={{
            title: "Friends",
            tabBarIcon: ({ color, focused }) => (
              <FriendsIconWithBadge color={color} focused={focused} />
            ),
          }}
        />

        <Tabs.Screen
          name="create-post"
          options={{
            title: "Create",
            tabBarIcon: ({ color, focused }) => (
              <CreatePostIcon color={color} focused={focused} />
            ),
          }}
        />

        <Tabs.Screen
          name="notifications"
          options={{
            title: "Notifications",
            tabBarIcon: ({ color, focused }) => (
              <NotificationIconWithBadge color={color} focused={focused} />
            ),
          }}
        />

        <Tabs.Screen
          name="menu"
          options={{
            title: "Menu",
            tabBarIcon: ({ color, focused }) => (
              <MenuIcon color={color} focused={focused} />
            ),
          }}
        />

        {/* Hidden screens */}
        <Tabs.Screen
          name="map"
          options={{
            href: null,
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="edit-profile"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="interests"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="create-story"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="chat/[id]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="UserProfileScreen"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    position: "relative",
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  activeIconWrapper: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  createIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  activeCreateIconWrapper: {
    backgroundColor: '#0056CC',
    transform: [{ scale: 1.05 }],
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  friendsBadge: {
    backgroundColor: "#007AFF",
  },
  badgeLarge: {
    minWidth: 24,
    height: 20,
  },
  badgeExtraLarge: {
    minWidth: 28,
    height: 20,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    paddingHorizontal: 4,
  },
});