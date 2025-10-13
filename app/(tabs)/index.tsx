import { useThemeStyles } from '@/hooks/useThemeStyles';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import {
  Alert,
  Clipboard,
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

type Post = {
  id: string;
  username: string;
  name: string;
  content: string;
  likes: number;
  comments: number;
  time: string;
  userImage: string;
  image: string;
  isLiked: boolean;
  commentsList: Array<{
    id: string;
    username: string;
    name: string;
    comment: string;
    time: string;
  }>;
};

const initialPosts: Post[]  = [
  {
    id: '1',
    username: 'technews',
    name: 'Tech News Daily',
    content: 'Breaking: New AI model breaks all performance records in language understanding tasks. Researchers say this could revolutionize how we interact with technology.',
    likes: 324,
    comments: 45,
    time: '1h ago',
    userImage: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=400&fit=crop',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop',
    isLiked: false,
    commentsList: []
  },
  {
    id: '2',
    username: 'climatewatch',
    name: 'Climate Watch',
    content: 'Major breakthrough in renewable energy: New solar panel technology achieves 50% efficiency in lab tests. This could make solar power more accessible worldwide.',
    likes: 512,
    comments: 89,
    time: '2h ago',
    userImage: 'https://images.unsplash.com/photo-1569163139394-de4e4f43e4e3?w=400&h=400&fit=crop',
    image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=600&fit=crop',
    isLiked: false,
    commentsList: []
  },
  {
    id: '3',
    username: 'spaceexplorer',
    name: 'Space Explorer',
    content: 'NASA announces discovery of Earth-like planet in habitable zone. Could this be the future home for humanity? Scientists are excited about the possibilities.',
    likes: 891,
    comments: 156,
    time: '3h ago',
    userImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop',
    image: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=800&h=600&fit=crop',
    isLiked: false,
    commentsList: []
  },
  {
    id: '4',
    username: 'healthinnovate',
    name: 'Health Innovations',
    content: 'Revolutionary cancer treatment shows 95% success rate in clinical trials. New immunotherapy approach could change how we fight cancer forever.',
    likes: 723,
    comments: 203,
    time: '4h ago',
    userImage: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop',
    image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&h=600&fit=crop',
    isLiked: false,
    commentsList: []
  },
  {
    id: '5',
    username: 'futuretech',
    name: 'Future Tech',
    content: 'Quantum computer solves problem in 4 minutes that would take supercomputer 10,000 years. This marks a major milestone in quantum computing.',
    likes: 645,
    comments: 178,
    time: '5h ago',
    userImage: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=400&h=400&fit=crop',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=600&fit=crop',
    isLiked: false,
    commentsList: []
  },
  {
    id: '6',
    username: 'greenenergy',
    name: 'Green Energy News',
    content: 'World\'s largest offshore wind farm now operational, powering 1 million homes. This project sets new standards for renewable energy infrastructure.',
    likes: 432,
    comments: 67,
    time: '6h ago',
    userImage: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=400&fit=crop',
    image: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&h=600&fit=crop',
    isLiked: false,
    commentsList: []
  },
  {
    id: '7',
    username: 'aiweekly',
    name: 'AI Weekly',
    content: 'New AI system can predict protein structures with unprecedented accuracy. This breakthrough could accelerate drug discovery and disease research.',
    likes: 567,
    comments: 134,
    time: '7h ago',
    userImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=400&fit=crop',
    image: 'https://images.unsplash.com/photo-1677442135136-760c81240c70?w=800&h=600&fit=crop',
    isLiked: false,
    commentsList: []
  },
  {
    id: '8',
    username: 'sustainability',
    name: 'Sustainable Future',
    content: 'Breakthrough in battery technology: New solid-state batteries offer 3x the capacity and faster charging. Electric vehicles could see major improvements.',
    likes: 789,
    comments: 245,
    time: '8h ago',
    userImage: 'https://images.unsplash.com/photo-1563013541-2dcc5e5d2c5a?w=400&h=400&fit=crop',
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop',
    isLiked: false,
    commentsList: []
  },
  {
    id: '9',
    username: 'medicalbreak',
    name: 'Medical Breakthroughs',
    content: 'First successful human trial of artificial blood replacement. This could solve blood shortage crises and eliminate blood typing issues.',
    likes: 923,
    comments: 312,
    time: '9h ago',
    userImage: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400&h=400&fit=crop',
    image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&h=600&fit=crop',
    isLiked: false,
    commentsList: []
  },
  {
    id: '10',
    username: 'roboticsworld',
    name: 'Robotics World',
    content: 'Humanoid robot now capable of complex human interactions and emotional responses. The future of robotics is closer than we think.',
    likes: 678,
    comments: 189,
    time: '10h ago',
    userImage: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=400&fit=crop',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop',
    isLiked: false,
    commentsList: []
  },
  {
    id: '11',
    username: 'cybersecurity',
    name: 'Cyber Security Today',
    content: 'New quantum encryption method makes data transmission completely unhackable. This could revolutionize online security and privacy.',
    likes: 456,
    comments: 98,
    time: '11h ago',
    userImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=400&fit=crop',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop',
    isLiked: false,
    commentsList: []
  },
  {
    id: '12',
    username: 'futuretransport',
    name: 'Future Transport',
    content: 'Hyperloop prototype reaches record speed of 800 mph. This could make cross-country travel faster than ever imagined.',
    likes: 834,
    comments: 267,
    time: '12h ago',
    userImage: 'https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?w=400&h=400&fit=crop',
    image: 'https://images.unsplash.com/photo-1542744095-291d1f67b221?w=800&h=600&fit=crop',
    isLiked: false,
    commentsList: []
  },
  {
    id: '13',
    username: 'oceanexplorer',
    name: 'Ocean Explorer',
    content: 'Scientists discover new species in deepest part of ocean. These creatures could hold keys to medical and technological breakthroughs.',
    likes: 567,
    comments: 145,
    time: '13h ago',
    userImage: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop',
    isLiked: false,
    commentsList: []
  },
  {
    id: '14',
    username: 'agriculturetech',
    name: 'Agriculture Tech',
    content: 'Vertical farming produces 100x more food per square foot than traditional farming. This could solve urban food security issues.',
    likes: 489,
    comments: 112,
    time: '14h ago',
    userImage: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ce?w=400&h=400&fit=crop',
    image: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ce?w=800&h=600&fit=crop',
    isLiked: false,
    commentsList: []
  },
  {
    id: '15',
    username: 'neuroscience',
    name: 'Neuroscience News',
    content: 'Brain-computer interface allows paralyzed patients to control devices with their thoughts. This technology is changing lives every day.',
    likes: 712,
    comments: 234,
    time: '15h ago',
    userImage: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop',
    image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&h=600&fit=crop',
    isLiked: false,
    commentsList: []
  }
];

// Mock data for stories
const stories = [
  {
    id: '1',
    username: 'Your Story',
    isUser: true,
    hasNewStory: true,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '2',
    username: 'johndoe',
    hasNewStory: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '3',
    username: 'sarahdev',
    hasNewStory: true,
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '4',
    username: 'mikecoder',
    hasNewStory: false,
    avatar: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '5',
    username: 'emilydesign',
    hasNewStory: true,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '6',
    username: 'alextech',
    hasNewStory: false,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
  }
];
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
    color: colors.accent,
  },
  listContent: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: colors.background,
  },
  // Stories Section Styles
  storiesSection: {
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  storiesList: {
    paddingHorizontal: 4,
  },
  storyContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 68,
  },
  storyCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
    backgroundColor: colors.surface,
  },
  hasNewStory: {
    borderColor: colors.accent,
  },
  userStory: {
    borderColor: colors.border,
  },
  storyImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  addStoryButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.accent,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  addStoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 14,
  },
  storyUsername: {
    fontSize: 11,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  // Post Styles
  post: {
    backgroundColor: colors.surface,
    marginBottom: 12,
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
    color: colors.accent,
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
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.textSecondary,
    fontWeight: '300',
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
    backgroundColor: colors.accent,
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
    color: colors.accent,
  },
  cancelButton: {
    borderBottomWidth: 0,
    marginTop: 10,
  },
  cancelText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [selectedPostForOptions, setSelectedPostForOptions] = useState<Post | null>(null);
const { colors } = useThemeStyles();
  const likePost = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        const wasLiked = post.isLiked;
        return { 
          ...post, 
          likes: wasLiked ? post.likes - 1 : post.likes + 1,
          isLiked: !wasLiked
        };
      }
      return post;
    }));
  };

  const addComment = (postId: string) => {
    if (newComment.trim()) {
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: post.comments + 1,
            commentsList: [...post.commentsList, {
              id: Date.now().toString(),
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
  };

  const sharePost = async (post: Post) => {
    const postLink = `https://socialapp.com/post/${post.id}`;
    
    if (Platform.OS === 'web') {
      // For web - use clipboard
      navigator.clipboard.writeText(postLink);
      Alert.alert('Link Copied!', 'Post link has been copied to clipboard.');
    } else {
      // For mobile - use sharing
      try {
        await Sharing.shareAsync(postLink);
      } catch (error) {
        // Fallback to clipboard if sharing fails
        Clipboard.setString(postLink);
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
    // Just share the image URL directly
    if (Platform.OS === 'web') {
      // For web - open image in new tab
      window.open(post.image, '_blank');
      Alert.alert('Image Opened', 'Image opened in new tab. Right-click to save.');
    } else {
      // For mobile - use sharing
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
 const styles = createStyles(colors);
  const renderStory = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.storyContainer}>
      <View style={[
        styles.storyCircle,
        item.hasNewStory && styles.hasNewStory,
        item.isUser && styles.userStory
      ]}>
        <Image 
          source={{ uri: item.avatar }} 
          style={styles.storyImage}
        />
        {item.isUser && (
          <View style={styles.addStoryButton}>
            <Text style={styles.addStoryText}>+</Text>
          </View>
        )}
      </View>
      <Text style={styles.storyUsername} numberOfLines={1}>
        {item.isUser ? 'Your Story' : item.username}
      </Text>
    </TouchableOpacity>
  );

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
          onPress={() => likePost(item.id)} 
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

      {/* Divider */}
      <View style={styles.divider} />
    </View>
  );

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
                style={styles.closeButton}
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
                onPress={() => selectedPost && addComment(selectedPost.id)}
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
 
