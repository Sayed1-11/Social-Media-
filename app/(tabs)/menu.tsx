import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

import { useThemeStyles } from '../../hooks/useThemeStyles';

export default function MenuScreen() {
  const router = useRouter();
  const { theme, toggleTheme, setTheme } = useTheme();
  const { colors, isDark } = useThemeStyles();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const menuSections = [
    {
      title: 'Account',
      items: [
        {
          icon: 'person-outline',
          title: 'Edit Profile',
          onPress: () => console.log('Edit Profile'),
        },
        {
          icon: 'lock-closed-outline',
          title: 'Privacy & Security',
          onPress: () => console.log('Privacy & Security'),
        },
        {
          icon: 'people-outline',
          title: 'Followers & Following',
          onPress: () => console.log('Followers'),
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: 'notifications-outline',
          title: 'Push Notifications',
          type: 'switch',
          value: notificationsEnabled,
          onValueChange: setNotificationsEnabled,
        },
        {
          icon: 'moon-outline',
          title: 'Dark Mode',
          type: 'switch',
          value: isDark,
          onValueChange: (value: boolean) => {
            setTheme(value ? 'dark' : 'light');
          },
        },
        {
          icon: 'language-outline',
          title: 'Language',
          subtitle: 'English',
          onPress: () => console.log('Language'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle-outline',
          title: 'Help & Support',
          onPress: () => console.log('Help'),
        },
        {
          icon: 'document-text-outline',
          title: 'Terms of Service',
          onPress: () => console.log('Terms'),
        },
        {
          icon: 'shield-checkmark-outline',
          title: 'Privacy Policy',
          onPress: () => console.log('Privacy Policy'),
        },
        {
          icon: 'information-circle-outline',
          title: 'About',
          onPress: () => console.log('About'),
        },
      ],
    },
    {
      title: 'Actions',
      items: [
        {
          icon: 'log-out-outline',
          title: 'Log Out',
          color: colors.accent,
          onPress: () => console.log('Log Out'),
        },
      ],
    },
  ];

  const styles = createStyles(colors);

  const renderMenuItem = (item: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.menuItem}
      onPress={item.onPress}
      disabled={item.type === 'switch'}
    >
      <View style={styles.menuItemLeft}>
        <Ionicons 
          name={item.icon as any} 
          size={22} 
          color={item.color || colors.text} 
          style={styles.menuIcon}
        />
        <View style={styles.menuTextContainer}>
          <Text style={[styles.menuItemTitle, item.color && { color: item.color }]}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
          )}
        </View>
      </View>

      {item.type === 'switch' ? (
        <Switch
          value={item.value}
          onValueChange={item.onValueChange}
          trackColor={{ false: '#767577', true: colors.accent }}
          thumbColor={item.value ? '#fff' : '#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
        />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      )}
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
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color={colors.text} />
            </View>
            <View style={styles.avatarBadge}>
              <Ionicons name="camera" size={12} color="#fff" />
            </View>
          </View>
          <Text style={styles.userName}>John Doe</Text>
          <Text style={styles.userHandle}>@johndoe</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>245</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>1.2K</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>456</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        <View style={styles.menuSections}>
          {menuSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionContent}>
                {section.items.map(renderMenuItem)}
              </View>
            </View>
          ))}
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>SocialApp v1.0.0 • {theme} mode</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.accent,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  userName: {
    color: colors.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userHandle: {
    color: colors.textSecondary,
    fontSize: 16,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  menuSections: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    marginRight: 12,
    width: 24,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  menuItemSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});