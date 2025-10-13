import { useThemeStyles } from '@/hooks/useThemeStyles';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
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
};

type CreateStoryType = {
  type: 'image' | 'video';
  url: string;
  duration: number;
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


const enhancedStories: StoryType[] = [
  {
    id: '1',
    username: 'currentuser',
    name: 'Your Story',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
    hasNewStory: true,
    isUser: true,
    stories: [
      {
        id: '1-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1579546929662-711aa81148cf?w=400&h=800&fit=crop',
        duration: 5,
        seen: false,
        timestamp: '2 hours ago'
      },
      {
        id: '1-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=800&fit=crop',
        duration: 6,
        seen: false,
        timestamp: '1 hour ago'
      }
    ]
  },
  {
    id: '2',
    username: 'johndoe',
    name: 'John Doe',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    hasNewStory: true,
    isUser: false,
    stories: [
      {
        id: '2-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=800&fit=crop',
        duration: 6,
        seen: false,
        timestamp: '1 hour ago'
      },
      {
        id: '2-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=400&h=800&fit=crop',
        duration: 5,
        seen: false,
        timestamp: '45 minutes ago'
      },
      {
        id: '2-3',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1511376777868-611b54f68947?w=400&h=800&fit=crop',
        duration: 7,
        seen: false,
        timestamp: '30 minutes ago'
      }
    ]
  },
  {
    id: '3',
    username: 'sarahdev',
    name: 'Sarah Developer',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    hasNewStory: true,
    isUser: false,
    stories: [
      {
        id: '3-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=800&fit=crop',
        duration: 7,
        seen: false,
        timestamp: '3 hours ago'
      },
      {
        id: '3-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=800&fit=crop',
        duration: 5,
        seen: false,
        timestamp: '2 hours ago'
      }
    ]
  },
  {
    id: '4',
    username: 'mikecoder',
    name: 'Mike Coder',
    avatar: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=150&h=150&fit=crop&crop=face',
    hasNewStory: false,
    isUser: false,
    stories: [
      {
        id: '4-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=800&fit=crop',
        duration: 6,
        seen: true,
        timestamp: '5 hours ago'
      },
      {
        id: '4-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&h=800&fit=crop',
        duration: 5,
        seen: true,
        timestamp: '4 hours ago'
      }
    ]
  },
  {
    id: '5',
    username: 'emilydesign',
    name: 'Emily Designer',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    hasNewStory: true,
    isUser: false,
    stories: [
      {
        id: '5-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1545235617-9465d2a55698?w=400&h=800&fit=crop',
        duration: 8,
        seen: false,
        timestamp: 'Just now'
      },
      {
        id: '5-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=400&h=800&fit=crop',
        duration: 6,
        seen: false,
        timestamp: '10 minutes ago'
      }
    ]
  },
  {
    id: '6',
    username: 'alextech',
    name: 'Alex Tech',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    hasNewStory: false,
    isUser: false,
    stories: [
      {
        id: '6-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=800&fit=crop',
        duration: 5,
        seen: true,
        timestamp: '8 hours ago'
      }
    ]
  },
  {
    id: '7',
    username: 'lisatravel',
    name: 'Lisa Travel',
    avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&h=150&fit=crop&crop=face',
    hasNewStory: true,
    isUser: false,
    stories: [
      {
        id: '7-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=800&fit=crop',
        duration: 7,
        seen: false,
        timestamp: '45 minutes ago'
      },
      {
        id: '7-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=800&fit=crop',
        duration: 6,
        seen: false,
        timestamp: '30 minutes ago'
      },
      {
        id: '7-3',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&h=800&fit=crop',
        duration: 8,
        seen: false,
        timestamp: '15 minutes ago'
      }
    ]
  },
  {
    id: '8',
    username: 'davidfood',
    name: 'David Foodie',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    hasNewStory: true,
    isUser: false,
    stories: [
      {
        id: '8-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=800&fit=crop',
        duration: 5,
        seen: false,
        timestamp: '1 hour ago'
      },
      {
        id: '8-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=800&fit=crop',
        duration: 6,
        seen: false,
        timestamp: '45 minutes ago'
      }
    ]
  },
  {
    id: '9',
    username: 'sophiaart',
    name: 'Sophia Art',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
    hasNewStory: true,
    isUser: false,
    stories: [
      {
        id: '9-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=800&fit=crop',
        duration: 8,
        seen: false,
        timestamp: '2 hours ago'
      },
      {
        id: '9-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&h=800&fit=crop',
        duration: 7,
        seen: false,
        timestamp: '1 hour ago'
      }
    ]
  },
  {
    id: '10',
    username: 'ryanfitness',
    name: 'Ryan Fitness',
    avatar: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face',
    hasNewStory: true,
    isUser: false,
    stories: [
      {
        id: '10-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=800&fit=crop',
        duration: 6,
        seen: false,
        timestamp: '3 hours ago'
      },
      {
        id: '10-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=800&fit=crop',
        duration: 5,
        seen: false,
        timestamp: '2 hours ago'
      }
    ]
  },
  {
    id: '11',
    username: 'oliviamusic',
    name: 'Olivia Music',
    avatar: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face',
    hasNewStory: false,
    isUser: false,
    stories: [
      {
        id: '11-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=800&fit=crop',
        duration: 7,
        seen: true,
        timestamp: '12 hours ago'
      }
    ]
  },
  {
    id: '12',
    username: 'techguru',
    name: 'Tech Guru',
    avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=150&h=150&fit=crop&crop=face',
    hasNewStory: true,
    isUser: false,
    stories: [
      {
        id: '12-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=800&fit=crop',
        duration: 5,
        seen: false,
        timestamp: 'Just now'
      },
      {
        id: '12-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=800&fit=crop',
        duration: 6,
        seen: false,
        timestamp: '5 minutes ago'
      }
    ]
  },
  {
    id: '13',
    username: 'naturelover',
    name: 'Nature Lover',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    hasNewStory: true,
    isUser: false,
    stories: [
      {
        id: '13-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=800&fit=crop',
        duration: 8,
        seen: false,
        timestamp: '4 hours ago'
      },
      {
        id: '13-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400&h=800&fit=crop',
        duration: 7,
        seen: false,
        timestamp: '3 hours ago'
      }
    ]
  },
  {
    id: '14',
    username: 'fashionista',
    name: 'Fashionista',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    hasNewStory: true,
    isUser: false,
    stories: [
      {
        id: '14-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=800&fit=crop',
        duration: 6,
        seen: false,
        timestamp: '6 hours ago'
      },
      {
        id: '14-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=800&fit=crop',
        duration: 5,
        seen: false,
        timestamp: '5 hours ago'
      }
    ]
  },
  {
    id: '15',
    username: 'gamerpro',
    name: 'Gamer Pro',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    hasNewStory: false,
    isUser: false,
    stories: [
      {
        id: '15-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=800&fit=crop',
        duration: 7,
        seen: true,
        timestamp: '1 day ago'
      }
    ]
  },
  {
    id: '16',
    username: 'bookworm',
    name: 'Book Worm',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
    hasNewStory: true,
    isUser: false,
    stories: [
      {
        id: '16-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=800&fit=crop',
        duration: 8,
        seen: false,
        timestamp: '7 hours ago'
      },
      {
        id: '16-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=800&fit=crop',
        duration: 6,
        seen: false,
        timestamp: '6 hours ago'
      }
    ]
  },
  {
    id: '17',
    username: 'coffeelover',
    name: 'Coffee Lover',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    hasNewStory: true,
    isUser: false,
    stories: [
      {
        id: '17-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=800&fit=crop',
        duration: 5,
        seen: false,
        timestamp: '2 hours ago'
      },
      {
        id: '17-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=800&fit=crop',
        duration: 6,
        seen: false,
        timestamp: '1 hour ago'
      }
    ]
  },
  {
    id: '18',
    username: 'petlover',
    name: 'Pet Lover',
    avatar: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face',
    hasNewStory: true,
    isUser: false,
    stories: [
      {
        id: '18-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=800&fit=crop',
        duration: 7,
        seen: false,
        timestamp: '3 hours ago'
      },
      {
        id: '18-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1560809459-56b19b4ac6ba?w=400&h=800&fit=crop',
        duration: 6,
        seen: false,
        timestamp: '2 hours ago'
      }
    ]
  },
  {
    id: '19',
    username: 'adventure_seeker',
    name: 'Adventure Seeker',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    hasNewStory: true,
    isUser: false,
    stories: [
      {
        id: '19-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1464822759844-d62ed505c4ce?w=400&h=800&fit=crop',
        duration: 8,
        seen: false,
        timestamp: '5 hours ago'
      },
      {
        id: '19-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=800&fit=crop',
        duration: 7,
        seen: false,
        timestamp: '4 hours ago'
      }
    ]
  },
  {
    id: '20',
    username: 'homechef',
    name: 'Home Chef',
    avatar: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face',
    hasNewStory: false,
    isUser: false,
    stories: [
      {
        id: '20-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=800&fit=crop',
        duration: 6,
        seen: true,
        timestamp: '2 days ago'
      }
    ]
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
   storyCircleLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
    backgroundColor: colors.surface,
  },
  storyImageLarge: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  storyPreviewContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  storyHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 1001,
  },
  storyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  storyUsername: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  storyTime: {
    color: 'white',
    fontSize: 12,
    opacity: 0.8,
  },
  progressBarContainer: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 4,
    zIndex: 1001,
  },
  progressBar: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'white',
  },
  storyContent: {
    width: '100%',
    height: '80%',
    borderRadius: 10,
  },
  storyNavigation: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '30%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 1001,
    padding: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '300',
  },

  // Story Creation Styles
  createStoryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  createStoryText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  createStoryModal: {
    backgroundColor: colors.surface,
    margin: 20,
    borderRadius: 15,
    padding: 20,
    maxWidth: 500,
    width: '90%',
    alignSelf: 'center',
  },
  createStoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  storyInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    marginBottom: 16,
  },
  storyPreview: {
    width: '100%',
    height: 400,
    borderRadius: 10,
    marginBottom: 16,
    backgroundColor: colors.background,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.accent,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  fileInput: {
    marginBottom: 16,
  },
  fileInputText: {
    color: colors.accent,
    fontWeight: '600',
    textAlign: 'center',
    padding: 12,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 10,
    borderStyle: 'dashed',
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
  
  // Story states
  const [stories, setStories] = useState<StoryType[]>(enhancedStories);
  const [storyModalVisible, setStoryModalVisible] = useState(false);
  const [currentStory, setCurrentStory] = useState<{story: StoryType, index: number} | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  
  // Story creation states
  const [createStoryModalVisible, setCreateStoryModalVisible] = useState(false);
  const [newStory, setNewStory] = useState<CreateStoryType>({
    type: 'image',
    url: '',
    duration: 5
  });
  const [storyImage, setStoryImage] = useState<string>('');

  const { colors } = useThemeStyles();
  const openStory = (story: StoryType, storyIndex: number = 0) => {
    setCurrentStory({ story, index: storyIndex });
    setCurrentStoryIndex(storyIndex);
    setProgress(0);
    setStoryModalVisible(true);
    
    // Mark story as seen
    setStories(prev => prev.map(s => 
      s.id === story.id 
        ? {
            ...s,
            stories: s.stories.map((st, idx) => 
              idx === storyIndex ? { ...st, seen: true } : st
            ),
            hasNewStory: s.stories.some(st => !st.seen)
          }
        : s
    ));
  };

  const nextStory = () => {
    if (!currentStory) return;
    
    const nextIndex = currentStoryIndex + 1;
    if (nextIndex < currentStory.story.stories.length) {
      setCurrentStoryIndex(nextIndex);
      setProgress(0);
    } else {
      // Move to next user's story
      const currentIndex = stories.findIndex(s => s.id === currentStory.story.id);
      if (currentIndex < stories.length - 1) {
        openStory(stories[currentIndex + 1], 0);
      } else {
        setStoryModalVisible(false);
      }
    }
  };

  const previousStory = () => {
    if (!currentStory) return;
    
    const prevIndex = currentStoryIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStoryIndex(prevIndex);
      setProgress(0);
    } else {
      // Move to previous user's story
      const currentIndex = stories.findIndex(s => s.id === currentStory.story.id);
      if (currentIndex > 0) {
        const prevUserStories = stories[currentIndex - 1].stories;
        openStory(stories[currentIndex - 1], prevUserStories.length - 1);
      }
    }
  };

  // Progress bar animation
  useEffect(() => {
    if (!storyModalVisible || !currentStory) return;
    
    const duration = currentStory.story.stories[currentStoryIndex].duration * 1000;
    const interval = 50;
    const steps = duration / interval;
    const increment = 100 / steps;
    
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          nextStory();
          return 0;
        }
        return prev + increment;
      });
    }, interval);
    
    return () => clearInterval(timer);
  }, [storyModalVisible, currentStory, currentStoryIndex]);

  // Story creation functions
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setStoryImage(imageUrl);
        setNewStory(prev => ({ ...prev, url: imageUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const createNewStory = () => {
    if (!newStory.url.trim()) {
      Alert.alert('Error', 'Please select an image for your story');
      return;
    }

    const newStoryItem = {
      id: Date.now().toString(),
      type: 'image' as const,
      url: newStory.url,
      duration: newStory.duration,
      seen: false,
      timestamp: 'Just now'
    };

    setStories(prev => prev.map(story => 
      story.isUser 
        ? {
            ...story,
            hasNewStory: true,
            stories: [newStoryItem, ...story.stories]
          }
        : story
    ));

    setCreateStoryModalVisible(false);
    setNewStory({ type: 'image', url: '', duration: 5 });
    setStoryImage('');
    Alert.alert('Success', 'Your story has been posted!');
  };

  // Enhanced story render function
  const renderStory = ({ item }: { item: StoryType }) => (
    <TouchableOpacity 
      style={styles.storyContainer}
      onPress={() => openStory(item, 0)}
    >
      <View style={[
        styles.storyCircleLarge,
        item.hasNewStory && styles.hasNewStory,
        item.isUser && styles.userStory
      ]}>
        <Image 
          source={{ uri: item.avatar }} 
          style={styles.storyImageLarge}
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

  // Story Preview Modal
  const renderStoryPreview = () => {
    if (!currentStory) return null;
    
    const currentStoryItem = currentStory.story.stories[currentStoryIndex];
    
    return (
      <Modal
        visible={storyModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setStoryModalVisible(false)}
      >
        <View style={styles.storyPreviewContainer}>
          {/* Progress Bars */}
          <View style={styles.progressBarContainer}>
            {currentStory.story.stories.map((_, index) => (
              <View key={index} style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressBarFill,
                    { 
                      width: index === currentStoryIndex 
                        ? `${progress}%` 
                        : index < currentStoryIndex ? '100%' : '0%' 
                    }
                  ]} 
                />
              </View>
            ))}
          </View>

          {/* Story Header */}
          <View style={styles.storyHeader}>
            <Image 
              source={{ uri: currentStory.story.avatar }} 
              style={styles.storyAvatar}
            />
            <View>
              <Text style={styles.storyUsername}>{currentStory.story.name}</Text>
              <Text style={styles.storyTime}>{currentStoryItem.timestamp}</Text>
            </View>
          </View>

          {/* Story Content */}
          <Image 
            source={{ uri: currentStoryItem.url }} 
            style={styles.storyContent}
            resizeMode="contain"
          />

          {/* Navigation Areas */}
          <TouchableOpacity 
            style={[styles.storyNavigation, { left: 0 }]}
            onPress={previousStory}
          />
          <TouchableOpacity 
            style={[styles.storyNavigation, { right: 0 }]}
            onPress={nextStory}
          />

          {/* Close Button */}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setStoryModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };

  // Story Creation Modal
  const renderCreateStoryModal = () => (
    <Modal
      visible={createStoryModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setCreateStoryModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.createStoryModal}>
          <Text style={styles.createStoryTitle}>Create New Story</Text>
          
          {/* Image Upload */}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
            id="story-upload"
          />
          <label htmlFor="story-upload">
            <View style={styles.fileInput}>
              <Text style={styles.fileInputText}>
                {storyImage ? 'Change Image' : 'Choose Image'}
              </Text>
            </View>
          </label>

          {/* Image Preview */}
          {storyImage && (
            <Image 
              source={{ uri: storyImage }} 
              style={styles.storyPreview}
              resizeMode="cover"
            />
          )}

          {/* Duration Input */}
          <TextInput
            style={styles.storyInput}
            placeholder="Duration in seconds (5-10)"
            value={newStory.duration.toString()}
            onChangeText={(text) => {
              const duration = parseInt(text) || 5;
              setNewStory(prev => ({ 
                ...prev, 
                duration: Math.min(Math.max(duration, 3), 10) 
              }));
            }}
            keyboardType="numeric"
            placeholderTextColor={colors.textSecondary}
          />

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => setCreateStoryModalVisible(false)}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={createNewStory}
              disabled={!storyImage}
            >
              <Text style={styles.primaryButtonText}>Post Story</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

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
        
        {/* Create Story Button */}
        <TouchableOpacity 
          style={styles.createStoryButton}
          onPress={() => setCreateStoryModalVisible(true)}
        >
          <Text style={styles.createStoryText}>+ Create Story</Text>
        </TouchableOpacity>
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
 {renderStoryPreview()}
      {renderCreateStoryModal()}
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
 
