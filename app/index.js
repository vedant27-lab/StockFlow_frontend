import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { deleteFolder, getFolders, getUsername, isAuthenticated, logout, updateFolder } from '../services/api';

const screenWidth = Dimensions.get("window").width;

export default function HomeScreen() {
  const router = useRouter();
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState('');

  // Folder Management State
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [editFolderName, setEditFolderName] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const folderData = await getFolders();
      setFolders(folderData);

      // Check authentication status
      const isAuth = await isAuthenticated();
      setAuthenticated(isAuth);
      if (isAuth) {
        const user = await getUsername();
        setUsername(user);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const handleLogin = () => {
    router.push('/login');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            await logout();
            setAuthenticated(false);
            setUsername('');
            Alert.alert('Success', 'Logged out successfully');
          }
        }
      ]
    );
  };

  // Folder Management Functions
  const handleFolderLongPress = (folder) => {
    if (!authenticated) {
      Alert.alert(
        'Admin Access Required',
        'Please login as admin to edit or delete folders.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: handleLogin }
        ]
      );
      return;
    }
    setSelectedFolder(folder);
    setEditFolderName(folder.name);
    setShowFolderModal(true);
  };

  const handleEditFolder = async () => {
    if (!editFolderName.trim()) {
      Alert.alert('Error', 'Folder name cannot be empty');
      return;
    }
    try {
      await updateFolder(selectedFolder.id, editFolderName);
      setShowFolderModal(false);
      loadData();
    } catch (e) {
      if (e.response?.data?.code === 'AUTH_REQUIRED' || e.response?.data?.code === 'INVALID_TOKEN') {
        Alert.alert('Session Expired', 'Please login again to continue.', [
          { text: 'OK', onPress: handleLogin }
        ]);
      } else {
        Alert.alert('Error', 'Failed to update folder');
      }
    }
  };

  const handleDeleteFolder = () => {
    Alert.alert(
      'Delete Folder?',
      `Are you sure you want to delete "${selectedFolder.name}"? All products inside will be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFolder(selectedFolder.id);
              setShowFolderModal(false);
              loadData();
            } catch (e) {
              if (e.response?.data?.code === 'AUTH_REQUIRED' || e.response?.data?.code === 'INVALID_TOKEN') {
                Alert.alert('Session Expired', 'Please login again to continue.', [
                  { text: 'OK', onPress: handleLogin }
                ]);
              } else {
                Alert.alert('Error', 'Failed to delete folder');
              }
            }
          }
        }
      ]
    );
  };

  const handleCreateFolder = () => {
    if (!authenticated) {
      Alert.alert(
        'Admin Access Required',
        'Please login as admin to create folders.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: handleLogin }
        ]
      );
      return;
    }
    router.push("/create-folder");
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>StockFlow</Text>
              <Text style={styles.headerSubtitle}>Manage your inventory with ease</Text>
            </View>
            {authenticated ? (
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.loginButtonText}>Login</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Auth Status Badge */}
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, authenticated && styles.statusDotActive]} />
            <Text style={styles.statusText}>
              {authenticated ? `Admin: ${username}` : 'View-Only Mode'}
            </Text>
          </View>
        </View>

        {/* Folders Grid */}
        <View style={styles.foldersSection}>
          <Text style={styles.sectionTitle}>Your Folders</Text>

          {folders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📁</Text>
              <Text style={styles.emptyText}>No folders yet</Text>
              <Text style={styles.emptySubtext}>Tap the + button to create your first folder</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {folders.map((folder) => (
                <TouchableOpacity
                  key={folder.id}
                  style={styles.folderCard}
                  onPress={() => router.push({ pathname: "/folder/[id]", params: { id: folder.id, name: folder.name } })}
                  onLongPress={() => handleFolderLongPress(folder)}
                  activeOpacity={0.7}
                >
                  <View style={styles.folderIconContainer}>
                    <Text style={styles.folderIcon}>📂</Text>
                  </View>
                  <Text style={styles.folderName} numberOfLines={2}>{folder.name}</Text>
                  <View style={styles.folderFooter}>
                    <Text style={styles.folderHint}>Tap to open</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateFolder}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Folder Management Modal */}
      <Modal visible={showFolderModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFolderModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage Folder</Text>
              <TouchableOpacity onPress={() => setShowFolderModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Folder Name</Text>
              <TextInput
                style={styles.modalInput}
                value={editFolderName}
                onChangeText={setEditFolderName}
                placeholder="Enter folder name"
                placeholderTextColor="#999"
              />

              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleEditFolder}
              >
                <Text style={styles.modalButtonText}>💾 Save Changes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={handleDeleteFolder}
              >
                <Text style={[styles.modalButtonText, styles.deleteButtonText]}>🗑️ Delete Folder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6c757d',
    fontWeight: '400'
  },
  loginButton: {
    backgroundColor: '#4e73df',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600'
  },
  logoutButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc3545'
  },
  logoutButtonText: {
    color: '#dc3545',
    fontSize: 13,
    fontWeight: '600'
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start'
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6c757d',
    marginRight: 8
  },
  statusDotActive: {
    backgroundColor: '#1cc88a'
  },
  statusText: {
    fontSize: 12,
    color: '#495057',
    fontWeight: '600'
  },

  // Folders Section
  foldersSection: {
    paddingHorizontal: 20,
    paddingTop: 24
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6
  },

  // Folder Card
  folderCard: {
    width: screenWidth / 2 - 26,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    margin: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 140,
    justifyContent: 'space-between'
  },
  folderIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  folderIcon: {
    fontSize: 28
  },
  folderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 22
  },
  folderFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
    marginTop: 4
  },
  folderHint: {
    fontSize: 11,
    color: '#6c757d',
    fontWeight: '500'
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
    marginTop: -2
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a'
  },
  modalClose: {
    fontSize: 24,
    color: '#6c757d',
    fontWeight: '300'
  },
  modalBody: {
    padding: 20
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 16,
    backgroundColor: '#f8f9fa'
  },
  modalButton: {
    backgroundColor: '#007bff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  deleteButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dc3545'
  },
  deleteButtonText: {
    color: '#dc3545'
  }
});