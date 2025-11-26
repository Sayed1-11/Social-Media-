// app/_layout.tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';

// Loading Modal Component
function LoadingModal({ visible, message = "Loading..." }: { visible: boolean; message?: string }) {
  const { colors } = useThemeStyles();
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}

function RootLayoutNav() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Show loading modal and then redirect to tabs
      setShowLoadingModal(true);
      setRedirecting(true);
      
      // Simulate loading time (you can adjust this)
      const timer = setTimeout(() => {
        setShowLoadingModal(false);
        router.replace('/(tabs)');
        setRedirecting(false);
      }, 2000); // 2 seconds loading

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, segments, isLoading]);

  // Show loading modal while checking auth state or redirecting
  if (isLoading || redirecting) {
    return (
      <>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
        <LoadingModal 
          visible={showLoadingModal || isLoading} 
          message={isLoading ? "Checking authentication..." : "Setting up your experience..."}
        />
      </>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen 
              name="create-post" 
              options={{ 
                presentation: 'modal',
                title: 'Create Post',
              }} 
            />
            <Stack.Screen 
              name="map" 
              options={{ 
                presentation: 'modal',
                title: 'Location',
              }} 
            />
          </>
        )}
      </Stack>
      
      {/* Loading Modal */}
      <LoadingModal visible={showLoadingModal} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});