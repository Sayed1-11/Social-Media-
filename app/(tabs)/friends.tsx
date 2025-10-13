import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function FriendsScreen() {
  const [activeTab, setActiveTab] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for friend requests with images
  const [friendRequests, setFriendRequests] = useState([
    {
      id: '1',
      name: 'Sarah Johnson',
      username: 'sarahj',
      mutualFriends: 4,
      time: '5 min ago',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    },
    {
      id: '2',
      name: 'Mike Chen',
      username: 'mikecoder',
      mutualFriends: 8,
      time: '1 hour ago',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    },
    {
      id: '3',
      name: 'David Kim',
      username: 'davidk',
      mutualFriends: 2,
      time: '1 day ago',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    },
    {
      id: '4',
      name: 'Emma Davis',
      username: 'emmad',
      mutualFriends: 6,
      time: '2 days ago',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    },
  ]);

  // Mock data for current friends with images
  const [friends, setFriends] = useState([
    {
      id: '1',
      name: 'Alex Thompson',
      username: 'alexthompson',
      isOnline: true,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    },
    {
      id: '2',
      name: 'Emma Wilson',
      username: 'emmaw',
      isOnline: false,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    },
    {
      id: '3',
      name: 'James Rodriguez',
      username: 'jamesr',
      isOnline: true,
      avatar: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=150&h=150&fit=crop&crop=face',
    },
    {
      id: '4',
      name: 'Lisa Park',
      username: 'lisap',
      isOnline: false,
      avatar: 'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?w=150&h=150&fit=crop&crop=face',
    },
    {
      id: '5',
      name: 'Marcus Brown',
      username: 'marcusb',
      isOnline: true,
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face',
    },
    {
      id: '6',
      name: 'Sophia Lee',
      username: 'sophial',
      isOnline: true,
      avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
    },
    {
      id: '7',
      name: 'Ryan Cooper',
      username: 'ryanc',
      isOnline: false,
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
    },
    {
      id: '8',
      name: 'Olivia Martinez',
      username: 'oliviam',
      isOnline: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    },
  ]);

  const handleAcceptRequest = (id: string) => {
    const request = friendRequests.find(req => req.id === id);
    if (request) {
      setFriendRequests(prev => prev.filter(req => req.id !== id));
      setFriends(prev => [...prev, {
        id: id,
        name: request.name,
        username: request.username,
        isOnline: false,
        avatar: request.avatar,
      }]);
    }
  };

  const handleDeclineRequest = (id: string) => {
    setFriendRequests(prev => prev.filter(req => req.id !== id));
  };

  const renderFriendRequest = (request: any) => (
    <View key={request.id} style={styles.requestItem}>
      <View style={styles.requestLeft}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: request.avatar }} 
            style={styles.avatar}
          />
        </View>
        <View style={styles.requestInfo}>
          <Text style={styles.requestName}>{request.name}</Text>
          <Text style={styles.requestUsername}>@{request.username}</Text>
          <Text style={styles.mutualFriends}>
            {request.mutualFriends} mutual friends
          </Text>
          <Text style={styles.requestTime}>{request.time}</Text>
        </View>
      </View>
      
      <View style={styles.requestActions}>
        <TouchableOpacity 
          style={styles.acceptButton}
          onPress={() => handleAcceptRequest(request.id)}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.declineButton}
          onPress={() => handleDeclineRequest(request.id)}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFriend = (friend: any) => (
    <TouchableOpacity key={friend.id} style={styles.friendItem}>
      <View style={styles.friendLeft}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: friend.avatar }} 
            style={styles.avatar}
          />
          {friend.isOnline && <View style={styles.onlineIndicator} />}
        </View>
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{friend.name}</Text>
          <Text style={styles.friendUsername}>@{friend.username}</Text>
          <Text style={styles.friendStatus}>
            {friend.isOnline ? 'Online now' : 'Last seen 2h ago'}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.messageButton}>
        <Ionicons name="chatbubble-outline" size={20} color="#666" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Friends</Text>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="person-add-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search friends..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Tab Bar */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
            onPress={() => setActiveTab('friends')}
          >
            <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
              Friends
            </Text>
            {activeTab === 'friends' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
            onPress={() => setActiveTab('requests')}
          >
            <View style={styles.tabWithBadge}>
              <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
                Requests
              </Text>
              {friendRequests.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{friendRequests.length}</Text>
                </View>
              )}
            </View>
            {activeTab === 'requests' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'requests' ? (
          <View style={styles.requestsSection}>
            <Text style={styles.sectionTitle}>
              Friend Requests ({friendRequests.length})
            </Text>
            {friendRequests.length > 0 ? (
              friendRequests.map(renderFriendRequest)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color="#666" />
                <Text style={styles.emptyStateTitle}>No friend requests</Text>
                <Text style={styles.emptyStateText}>
                  When you have friend requests, they'll appear here
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.friendsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Your Friends ({friends.length})
              </Text>
              <TouchableOpacity style={styles.sortButton}>
                <Ionicons name="filter" size={20} color="#666" />
                <Text style={styles.sortButtonText}>Sort</Text>
              </TouchableOpacity>
            </View>
            {friends.map(renderFriend)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    margin: 16,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  tabWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeTab: {
    // Active state styling
  },
  tabText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 2,
    backgroundColor: '#ff375f',
  },
  badge: {
    backgroundColor: '#ff375f',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  requestsSection: {
    padding: 16,
  },
  friendsSection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  sortButtonText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 4,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111111',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    marginBottom: 12,
  },
  requestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#111111',
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  requestUsername: {
    color: '#666',
    fontSize: 14,
    marginBottom: 4,
  },
  mutualFriends: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 2,
  },
  requestTime: {
    color: '#666',
    fontSize: 12,
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  declineButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111111',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    marginBottom: 12,
  },
  friendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  friendUsername: {
    color: '#666',
    fontSize: 14,
    marginBottom: 2,
  },
  friendStatus: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
  },
  messageButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});