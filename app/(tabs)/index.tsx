import { useThemeStyles } from "@/hooks/useThemeStyles";
import { Carattere_400Regular, useFonts } from "@expo-google-fonts/carattere";
import { Ionicons } from "@expo/vector-icons";
import { Audio, ResizeMode, Video } from "expo-av";
import { Directory, File, Paths } from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";

// Constants
const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face";
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const API_BASE_URL = "https://serverside-app.onrender.com";
const INTEREST_API_URL = "https://your-fastapi-server.com";
const STORY_DURATION = 5000;

// Types (keeping your existing types)
type User = {
  _id: string;
  username?: string;
  name?: string;
  email: string;
  profilePicture?: string;
};

type Story = {
  _id: string;
  userId: string;
  user?: User;
  image: string;
  mediaType: "image" | "video";
  caption?: string;
  content?: string;
  expiresAt: Date;
  views: string[];
  createdAt: Date;
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
  streamableShortcode?: string;
};

type HomeTab = "posts" | "reels";

// Custom hook for API calls
const useApi = () => {
  const { getAuthHeaders } = useAuth();

  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    const headers = await getAuthHeaders();
    return fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers },
    });
  }, [getAuthHeaders]);

  return { fetchWithAuth };
};

// Custom hook for stories
const useStories = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const { fetchWithAuth } = useApi();
  const { user, isAuthenticated } = useAuth();

  const fetchStories = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/stories`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.stories) {
          const transformedStories: Story[] = data.stories.map((story: any) => ({
            _id: story._id,
            userId: story.userId,
            user: story.user,
            image: story.image,
            mediaType: "image",
            caption: story.content || "",
            content: story.content || "",
            expiresAt: new Date(story.expiresAt),
            views: story.views || [],
            createdAt: new Date(story.createdAt),
          }));
          setStories(transformedStories);
        }
      }
    } catch (error) {
      console.error("Error fetching stories:", error);
    }
  }, [isAuthenticated, fetchWithAuth]);

  const markStoryAsViewed = useCallback(async (storyId: string) => {
    if (!user?.id) return;

    try {
      await fetchWithAuth(`${API_BASE_URL}/stories/${storyId}/view`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error marking story as viewed:", error);
    }
  }, [user?.id, fetchWithAuth]);

  return {
    stories,
    fetchStories,
    markStoryAsViewed,
  };
};

// Custom hook for posts and reels
const useContent = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [reels, setReels] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { fetchWithAuth } = useApi();
  const { user, isAuthenticated } = useAuth();

  const getTimeAgo = useCallback((date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }, []);

  const getStreamableVideoUrl = useCallback(async (shortcode: string): Promise<string> => {
    try {
      const response = await fetch(`https://api.streamable.com/videos/${shortcode}`);
      if (response.ok) {
        const data = await response.json();
        if (data.files?.mp4?.url) {
          return data.files.mp4.url;
        }
      }
      return `https://streamable.com/e/${shortcode}`;
    } catch (error) {
      console.error("Error fetching Streamable video:", error);
      return `https://streamable.com/e/${shortcode}`;
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;

    try {
      setLoading(true);
      let response;
      
      try {
        response = await fetchWithAuth(`${INTEREST_API_URL}/posts/interest-based/${user.id}`);
      } catch {
        response = await fetchWithAuth(`${API_BASE_URL}/posts`);
      }

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
  }, [isAuthenticated, user?.id, fetchWithAuth, getTimeAgo]);

  const fetchReels = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;

    try {
      setLoading(true);
      let response;
      
      try {
        response = await fetchWithAuth(`${INTEREST_API_URL}/reels/interest-based/${user.id}`);
      } catch {
        response = await fetchWithAuth(`${API_BASE_URL}/videos`);
      }

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
                streamableShortcode: video.streamableShortcode,
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
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id, fetchWithAuth, getTimeAgo, getStreamableVideoUrl]);

  return {
    posts,
    reels,
    loading,
    fetchPosts,
    fetchReels,
  };
};

// SIMPLIFIED Video Player Hook - No complex manager needed
const useVideoPlayer = (videoUrl: string | undefined, isActive: boolean) => {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Handle play/pause based on isActive
  useEffect(() => {
    const handlePlayback = async () => {
      if (!videoRef.current || !videoUrl) return;

      try {
        if (isActive) {
          // Play the video if it's active
          setIsBuffering(true);
          await videoRef.current.playAsync();
          setIsPlaying(true);
          setIsBuffering(false);
        } else {
          // Pause the video if it's not active
          if (isPlaying) {
            await videoRef.current.pauseAsync();
            setIsPlaying(false);
          }
        }
      } catch (error) {
        console.error("Error controlling video playback:", error);
        setIsBuffering(false);
        setHasError(true);
      }
    };

    handlePlayback();
  }, [isActive, videoUrl]);

  const togglePlayPause = async () => {
    if (!videoRef.current || !videoUrl) return;

    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await videoRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error toggling play/pause:", error);
    }
  };

  const toggleMute = async () => {
    if (!videoRef.current) return;

    try {
      await videoRef.current.setIsMutedAsync(!isMuted);
      setIsMuted(!isMuted);
    } catch (error) {
      console.error("Error toggling mute:", error);
    }
  };

  const restartVideo = async () => {
    if (!videoRef.current) return;
    
    try {
      await videoRef.current.setPositionAsync(0);
      if (isActive) {
        await videoRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error restarting video:", error);
    }
  };

  return {
    videoRef,
    isPlaying,
    isMuted,
    isBuffering,
    hasError,
    togglePlayPause,
    toggleMute,
    restartVideo,
    setHasError,
  };
};

// Story Viewer Component
const StoryViewer = ({ 
  visible, 
  stories, 
  currentIndex, 
  onClose, 
  onNext, 
  onPrevious,
  progress 
}: {
  visible: boolean;
  stories: Story[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  progress: number;
}) => {
  const { colors } = useThemeStyles();
  const currentStory = stories[currentIndex];
  const styles = createStyles(colors, false);

  const isBase64 = (str: string) => {
    if (!str) return false;
    try {
      return str.startsWith('data:image') || 
             (str.length > 1000 && /^[A-Za-z0-9+/]*={0,2}$/.test(str));
    } catch {
      return false;
    }
  };

  const getStoryImageSource = (image: string) => {
    if (!image) return { uri: DEFAULT_AVATAR };
    
    if (isBase64(image)) {
      return { uri: `data:image/jpeg;base64,${image}` };
    } else if (image.startsWith('http')) {
      return { uri: image };
    } else {
      return { uri: DEFAULT_AVATAR };
    }
  };

  const getUserDisplayName = (user: any) => {
    if (!user) return { username: "user", name: "User" };
    const username = user.username || user.name || user.email?.split("@")[0] || "user";
    const name = user.name || user.username || user.email?.split("@")[0] || "User";
    return { username, name };
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (!visible || !currentStory) return null;

  const userDisplayName = getUserDisplayName(currentStory.user);

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.storyViewerContainer}>
        {/* Progress Bars */}
        <View style={styles.storyProgressContainer}>
          {stories.map((_, index) => (
            <View key={index} style={styles.storyProgressBar}>
              <View
                style={[
                  styles.storyProgressFill,
                  {
                    width: index === currentIndex
                      ? `${progress}%`
                      : index < currentIndex
                      ? "100%"
                      : "0%",
                  },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Header */}
        <View style={styles.storyHeader}>
          <Image
            source={{ uri: currentStory.user?.profilePicture || DEFAULT_AVATAR }}
            style={styles.storyViewerAvatar}
            defaultSource={{ uri: DEFAULT_AVATAR }}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.storyViewerUsername}>{userDisplayName.name}</Text>
            <Text style={styles.storyViewerTime}>
              {getTimeAgo(currentStory.createdAt)}
            </Text>
          </View>
          <TouchableOpacity style={styles.storyViewerClose} onPress={onClose}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Story Media */}
        <Image
          source={getStoryImageSource(currentStory.image)}
          style={styles.storyMedia}
          resizeMode="contain"
          onError={() => onClose()}
        />

        {/* Caption */}
        {(currentStory.caption || currentStory.content) && (
          <View style={styles.storyCaption}>
            <Text style={styles.storyCaptionText}>
              {currentStory.caption || currentStory.content}
            </Text>
          </View>
        )}

        {/* Navigation Areas */}
        <TouchableOpacity
          style={[styles.storyNavigation, styles.storyLeftNav]}
          onPress={onPrevious}
        />
        <TouchableOpacity
          style={[styles.storyNavigation, styles.storyRightNav]}
          onPress={onNext}
        />
      </View>
    </Modal>
  );
};

// Stories Header Component
const StoriesHeader = ({ 
  stories, 
  onStoryPress, 
  onCreateStory 
}: { 
  stories: Story[]; 
  onStoryPress: (story: Story, index: number) => void; 
  onCreateStory: () => void; 
}) => {
  const { colors } = useThemeStyles();
  const { user } = useAuth();
  const styles = createStyles(colors, false);

  const hasViewedStory = (story: Story) => {
    if (!story.views || !user?.id) return false;
    return story.views.includes(user.id);
  };

  const getUserDisplayName = (user: any) => {
    if (!user) return { username: "user", name: "User" };
    const username = user.username || user.name || user.email?.split("@")[0] || "user";
    return { username, name: user.name || username };
  };

  const currentTime = new Date();
  const validStories = stories.filter(
    (story) => new Date(story.expiresAt) > currentTime
  );

  // Group stories by user to show only one story per user
  const userStoriesMap = new Map();
  validStories.forEach(story => {
    if (!userStoriesMap.has(story.userId)) {
      userStoriesMap.set(story.userId, story);
    }
  });
  const uniqueUserStories = Array.from(userStoriesMap.values());

  return (
    <View style={styles.storiesContainer}>
      <Text style={styles.storiesTitle}>Stories</Text>
      <FlatList
        data={uniqueUserStories}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesList}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => {
          const hasViewed = hasViewedStory(item);
          const userDisplayName = getUserDisplayName(item.user);

          return (
            <TouchableOpacity
              style={styles.storyItem}
              onPress={() => onStoryPress(item, index)}
            >
              <View style={hasViewed ? styles.storyRingSeen : styles.storyRingUnseen}>
                <View style={styles.storyImageContainer}>
                  <Image
                    source={{ uri: item.image || DEFAULT_AVATAR }}
                    style={styles.storyImage}
                  />
                </View>
              </View>
              <Text
                style={[
                  styles.storyUsername,
                  hasViewed && styles.storyUsernameViewed,
                ]}
                numberOfLines={1}
              >
                {userDisplayName.username}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListHeaderComponent={
          <TouchableOpacity style={styles.storyItem} onPress={onCreateStory}>
            <View style={styles.addStoryButton}>
              <Ionicons name="add" size={24} color={colors.primary} />
            </View>
            <Text style={styles.storyUsername}>Your Story</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
};

// Post Action Button Component
const PostActionButton = ({
  icon,
  label,
  count,
  isActive = false,
  onPress,
  activeColor = "#FF3B30",
}: any) => {
  const { colors } = useThemeStyles();
  const styles = createStyles(colors, false);

  return (
    <TouchableOpacity
      style={[styles.actionButton, isActive && styles.actionButtonLiked]}
      onPress={onPress}
    >
      <View style={styles.actionContent}>
        <Ionicons
          name={icon}
          size={20}
          color={isActive ? activeColor : colors.textSecondary}
        />
        <Text style={[styles.actionText, isActive && styles.actionTextLiked]}>
          {label}
        </Text>
        {count > 0 && (
          <Text
            style={[styles.actionCount, isActive && styles.actionCountLiked]}
          >
            {count}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

// SIMPLIFIED Reel Item Component - Direct video control
const ReelItem = ({ 
  item, 
  index, 
  currentVideoIndex,
  onLike,
  onComment,
  onShare,
  onDownload
}: { 
  item: Post; 
  index: number; 
  currentVideoIndex: number;
  onLike: (reelId: string) => void;
  onComment: (reel: Post) => void;
  onShare: (reel: Post) => void;
  onDownload: (reel: Post) => void;
}) => {
  const { colors } = useThemeStyles();
  const styles = createStyles(colors, false);
  const { user } = useAuth();
  const router = useRouter();

  const [isLiked, setIsLiked] = useState(item.isLiked);
  const [likeCount, setLikeCount] = useState(item.likes);
  const [showDoubleTap, setShowDoubleTap] = useState(false);

  const isActive = index === currentVideoIndex;

  const {
    videoRef,
    isPlaying,
    isMuted,
    isBuffering,
    hasError,
    togglePlayPause,
    toggleMute,
    restartVideo,
    setHasError,
  } = useVideoPlayer(item.videoUrl, isActive);

  // Double tap to like functionality
  const lastTap = useRef(0);
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double tap detected
      handleLikeReel();
      setShowDoubleTap(true);
      setTimeout(() => setShowDoubleTap(false), 1000);
    }
    lastTap.current = now;
  };

  const handleLikeReel = async () => {
    if (!item._id) return;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);

    try {
      onLike(item._id);
    } catch (error) {
      // Revert on error
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
    }
  };

  const navigateToUserProfile = (userId: string | undefined, username: string) => {
    if (!userId) return;
    router.push({ pathname: `/UserProfileScreen`, params: { userId } });
  };

  const handlePlayPause = async () => {
    await togglePlayPause();
  };

  return (
    <View style={styles.reelContainer}>
      {/* Video Player */}
      <View style={styles.videoContainer}>
        {item.videoUrl && !hasError ? (
          <>
            <TouchableOpacity 
              style={styles.videoTouchArea} 
              activeOpacity={1}
              onPress={handlePlayPause}
              onPressIn={handleDoubleTap}
            >
              <Video
                ref={videoRef}
                source={{ uri: item.videoUrl }}
                style={styles.video}
                resizeMode={ResizeMode.COVER}
                shouldPlay={isActive} // Let the hook handle this
                isLooping
                isMuted={isMuted}
                useNativeControls={false}
                onError={(error) => {
                  console.error("Video error:", error);
                  setHasError(true);
                }}
                onLoadStart={() => {
                  console.log("Video load started for:", item.id);
                }}
                onLoad={() => {
                  console.log("Video loaded successfully for:", item.id);
                }}
                onPlaybackStatusUpdate={(status) => {
                  if (status.isLoaded) {
                    // Update playing state based on actual playback
                    if (status.isPlaying !== isPlaying) {
                      // This will be handled by the hook
                    }
                  }
                }}
              />

              {/* Double Tap Heart Animation */}
              {showDoubleTap && (
                <View style={styles.doubleTapAnimation}>
                  <Ionicons name="heart" size={120} color="#ffffff" />
                </View>
              )}

              {/* Loading Overlay */}
              {isBuffering && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="white" />
                </View>
              )}

              {/* Play/Pause Overlay - Only show if video is not playing AND it's the active reel */}
              {!isPlaying && isActive && (
                <View style={styles.playPauseOverlay}>
                  <Ionicons name="play" size={60} color="white" />
                </View>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.videoErrorContainer}>
            <Ionicons name="videocam-off-outline" size={50} color="white" />
            <Text style={styles.videoErrorText}>Unable to load video</Text>
            <TouchableOpacity style={styles.retryButton} onPress={restartVideo}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* User Info Overlay */}
      <View style={styles.reelHeader}>
        <TouchableOpacity onPress={() => navigateToUserProfile(item.userId, item.username)}>
          <Image source={{ uri: item.userImage }} style={styles.reelUserAvatar} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigateToUserProfile(item.userId, item.username)}>
          <Text style={styles.reelUsername}>@{item.username}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.followButton}>
          <Text style={styles.followButtonText}>Follow</Text>
        </TouchableOpacity>
      </View>

      {/* Content Overlay */}
      <View style={styles.reelContentOverlay}>
        <Text style={styles.reelText} numberOfLines={3}>{item.content}</Text>
        
        {/* Sound/Music Info */}
        <View style={styles.soundInfo}>
          <Ionicons name="musical-notes" size={16} color="white" />
          <Text style={styles.soundText}>Original Sound</Text>
        </View>
      </View>

      {/* Right Action Buttons (TikTok Style) */}
      <View style={styles.reelActions}>
        <TouchableOpacity style={styles.reelAction} onPress={handleLikeReel}>
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={32}
            color={isLiked ? "#FF3B30" : "white"}
          />
          <Text style={styles.reelActionText}>{likeCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.reelAction} onPress={() => onComment(item)}>
          <Ionicons name="chatbubble-outline" size={32} color="white" />
          <Text style={styles.reelActionText}>{item.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.reelAction} onPress={() => onShare(item)}>
          <Ionicons name="paper-plane-outline" size={32} color="white" />
          <Text style={styles.reelActionText}>{item.shares}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.reelAction} onPress={() => onDownload(item)}>
          <Ionicons name="download-outline" size={32} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.reelAction} onPress={toggleMute}>
          <Ionicons
            name={isMuted ? "volume-mute" : "volume-high"}
            size={28}
            color="white"
          />
        </TouchableOpacity>

        {/* Rotating Music Disc */}
        <View style={styles.musicDisc}>
          <Ionicons name="musical-notes" size={24} color="white" />
        </View>
      </View>
    </View>
  );
};

// Post Item Component
const PostItem = ({ item, onLike, onComment, onShare, onOptions }: { 
  item: Post; 
  onLike: (postId: string) => void;
  onComment: (post: Post) => void;
  onShare: (post: Post) => void;
  onOptions: (post: Post) => void;
}) => {
  const { colors } = useThemeStyles();
  const styles = createStyles(colors, false);
  const router = useRouter();

  const navigateToUserProfile = (userId: string | undefined, username: string) => {
    if (!userId) return;
    router.push({ pathname: `/(tabs)/UserProfileScreen`, params: { userId } });
  };

  return (
    <View style={styles.post}>
      <View style={styles.postHeader}>
        <TouchableOpacity onPress={() => navigateToUserProfile(item.userId, item.username)}>
          <Image source={{ uri: item.userImage }} style={styles.userAvatar} />
        </TouchableOpacity>
        <View style={styles.userInfo}>
          <TouchableOpacity onPress={() => navigateToUserProfile(item.userId, item.username)}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.username}>@{item.username} · {item.time}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.moreButton} onPress={() => onOptions(item)}>
          <Text style={styles.moreText}>⋯</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.content}>{item.content}</Text>

      {item.image && (
        <Image source={{ uri: item.image }} style={styles.postImage} />
      )}

      <View style={styles.postActions}>
        <PostActionButton
          icon={item.isLiked ? "heart" : "heart-outline"}
          label="Like"
          count={item.likes}
          isActive={item.isLiked}
          onPress={() => onLike(item._id || item.id)}
        />
        <PostActionButton
          icon="chatbubble-outline"
          label="Comment"
          count={item.comments}
          onPress={() => onComment(item)}
        />
        <PostActionButton
          icon="share-social-outline"
          label="Share"
          count={item.shares}
          onPress={() => onShare(item)}
        />
      </View>
    </View>
  );
};

// Enhanced Reels FlatList with proper video management
const ReelsFlatList = ({ 
  reels, 
  loading, 
  onRefresh,
  onLikeReel,
  onCommentReel,
  onShareReel,
  onDownloadReel
}: { 
  reels: Post[]; 
  loading: boolean; 
  onRefresh: () => void;
  onLikeReel: (reelId: string) => void;
  onCommentReel: (reel: Post) => void;
  onShareReel: (reel: Post) => void;
  onDownloadReel: (reel: Post) => void;
}) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const isScrolling = useRef(false);

  // Enhanced viewability configuration
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 90,
    minimumViewTime: 100,
  }).current;

  const handleViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0 && !isScrolling.current) {
      const newIndex = viewableItems[0].index;
      if (newIndex !== undefined && newIndex !== currentVideoIndex) {
        console.log(`Switching from reel ${currentVideoIndex} to reel ${newIndex}`);
        setCurrentVideoIndex(newIndex);
      }
    }
  }).current;

  // Handle scroll events for better performance
  const handleScrollBeginDrag = () => {
    isScrolling.current = true;
  };

  const handleScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    isScrolling.current = false;
    
    // Calculate the nearest item index
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / screenHeight);
    
    // Snap to the nearest item
    flatListRef.current?.scrollToIndex({
      index,
      animated: true,
    });
    
    // Update current video index
    setTimeout(() => {
      if (index !== currentVideoIndex) {
        console.log(`Scroll ended: Switching to reel ${index}`);
        setCurrentVideoIndex(index);
      }
    }, 100);
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / screenHeight);
    if (index !== currentVideoIndex) {
      console.log(`Momentum scroll ended: Switching to reel ${index}`);
      setCurrentVideoIndex(index);
    }
  };

  // Initialize audio mode
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      staysActiveInBackground: false,
      playThroughEarpieceAndroid: false,
    }).catch((error) => {
      console.log("Audio mode setting error:", error);
    });
  }, []);

  if (loading) {
    return (
      <View style={createStyles({}, false).loadingContainer}>
        <ActivityIndicator size="large" color="#FF3B30" />
        <Text style={createStyles({}, false).emptyStateText}>Loading reels...</Text>
      </View>
    );
  }

  if (reels.length === 0) {
    return (
      <View style={createStyles({}, false).emptyStateContainer}>
        <Ionicons name="videocam-outline" size={64} color="#666" />
        <Text style={createStyles({}, false).emptyStateText}>No reels found</Text>
        <Text style={[createStyles({}, false).emptyStateText, { fontSize: 14 }]}>
          Reels based on your interests will appear here
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      ref={flatListRef}
      data={reels}
      renderItem={({ item, index }) => (
        <ReelItem
          item={item}
          index={index}
          currentVideoIndex={currentVideoIndex}
          onLike={onLikeReel}
          onComment={onCommentReel}
          onShare={onShareReel}
          onDownload={onDownloadReel}
        />
      )}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      pagingEnabled
      snapToInterval={screenHeight}
      snapToAlignment="start"
      decelerationRate="fast"
      onViewableItemsChanged={handleViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      onScrollBeginDrag={handleScrollBeginDrag}
      onScrollEndDrag={handleScrollEndDrag}
      onMomentumScrollEnd={handleMomentumScrollEnd}
      getItemLayout={(data, index) => ({
        length: screenHeight,
        offset: screenHeight * index,
        index,
      })}
      initialScrollIndex={0}
      maxToRenderPerBatch={3}
      windowSize={5}
      removeClippedSubviews={true}
      style={createStyles({}, false).reelsList}
    />
  );
};

// Main Home Screen Component
export default function HomeScreen() {
  const [fontsLoaded] = useFonts({ Carattere_400Regular });
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [selectedPostForOptions, setSelectedPostForOptions] = useState<Post | null>(null);
  const [activeTab, setActiveTab] = useState<HomeTab>("posts");
  const [userInterests, setUserInterests] = useState<{ [key: string]: number }>({});

  // Story viewer state
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentUserStories, setCurrentUserStories] = useState<Story[]>([]);
  const [progress, setProgress] = useState(0);

  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const { colors } = useThemeStyles();
  const styles = createStyles(colors, fontsLoaded || false);

  const { stories, fetchStories, markStoryAsViewed } = useStories();
  const { posts, reels, loading, fetchPosts, fetchReels } = useContent();
  const { fetchWithAuth } = useApi();

  // Fetch all data
  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts();
      fetchReels();
      fetchStories();
      fetchUserInterests();
    }
  }, [isAuthenticated, fetchPosts, fetchReels, fetchStories]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchPosts();
        fetchReels();
        fetchStories();
        fetchUserInterests();
      }
    }, [fetchPosts, fetchReels, fetchStories, isAuthenticated])
  );

  const fetchUserInterests = useCallback(async () => {
    try {
      if (!user?.id) return;
      const response = await fetchWithAuth(`${INTEREST_API_URL}/interests/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setUserInterests(data);
      }
    } catch (error) {
      console.error("Error fetching user interests:", error);
    }
  }, [user?.id, fetchWithAuth]);

  // Story viewer functions
  const openStory = useCallback((story: Story, index: number) => {
    const userStories = stories.filter((s) => s.userId === story.userId);
    setCurrentUserStories(userStories);
    setCurrentStoryIndex(userStories.findIndex((s) => s._id === story._id));
    setStoryViewerVisible(true);
    setProgress(0);
  }, [stories]);

  const closeStoryViewer = useCallback(() => {
    setStoryViewerVisible(false);
    setCurrentStoryIndex(0);
    setCurrentUserStories([]);
    setProgress(0);
  }, []);

  const nextStory = useCallback(() => {
    if (currentStoryIndex < currentUserStories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setProgress(0);
    } else {
      closeStoryViewer();
    }
  }, [currentStoryIndex, currentUserStories.length, closeStoryViewer]);

  const previousStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setProgress(0);
    }
  }, [currentStoryIndex]);

  // Story progress animation
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    
    if (storyViewerVisible && currentUserStories.length > 0) {
      const currentStory = currentUserStories[currentStoryIndex];
      
      // Mark story as viewed
      if (currentStory && !currentStory.views?.includes(user?.id || "")) {
        markStoryAsViewed(currentStory._id);
      }

      const interval = 50;
      const steps = STORY_DURATION / interval;
      let currentStep = 0;

      progressInterval = setInterval(() => {
        currentStep++;
        setProgress((currentStep / steps) * 100);

        if (currentStep >= steps) {
          nextStory();
        }
      }, interval);
    }

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [storyViewerVisible, currentStoryIndex, currentUserStories, user?.id, markStoryAsViewed, nextStory]);

  // Post actions
  const likePost = useCallback(async (postId: string) => {
    if (!postId) return;

    try {
      await fetchWithAuth(`${API_BASE_URL}/posts/${postId}/like`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error liking post:", error);
    }
  }, [fetchWithAuth]);

  const likeReel = useCallback(async (reelId: string) => {
    if (!reelId) return;

    try {
      await fetchWithAuth(`${API_BASE_URL}/reels/${reelId}/like`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error liking reel:", error);
    }
  }, [fetchWithAuth]);

  const addComment = useCallback(async (postId: string) => {
    if (!newComment.trim() || !postId) return;

    try {
      await fetchWithAuth(`${API_BASE_URL}/posts/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      setNewComment("");
      setCommentModalVisible(false);
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  }, [newComment, fetchWithAuth]);

  const sharePost = useCallback(async (post: Post) => {
    if (!post._id) return;

    try {
      await fetchWithAuth(`${API_BASE_URL}/posts/${post._id}/share`, {
        method: "POST",
      });
      Alert.alert("Success", "Post shared successfully");
    } catch (error) {
      console.error("Error sharing post:", error);
    }
  }, [fetchWithAuth]);

  const downloadReel = useCallback(async (reel: Post) => {
    if (!reel.streamableShortcode) {
      Alert.alert("Error", "No Streamable video code available");
      return;
    }

    try {
      const response = await fetch(`https://api.streamable.com/videos/${reel.streamableShortcode}`);
      if (response.ok) {
        const data = await response.json();
        if (data.files?.mp4?.url) {
          const destination = new Directory(Paths.cache, "reels");
          
          if (!(await destination.exists)) {
            await destination.create();
          }

          const output = await File.downloadFileAsync(data.files.mp4.url, destination);

          if (output.exists) {
            const permission = await MediaLibrary.requestPermissionsAsync();
            if (permission.granted) {
              await MediaLibrary.createAssetAsync(output.uri);
              Alert.alert("Success", "Reel downloaded to your gallery!");
            } else {
              Alert.alert("Success", "Reel downloaded to app storage!");
            }
          }
        }
      }
    } catch (error) {
      console.error("Error downloading reel:", error);
      Alert.alert("Error", "Failed to download reel");
    }
  }, []);

  // Content rendering components
  const PostsFlatList = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.emptyStateText}>Loading posts...</Text>
        </View>
      );
    }

    if (posts.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="newspaper-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyStateText}>No posts found</Text>
          <Text style={[styles.emptyStateText, { fontSize: 14 }]}>
            Posts based on your interests will appear here
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={posts.filter((post) => post.type === "post")}
        renderItem={({ item }) => (
          <PostItem
            item={item}
            onLike={likePost}
            onComment={(post) => {
              setSelectedPost(post);
              setCommentModalVisible(true);
            }}
            onShare={sharePost}
            onOptions={(post) => {
              setSelectedPostForOptions(post);
              setOptionsModalVisible(true);
            }}
          />
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={fetchPosts}
      />
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "posts":
        return <PostsFlatList />;
      case "reels":
        return (
          <ReelsFlatList
            reels={reels}
            loading={loading}
            onRefresh={fetchReels}
            onLikeReel={likeReel}
            onCommentReel={(reel) => {
              setSelectedPost(reel);
              setCommentModalVisible(true);
            }}
            onShareReel={sharePost}
            onDownloadReel={downloadReel}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.appHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.appTitle}>SmartConnect</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.messageIcon}
            onPress={() => router.push("/messages")}
          >
            <Ionicons name="paper-plane-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <StoriesHeader
        stories={stories}
        onStoryPress={openStory}
        onCreateStory={() => router.push("/create-story")}
      />

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

      <StoryViewer
        visible={storyViewerVisible}
        stories={currentUserStories}
        currentIndex={currentStoryIndex}
        onClose={closeStoryViewer}
        onNext={nextStory}
        onPrevious={previousStory}
        progress={progress}
      />

      {/* Comment Modal */}
      <Modal
        visible={commentModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCommentModalVisible(false)}
      >
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
                style={[
                  styles.commentSubmitButton,
                  !newComment.trim() && styles.commentSubmitDisabled,
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
        transparent
        onRequestClose={() => setOptionsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setOptionsModalVisible(false)}
        >
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

// Styles
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
      paddingHorizontal: 18,
      marginTop: 18,
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
    storiesContainer: {
      backgroundColor: colors.surface,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    storiesTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 12,
      paddingHorizontal: 16,
    },
    storiesList: {
      paddingHorizontal: 8,
    },
    storyItem: {
      alignItems: "center",
      marginHorizontal: 8,
      width: 68,
    },
    storyRingUnseen: {
      width: 68,
      height: 68,
      borderRadius: 34,
      padding: 2,
      backgroundColor: colors.primary,
    },
    storyRingSeen: {
      width: 68,
      height: 68,
      borderRadius: 34,
      padding: 2,
      backgroundColor: 'transparent',
    },
    storyImageContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
      borderWidth: 2,
      borderColor: colors.surface,
    },
    storyImage: {
      width: 60,
      height: 60,
      borderRadius: 30,
    },
    addStoryButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: colors.border,
    },
    storyUsername: {
      fontSize: 12,
      color: colors.text,
      marginTop: 4,
      textAlign: "center",
    },
    storyUsernameViewed: {
      color: colors.textSecondary,
    },
    storyViewerContainer: {
      flex: 1,
      backgroundColor: "#000",
    },
    storyHeader: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      position: "absolute",
      top: 40,
      left: 0,
      right: 0,
      zIndex: 10,
    },
    storyProgressContainer: {
      flexDirection: "row",
      paddingHorizontal: 16,
      position: "absolute",
      top: 16,
      left: 0,
      right: 0,
      zIndex: 10,
    },
    storyProgressBar: {
      flex: 1,
      height: 2,
      backgroundColor: "rgba(255,255,255,0.4)",
      marginHorizontal: 2,
      borderRadius: 1,
    },
    storyProgressFill: {
      height: "100%",
      backgroundColor: "#ffffff",
      borderRadius: 1,
    },
    storyViewerAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginRight: 8,
    },
    storyViewerUsername: {
      color: "white",
      fontSize: 14,
      fontWeight: "600",
      flex: 1,
    },
    storyViewerTime: {
      color: "white",
      fontSize: 12,
      opacity: 0.8,
    },
    storyViewerClose: {
      padding: 4,
    },
    storyMedia: {
      width: "100%",
      height: "100%",
    },
    storyCaption: {
      position: "absolute",
      bottom: 100,
      left: 16,
      right: 16,
    },
    storyCaptionText: {
      color: "white",
      fontSize: 16,
      fontWeight: "500",
      textAlign: "center",
    },
    storyNavigation: {
      position: "absolute",
      top: 0,
      bottom: 0,
      width: "30%",
    },
    storyLeftNav: {
      left: 0,
    },
    storyRightNav: {
      right: 0,
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
    reelsList: {
      flex: 1,
    },
    reelContainer: {
      height: screenHeight,
      backgroundColor: "#000",
      position: 'relative',
    },
    reelHeader: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      position: "absolute",
      top: 50,
      left: 0,
      right: 0,
      zIndex: 20,
    },
    reelUserAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    reelUsername: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
      flex: 1,
    },
    followButton: {
      backgroundColor: "#FF3B30",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    followButtonText: {
      color: "white",
      fontSize: 14,
      fontWeight: "600",
    },
    videoContainer: {
      flex: 1,
      backgroundColor: "#000",
    },
    videoTouchArea: {
      flex: 1,
      position: 'relative',
    },
    video: {
      width: "100%",
      height: "100%",
    },
    reelContentOverlay: {
      position: "absolute",
      bottom: 120,
      left: 16,
      right: 120,
      zIndex: 15,
    },
    reelText: {
      color: "white",
      fontSize: 16,
      fontWeight: "500",
      marginBottom: 8,
      textShadowColor: 'rgba(0,0,0,0.8)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 3,
    },
    soundInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    soundText: {
      color: "white",
      fontSize: 14,
      fontWeight: "500",
      marginLeft: 6,
      textShadowColor: 'rgba(0,0,0,0.8)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 3,
    },
    reelActions: {
      position: "absolute",
      right: 16,
      bottom: 120,
      alignItems: "center",
      gap: 25,
      zIndex: 15,
    },
    reelAction: {
      alignItems: "center",
    },
    reelActionText: {
      color: "white",
      fontSize: 14,
      marginTop: 4,
      fontWeight: "600",
      textShadowColor: 'rgba(0,0,0,0.8)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 3,
    },
    musicDisc: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    doubleTapAnimation: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      marginLeft: -60,
      marginTop: -60,
      zIndex: 30,
    },
    playPauseOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.3)',
      zIndex: 25,
    },
    videoErrorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#000",
    },
    videoErrorText: {
      color: "white",
      fontSize: 16,
      marginTop: 10,
      marginBottom: 20,
    },
    retryButton: {
      backgroundColor: '#FF3B30',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    retryButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    loadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.3)",
      zIndex: 20,
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
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 10,
    },
  });