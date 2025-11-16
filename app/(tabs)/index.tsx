import { useThemeStyles } from "@/hooks/useThemeStyles";
import { Carattere_400Regular, useFonts } from "@expo-google-fonts/carattere";
import { Ionicons } from "@expo/vector-icons";
import { Audio, ResizeMode, Video } from "expo-av";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from "../context/AuthContext";

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face";
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type User = {
  _id: string;
  username?: string;
  name?: string;
  email: string;
  profilePicture?: string;
};

type VideoPost = {
  _id: string;
  userId: string;
  user?: User;
  streamableShortcode: string;
  streamableUrl: string;
  title: string;
  description: string;
  format: string;
  size: number;
  status: string;
  privacy: string;
  likes?: Array<{
    userId: string;
    likedAt: Date;
  }>;
  comments?: Array<{
    _id: string;
    userId: string;
    user?: User;
    content: string;
    createdAt: Date;
  }>;
  shares?: number;
  createdAt: Date;
  updatedAt: Date;
};

type ApiPost = {
  _id: string;
  userId: string;
  user?: User;
  content: string;
  image?: string;
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
  location?: string;
  type?: "post" | "reel";
};

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
  videoUrl?: string;
  shares: number;
  isLiked: boolean;
  commentsList: Array<{
    id: string;
    username: string;
    name: string;
    comment: string;
    time: string;
  }>;
  type: "post" | "reel";
  _id?: string;
  userId?: string;
};

type HomeTab = "posts" | "reels";

const API_BASE_URL = "http://localhost:3000";

const createStyles = (colors: any, fontsLoaded: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    appHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    appTitle: {
      fontSize: 32,
      fontFamily: fontsLoaded ? "Carattere_400Regular" : "System",
      color: colors.accent,
      marginLeft: 8,
      includeFontPadding: false,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    messageIcon: {
      padding: 8,
    },
    tabContainer: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: 16,
    },
    tab: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 3,
      borderBottomColor: "transparent",
    },
    activeTab: {
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    activeTabText: {
      color: colors.primary,
    },
    listContent: {
      paddingBottom: 20,
    },
    reelsContent: {
      paddingBottom: 20,
    },
    reelContainer: {
      height: screenHeight - 200,
      backgroundColor: "#000",
      marginBottom: 8,
    },
    reelHeader: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
    },
    reelUserAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginRight: 8,
    },
    reelUsername: {
      color: "white",
      fontSize: 14,
      fontWeight: "600",
      flex: 1,
    },
    followButton: {
      backgroundColor: "#0095F6",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    followButtonText: {
      color: "white",
      fontSize: 12,
      fontWeight: "600",
    },
    videoContainer: {
      flex: 1,
      backgroundColor: '#000',
      justifyContent: 'center',
      alignItems: 'center',
    },
    video: {
      width: '100%',
      height: '100%',
    },
    reelOverlay: {
      position: "absolute",
      bottom: 100,
      left: 16,
      right: 16,
    },
    reelText: {
      color: "white",
      fontSize: 16,
      fontWeight: "500",
    },
    reelActions: {
      position: "absolute",
      right: 16,
      bottom: 100,
      alignItems: "center",
      gap: 20,
    },
    reelAction: {
      alignItems: "center",
    },
    reelActionText: {
      color: "white",
      fontSize: 12,
      marginTop: 4,
      fontWeight: "500",
    },
    videoControls: {
      position: 'absolute',
      bottom: 20,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    controlButton: {
      padding: 12,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 25,
      marginHorizontal: 10,
    },
    videoErrorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000',
    },
    videoErrorText: {
      color: 'white',
      fontSize: 16,
      marginTop: 10,
    },
    post: {
      backgroundColor: colors.surface,
      marginBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: 16,
      borderRadius: 12,
      marginHorizontal: 12,
    },
    postHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      paddingHorizontal: 16,
    },
    userAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    userInfo: {
      flex: 1,
    },
    name: {
      fontWeight: "600",
      fontSize: 16,
      color: colors.text,
      marginBottom: 2,
    },
    username: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: "500",
    },
    moreButton: {
      padding: 4,
    },
    moreText: {
      color: colors.textSecondary,
      fontSize: 18,
      fontWeight: "bold",
    },
    content: {
      fontSize: 15,
      lineHeight: 20,
      color: colors.text,
      paddingHorizontal: 16,
      marginBottom: 12,
      fontWeight: "400",
    },
    postImage: {
      width: "100%",
      height: 400,
      marginBottom: 12,
      borderRadius: 8,
    },
    postActions: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingHorizontal: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: 8,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: colors.background,
      minWidth: 80,
      justifyContent: "center",
    },
    actionButtonLiked: {
      backgroundColor: "rgba(255, 59, 48, 0.1)",
    },
    actionContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    actionText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    actionTextLiked: {
      color: "#FF3B30",
    },
    actionCount: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 4,
      fontWeight: "500",
    },
    actionCountLiked: {
      color: "#FF3B30",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      justifyContent: "flex-end",
    },
    commentsModal: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "80%",
    },
    optionsModal: {
      backgroundColor: colors.surface,
      margin: 20,
      borderRadius: 15,
      padding: 10,
      maxWidth: 400,
      alignSelf: "center",
      width: "90%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "600",
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
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    commentName: {
      color: colors.text,
      fontWeight: "600",
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
      flexDirection: "row",
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      alignItems: "flex-end",
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
      color: "#ffffff",
      fontWeight: "600",
    },
    optionButton: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    optionText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "500",
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
      fontWeight: "600",
      textAlign: "center",
    },
    closeButtonText: {
      color: colors.text,
      fontSize: 24,
      fontWeight: "300",
    },
  });

export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [reels, setReels] = useState<Post[]>([]);
  const [fontsLoaded] = useFonts({ Carattere_400Regular });
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [selectedPostForOptions, setSelectedPostForOptions] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<HomeTab>("posts");
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const { getAuthHeaders, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const { colors } = useThemeStyles();
  const styles = createStyles(colors, fontsLoaded || false);

  const getUserDisplayName = (user: any) => {
    if (!user) return { username: "user", name: "User" };
    
    const username = user.username || user.name || user.email?.split('@')[0] || "user";
    const name = user.name || user.username || user.email?.split('@')[0] || "User";
    
    return {
      username: username.toLowerCase().replace(/\s+/g, ""),
      name: name
    };
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getStreamableVideoUrl = async (shortcode: string): Promise<string> => {
    try {
      const response = await fetch(`https://api.streamable.com/videos/${shortcode}`);
      if (response.ok) {
        const data = await response.json();
        if (data.files && data.files.mp4) {
          return data.files.mp4.url;
        }
      }
      return `https://streamable.com/e/${shortcode}`;
    } catch (error) {
      console.error('Error fetching Streamable video:', error);
      return `https://streamable.com/e/${shortcode}`;
    }
  };

  const fetchPosts = useCallback(async () => {
    try {
      if (!isAuthenticated) return;
      setLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/posts`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const transformedPosts: Post[] = await Promise.all(
            data.posts.map(async (post: ApiPost) => ({
              id: post._id,
              _id: post._id,
              userId: post.userId,
              username: post.user?.name?.toLowerCase().replace(/\s+/g, "") || "user",
              name: post.user?.name || "User",
              content: post.content,
              likes: post.likes.length,
              comments: post.comments.length,
              time: getTimeAgo(post.createdAt),
              userImage: post.user?.profilePicture || DEFAULT_AVATAR,
              image: post.image,
              isLiked: post.likes.some((like) => like.userId === user?.id),
              type: post.type || "post",
              shares: post.shares || 0,
              commentsList: post.comments.map((comment) => ({
                id: comment._id,
                username: comment.user?.name?.toLowerCase().replace(/\s+/g, "") || "user",
                name: comment.user?.name || "User",
                comment: comment.content,
                time: getTimeAgo(comment.createdAt),
              })),
            }))
          );
          setPosts(transformedPosts);
        }
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  const fetchReels = useCallback(async () => {
    try {
      if (!isAuthenticated) return;
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/videos`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.videos) {
          const transformedReels: Post[] = await Promise.all(
            data.videos.map(async (video: VideoPost) => {
              const directVideoUrl = await getStreamableVideoUrl(video.streamableShortcode);
              
              return {
                id: video._id,
                _id: video._id,
                userId: video.userId,
                username: video.user?.name?.toLowerCase().replace(/\s+/g, "") || "user",
                name: video.user?.name || "User",
                content: video.title || video.description || "Check out this reel!",
                likes: video.likes?.length || 0,
                comments: video.comments?.length || 0,
                time: getTimeAgo(video.createdAt),
                userImage: video.user?.profilePicture || DEFAULT_AVATAR,
                videoUrl: directVideoUrl,
                shares: video.shares || 0,
                isLiked: video.likes?.some((like) => like.userId === user?.id) || false,
                type: "reel" as const,
                commentsList: video.comments?.map((comment) => ({
                  id: comment._id,
                  username: comment.user?.name?.toLowerCase().replace(/\s+/g, "") || "user",
                  name: comment.user?.name || "User",
                  comment: comment.content,
                  time: getTimeAgo(comment.createdAt),
                })) || [],
              };
            })
          );
          setReels(transformedReels);
        }
      }
    } catch (error) {
      console.error("Error fetching reels:", error);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts();
      fetchReels();
    }
  }, [isAuthenticated, fetchPosts, fetchReels]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchPosts();
        fetchReels();
      }
    }, [fetchPosts, fetchReels, isAuthenticated])
  );

  const likePost = async (postId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, { 
        method: "POST", 
        headers 
      });
      
      if (response.ok) {
        setPosts(prev => prev.map(post => 
          post._id === postId ? { 
            ...post, 
            likes: post.isLiked ? post.likes - 1 : post.likes + 1, 
            isLiked: !post.isLiked 
          } : post
        ));
        setReels(prev => prev.map(reel =>
          reel._id === postId ? {
            ...reel,
            likes: reel.isLiked ? reel.likes - 1 : reel.likes + 1,
            isLiked: !reel.isLiked
          } : reel
        ));
      } else {
        setPosts(prev => prev.map(post => 
          post._id === postId ? { 
            ...post, 
            likes: post.isLiked ? post.likes - 1 : post.likes + 1, 
            isLiked: !post.isLiked 
          } : post
        ));
        setReels(prev => prev.map(reel =>
          reel._id === postId ? {
            ...reel,
            likes: reel.isLiked ? reel.likes - 1 : reel.likes + 1,
            isLiked: !reel.isLiked
          } : reel
        ));
      }
    } catch (error) {
      console.error("Error liking post:", error);
      setPosts(prev => prev.map(post => 
        post._id === postId ? { 
          ...post, 
          likes: post.isLiked ? post.likes - 1 : post.likes + 1, 
          isLiked: !post.isLiked 
        } : post
      ));
      setReels(prev => prev.map(reel =>
        reel._id === postId ? {
          ...reel,
          likes: reel.isLiked ? reel.likes - 1 : reel.likes + 1,
          isLiked: !reel.isLiked
        } : reel
      ));
    }
  };

  const addComment = async (postId: string) => {
    if (!newComment.trim()) return;
    
    const userDisplayName = getUserDisplayName(user);
    const commentData = {
      id: `comment-${Date.now()}`,
      username: userDisplayName.username,
      name: userDisplayName.name,
      comment: newComment,
      time: "Just now"
    };

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/comment`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      
      if (response.ok) {
        setPosts(prev => prev.map(post => 
          post._id === postId ? { 
            ...post, 
            comments: post.comments + 1,
            commentsList: [...post.commentsList, commentData]
          } : post
        ));
        setReels(prev => prev.map(reel =>
          reel._id === postId ? {
            ...reel,
            comments: reel.comments + 1,
            commentsList: [...reel.commentsList, commentData]
          } : reel
        ));
        setNewComment("");
        setCommentModalVisible(false);
      } else {
        setPosts(prev => prev.map(post => 
          post._id === postId ? { 
            ...post, 
            comments: post.comments + 1,
            commentsList: [...post.commentsList, commentData]
          } : post
        ));
        setReels(prev => prev.map(reel =>
          reel._id === postId ? {
            ...reel,
            comments: reel.comments + 1,
            commentsList: [...reel.commentsList, commentData]
          } : reel
        ));
        setNewComment("");
        setCommentModalVisible(false);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      setPosts(prev => prev.map(post => 
        post._id === postId ? { 
          ...post, 
          comments: post.comments + 1,
          commentsList: [...post.commentsList, commentData]
        } : post
      ));
      setReels(prev => prev.map(reel =>
        reel._id === postId ? {
          ...reel,
          comments: reel.comments + 1,
          commentsList: [...reel.commentsList, commentData]
        } : reel
      ));
      setNewComment("");
      setCommentModalVisible(false);
    }
  };

  const sharePost = async (post: Post) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/posts/${post._id}/share`, { 
        method: "POST", 
        headers 
      });
      
      if (response.ok) {
        setPosts(prev => prev.map(p => 
          p._id === post._id ? { ...p, shares: p.shares + 1 } : p
        ));
        setReels(prev => prev.map(r =>
          r._id === post._id ? { ...r, shares: r.shares + 1 } : r
        ));
        Alert.alert("Success", "Post shared successfully");
      } else {
        setPosts(prev => prev.map(p => 
          p._id === post._id ? { ...p, shares: p.shares + 1 } : p
        ));
        setReels(prev => prev.map(r =>
          r._id === post._id ? { ...r, shares: r.shares + 1 } : r
        ));
        Alert.alert("Success", "Post shared successfully");
      }
    } catch (error) {
      console.error("Error sharing post:", error);
      setPosts(prev => prev.map(p => 
        p._id === post._id ? { ...p, shares: p.shares + 1 } : p
      ));
      setReels(prev => prev.map(r =>
        r._id === post._id ? { ...r, shares: r.shares + 1 } : r
      ));
      Alert.alert("Success", "Post shared successfully");
    }
  };

  const navigateToUserProfile = (userId: string, username: string) => {
    router.push({ pathname: `UserProfileScreen?userId=${userId}` });
  };

  const PostActionButton = ({ icon, label, count, isActive = false, onPress, activeColor = "#FF3B30" }: any) => (
    <TouchableOpacity style={[styles.actionButton, isActive && styles.actionButtonLiked]} onPress={onPress}>
      <View style={styles.actionContent}>
        <Ionicons name={icon} size={20} color={isActive ? activeColor : colors.textSecondary} />
        <Text style={[styles.actionText, isActive && styles.actionTextLiked]}>{label}</Text>
        {count > 0 && <Text style={[styles.actionCount, isActive && styles.actionCountLiked]}>{count}</Text>}
      </View>
    </TouchableOpacity>
  );

  const ReelItem = ({ item, index }: { item: Post; index: number }) => {
    const [isLiked, setIsLiked] = useState(item.isLiked);
    const [likeCount, setLikeCount] = useState(item.likes);
    const [videoError, setVideoError] = useState(false);
    const [isPlaying, setIsPlaying] = useState(index === currentVideoIndex);
    const [isMuted, setIsMuted] = useState(false);
    const videoRef = useRef<Video>(null);

    useEffect(() => {
      Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
        playThroughEarpieceAndroid: false,
      }).catch(error => {
        console.log('Audio mode setting error:', error);
      });
    }, []);

    useEffect(() => {
      const handleVideoPlayback = async () => {
        if (!videoRef.current) return;
        
        try {
          if (index === currentVideoIndex) {
            setTimeout(async () => {
              try {
                await videoRef.current?.playAsync();
                setIsPlaying(true);
              } catch (playError) {
                console.error('Error playing video:', playError);
                setIsPlaying(false);
              }
            }, 100);
          } else {
            await videoRef.current?.pauseAsync();
            setIsPlaying(false);
          }
        } catch (error) {
          console.error('Error controlling video playback:', error);
        }
      };

      handleVideoPlayback();
    }, [currentVideoIndex, index]);

    const togglePlayPause = async () => {
      if (!videoRef.current) return;
      
      try {
        if (isPlaying) {
          await videoRef.current.pauseAsync();
          setIsPlaying(false);
        } else {
          await videoRef.current.playAsync();
          setIsPlaying(true);
        }
      } catch (error) {
        console.error('Error toggling play/pause:', error);
      }
    };

    const toggleMute = async () => {
      if (!videoRef.current) return;
      
      try {
        await videoRef.current.setIsMutedAsync(!isMuted);
        setIsMuted(!isMuted);
      } catch (error) {
        console.error('Error toggling mute:', error);
      }
    };

    const handleLikeReel = async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/reels/${item._id}/like`, { 
          method: "POST", 
          headers 
        });
        
        if (response.ok) {
          setIsLiked(!isLiked);
          setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
        } else {
          setIsLiked(!isLiked);
          setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
        }
      } catch (error) {
        console.error("Error liking reel:", error);
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
      }
    };

    return (
      <View style={styles.reelContainer}>
        <View style={styles.reelHeader}>
          <TouchableOpacity onPress={() => item.userId && navigateToUserProfile(item.userId, item.username)}>
            <Image source={{ uri: item.userImage }} style={styles.reelUserAvatar} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => item.userId && navigateToUserProfile(item.userId, item.username)}>
            <Text style={styles.reelUsername}>@{item.username}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.followButton}>
            <Text style={styles.followButtonText}>Follow</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.videoContainer}>
          {item.videoUrl && !videoError ? (
            <>
              <Video
                ref={videoRef}
                source={{ uri: item.videoUrl }}
                style={styles.video}
                resizeMode={ResizeMode.COVER}
                shouldPlay={index === currentVideoIndex}
                isLooping
                isMuted={isMuted}
                useNativeControls={false}
                onError={(error) => {
                  console.error('Video error:', error);
                  setVideoError(true);
                }}
                onLoadStart={() => console.log('Video load started')}
                onLoad={() => console.log('Video loaded successfully')}
              />
              <TouchableOpacity 
                style={styles.videoControls} 
                onPress={togglePlayPause}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={30} 
                  color="white" 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.videoControls, { bottom: 80 }]} 
                onPress={toggleMute}
              >
                <Ionicons 
                  name={isMuted ? "volume-mute" : "volume-high"} 
                  size={24} 
                  color="white" 
                />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.videoErrorContainer}>
              <Ionicons name="videocam-off-outline" size={50} color="white" />
              <Text style={styles.videoErrorText}>Unable to load video</Text>
            </View>
          )}
        </View>

        <View style={styles.reelOverlay}>
          <Text style={styles.reelText} numberOfLines={2}>{item.content}</Text>
        </View>

        <View style={styles.reelActions}>
          <TouchableOpacity style={styles.reelAction} onPress={handleLikeReel}>
            <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? "#FF3B30" : "white"} />
            <Text style={styles.reelActionText}>{likeCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.reelAction} 
            onPress={() => { 
              setSelectedPost(item); 
              setCommentModalVisible(true); 
            }}
          >
            <Ionicons name="chatbubble-outline" size={24} color="white" />
            <Text style={styles.reelActionText}>{item.comments}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reelAction} onPress={() => sharePost(item)}>
            <Ionicons name="share-outline" size={24} color="white" />
            <Text style={styles.reelActionText}>{item.shares}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const PostItem = ({ item }: { item: Post }) => (
    <View style={styles.post}>
      <View style={styles.postHeader}>
        <TouchableOpacity onPress={() => item.userId && navigateToUserProfile(item.userId, item.username)}>
          <Image source={{ uri: item.userImage }} style={styles.userAvatar} />
        </TouchableOpacity>
        <View style={styles.userInfo}>
          <TouchableOpacity onPress={() => item.userId && navigateToUserProfile(item.userId, item.username)}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.username}>@{item.username} · {item.time}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={styles.moreButton} 
          onPress={() => { 
            setSelectedPostForOptions(item); 
            setOptionsModalVisible(true); 
          }}
        >
          <Text style={styles.moreText}>⋯</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.content}>{item.content}</Text>

      {item.image && <Image source={{ uri: item.image }} style={styles.postImage} />}

      <View style={styles.postActions}>
        <PostActionButton
          icon={item.isLiked ? "heart" : "heart-outline"}
          label="Like"
          count={item.likes}
          isActive={item.isLiked}
          onPress={() => likePost(item._id || item.id)}
        />
        <PostActionButton
          icon="chatbubble-outline"
          label="Comment"
          count={item.comments}
          onPress={() => { setSelectedPost(item); setCommentModalVisible(true); }}
        />
        <PostActionButton
          icon="share-social-outline"
          label="Share"
          count={item.shares}
          onPress={() => sharePost(item)}
        />
      </View>
    </View>
  );

  const ReelsFlatList = () => {
    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;
    
    const handleViewableItemsChanged = useRef(({ viewableItems }: any) => {
      if (viewableItems.length > 0) {
        const newIndex = viewableItems[0].index;
        setCurrentVideoIndex(newIndex);
      }
    }).current;

    return (
      <FlatList
        data={reels}
        renderItem={({ item, index }) => <ReelItem item={item} index={index} />}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.reelsContent}
        refreshing={loading}
        onRefresh={fetchReels}
        pagingEnabled
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(data, index) => ({
          length: screenHeight - 200,
          offset: (screenHeight - 200) * index,
          index,
        })}
      />
    );
  };

  const PostsFlatList = () => (
    <FlatList
      data={posts.filter(post => post.type === "post")}
      renderItem={({ item }) => <PostItem item={item} />}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      refreshing={loading}
      onRefresh={fetchPosts}
    />
  );

  const renderContent = () => {
    switch (activeTab) {
      case "posts": return <PostsFlatList />;
      case "reels": return <ReelsFlatList />;
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.appHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.appTitle}>SmartConnect</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.messageIcon} onPress={() => router.push("/(tabs)/messages")}>
            <Ionicons name="paper-plane-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "posts" && styles.activeTab]}
          onPress={() => setActiveTab("posts")}
        >
          <Text style={[styles.tabText, activeTab === "posts" && styles.activeTabText]}>
            Posts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "reels" && styles.activeTab]}
          onPress={() => setActiveTab("reels")}
        >
          <Text style={[styles.tabText, activeTab === "reels" && styles.activeTabText]}>
            Reels
          </Text>
        </TouchableOpacity>
      </View>

      {renderContent()}

      <Modal visible={commentModalVisible} animationType="slide" transparent onRequestClose={() => setCommentModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.commentsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentModalVisible(false)}>
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
                style={[styles.commentSubmitButton, !newComment.trim() && styles.commentSubmitDisabled]}
                onPress={() => selectedPost && addComment(selectedPost._id || selectedPost.id)}
                disabled={!newComment.trim()}
              >
                <Text style={styles.commentSubmitText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={optionsModalVisible} animationType="slide" transparent onRequestClose={() => setOptionsModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setOptionsModalVisible(false)}>
          <View style={styles.optionsModal}>
            <TouchableOpacity style={styles.optionButton} onPress={() => {}}>
              <Text style={styles.optionText}>Save Post</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionButton} onPress={() => selectedPostForOptions && sharePost(selectedPostForOptions)}>
              <Text style={styles.optionText}>Share Post</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionButton} onPress={() => Alert.alert("Report", "Post reported successfully.")}>
              <Text style={[styles.optionText, styles.reportOption]}>Report Post</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.optionButton, styles.cancelButton]} onPress={() => setOptionsModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}