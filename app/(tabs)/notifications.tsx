import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      type: "friend_request",
      user: {
        name: "Sarah Johnson",
        username: "sarahj",
        avatar: null,
      },
      time: "5 min ago",
      read: false,
    },
    {
      id: "2",
      type: "friend_request",
      user: {
        name: "Mike Chen",
        username: "mikecoder",
        avatar: null,
      },
      time: "1 hour ago",
      read: false,
    },
    {
      id: "3",
      type: "like",
      user: {
        name: "Alex Thompson",
        username: "alexthompson",
        avatar: null,
      },
      time: "2 hours ago",
      content: 'liked your post: "Just finished my new project!"',
      read: true,
    },
    {
      id: "4",
      type: "comment",
      user: {
        name: "Emma Wilson",
        username: "emmaw",
        avatar: null,
      },
      time: "3 hours ago",
      content: 'commented on your photo: "Great shot! 📸"',
      read: true,
    },
    {
      id: "5",
      type: "friend_request",
      user: {
        name: "David Kim",
        username: "davidk",
        avatar: null,
      },
      time: "1 day ago",
      read: true,
    },
  ]);

  const handleAcceptRequest = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
    console.log("Accepted friend request:", id);
  };

  const handleDeclineRequest = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
    console.log("Declined friend request:", id);
  };

  const renderNotification = (notification: any) => {
    const getIcon = () => {
      switch (notification.type) {
        case "friend_request":
          return "person-add-outline";
        case "like":
          return "heart-outline";
        case "comment":
          return "chatbubble-outline";
        default:
          return "notifications-outline";
      }
    };

    const getIconColor = () => {
      switch (notification.type) {
        case "friend_request":
          return "#4CAF50";
        case "like":
          return "#ff375f";
        case "comment":
          return "#2196F3";
        default:
          return "#666";
      }
    };

    return (
      <View
        key={notification.id}
        style={[
          styles.notificationItem,
          !notification.read && styles.unreadNotification,
        ]}
      >
        <View style={styles.notificationLeft}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${getIconColor()}20` },
            ]}
          >
            <Ionicons
              name={getIcon() as any}
              size={20}
              color={getIconColor()}
            />
          </View>

          <View style={styles.notificationContent}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{notification.user.name}</Text>
              <Text style={styles.username}>@{notification.user.username}</Text>
            </View>{" "}
            {/* This closes userInfo View */}
            {notification.content && (
              <Text style={styles.notificationText}>
                {notification.content}
              </Text>
            )}
            <Text style={styles.timeText}>{notification.time}</Text>
          </View>
        </View>

        {notification.type === "friend_request" && (
          <View style={styles.requestActions}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleAcceptRequest(notification.id)}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={() => handleDeclineRequest(notification.id)}
            >
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const friendRequests = notifications.filter(
    (n) => n.type === "friend_request"
  );
  const otherNotifications = notifications.filter(
    (n) => n.type !== "friend_request"
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Friend Requests Section */}
        {friendRequests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Friend Requests</Text>
              <Text style={styles.sectionCount}>{friendRequests.length}</Text>
            </View>
            <View style={styles.sectionContent}>
              {friendRequests.map(renderNotification)}
            </View>
          </View>
        )}

        {/* Other Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Earlier</Text>
          </View>
          <View style={styles.sectionContent}>
            {otherNotifications.map(renderNotification)}
          </View>
        </View>

        {notifications.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color="#666" />
            <Text style={styles.emptyStateTitle}>No notifications</Text>
            <Text style={styles.emptyStateText}>
              When you get notifications, they'll appear here
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  sectionCount: {
    color: "#ff375f",
    fontSize: 14,
    fontWeight: "600",
  },
  sectionContent: {
    backgroundColor: "#111111",
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1a1a1a",
    overflow: "hidden",
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  unreadNotification: {
    backgroundColor: "rgba(255, 55, 95, 0.05)",
  },
  notificationLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  username: {
    color: "#666",
    fontSize: 14,
  },
  notificationText: {
    color: "#ccc",
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  timeText: {
    color: "#666",
    fontSize: 12,
  },
  requestActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  declineButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#666",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
