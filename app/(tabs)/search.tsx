import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { useAuth } from '../context/AuthContext';

interface SearchResult {
  id: string;
  fullName: string;
  username: string;
  profilePicture?: string;
  bio?: string;
  mutualFriends?: number;
}

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useThemeStyles();
  const { searchUsers, getSuggestedUsers } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load suggested users on mount
  useEffect(() => {
    loadSuggestedUsers();
  }, []);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      performSearch(debouncedQuery);
    } else {
      setSearchResults([]);
    }
  }, [debouncedQuery]);

  const loadSuggestedUsers = async () => {
    try {
      setLoading(true);
      const users = await getSuggestedUsers();
      setSuggestedUsers(users.map(user => ({
        id: user.id,
        fullName: user.fullName || 'User',
        username: user.username || '@user',
        profilePicture: user.profilePicture,
        bio: user.bio,
        mutualFriends: Math.floor(Math.random() * 50) + 1, // Mock data
      })));
    } catch (error) {
      console.error('Error loading suggested users:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (query: string) => {
    try {
      setLoading(true);
      const users = await searchUsers(query);
      setSearchResults(users.map(user => ({
        id: user.id,
        fullName: user.fullName || 'User',
        username: user.username || '@user',
        profilePicture: user.profilePicture,
        bio: user.bio,
        mutualFriends: Math.floor(Math.random() * 50) + 1, // Mock data
      })));
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserPress = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const renderUserItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity 
      style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleUserPress(item.id)}
    >
      <Image 
        source={{ uri: item.profilePicture || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' }}
        style={styles.userAvatar}
      />
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
          {item.fullName}
        </Text>
        <Text style={[styles.userUsername, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.username}
        </Text>
        {item.bio && (
          <Text style={[styles.userBio, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.bio}
          </Text>
        )}
        {item.mutualFriends && (
          <Text style={[styles.mutualFriends, { color: colors.textSecondary }]}>
            {item.mutualFriends} mutual friends
          </Text>
        )}
      </View>
      <TouchableOpacity style={[styles.followButton, { backgroundColor: colors.accent }]}>
        <Text style={styles.followButtonText}>Follow</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Header */}
      <View style={[styles.searchHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search users..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Content */}
      {loading && searchQuery ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Searching users...
          </Text>
        </View>
      ) : searchQuery ? (
        // Search Results
        <FlatList
          data={searchResults}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: colors.text }]}>
                No users found
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                Try searching with different keywords
              </Text>
            </View>
          }
        />
      ) : (
        // Suggested Users
        <FlatList
          data={suggestedUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Suggested for you
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    padding: 16,
    borderBottomWidth: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    paddingVertical: 4,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    marginBottom: 4,
  },
  userBio: {
    fontSize: 12,
    lineHeight: 16,
  },
  mutualFriends: {
    fontSize: 12,
    marginTop: 4,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionHeader: {
    padding: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});