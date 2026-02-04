import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import {
  createFolder,
  deleteFolder,
  getDashboardStats,
  getFolders,
  updateFolder
} from '../services/api';

const screenWidth = Dimensions.get("window").width;

export default function HomeScreen() {
  const router = useRouter();
  const [folders, setFolders] = useState([]);
  const [stats, setStats] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [inputText, setInputText] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState(null); // If null, we are creating. If set, we are editing.

  const loadData = async () => {
    try {
      const folderData = await getFolders();
      const dashboardData = await getDashboardStats();
      setFolders(folderData);
      setStats(dashboardData.stats);
      setGrandTotal(dashboardData.grand_total);
    } catch (error) {
      console.error(error);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));
  const handleSave = async () => {
    if (!inputText.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    try {
      if (editingFolderId) {
        await updateFolder(editingFolderId, inputText);
        Alert.alert("Success", "Category updated!");
      } else {
        await createFolder(inputText);
        Alert.alert("Success", "Category created!");
      }
      resetInput();
      loadData();
    } catch (e) {
      Alert.alert("Error", "Operation failed");
    }
  };

  const startEdit = (folder) => {
    setInputText(folder.name);
    setEditingFolderId(folder.id);
    setShowInput(true);
  };

  const handleDelete = (id) => {
    Alert.alert(
      "Delete Category?",
      "Warning: This will delete ALL products and fields inside this category forever.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            await deleteFolder(id);
            loadData();
          } 
        }
      ]
    );
  };

  const resetInput = () => {
    setInputText("");
    setEditingFolderId(null);
    setShowInput(false);
  };

  
  const chartData = stats.map((item, index) => ({
    name: item.folder_name,
    population: parseInt(item.total_metric),
    color: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'][index % 5],
    legendFontColor: "#7F7F7F",
    legendFontSize: 15
  })).filter(item => item.population > 0);

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Inventory Overview</Text>
        <Text style={styles.totalText}>Total Items: {grandTotal}</Text>
        {chartData.length > 0 ? (
          <PieChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            absolute
          />
        ) : (
          <Text style={styles.noDataText}>Add products to see charts!</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>My Categories</Text>
      
      {showInput ? (
        <View style={styles.inputBox}>
          <Text style={styles.inputLabel}>
            {editingFolderId ? "Edit Category Name" : "New Category Name"}
          </Text>
          <View style={styles.inputRow}>
            <TextInput 
              style={styles.input} 
              placeholder="Category Name" 
              value={inputText}
              onChangeText={setInputText}
              autoFocus={true}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.btnText}>{editingFolderId ? "Update" : "Save"}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={resetInput}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.addFolderBtn} onPress={() => setShowInput(true)}>
          <Text style={styles.btnText}>+ NEW CATEGORY</Text>
        </TouchableOpacity>
      )}

      <View style={styles.grid}>
        {folders.map((folder) => (
          <View key={folder.id} style={styles.folderWrapper}>
            <TouchableOpacity 
              style={styles.folderCard}
              onPress={() => router.push({ pathname: "/folder/[id]", params: { id: folder.id, name: folder.name } })}
            >
              <Text style={styles.folderIcon}>📂</Text>
              <Text style={styles.folderName} numberOfLines={1}>{folder.name}</Text>
            </TouchableOpacity>

            <View style={styles.actionRow}>
              <TouchableOpacity onPress={() => startEdit(folder)} style={styles.iconBtn}>
                <Text style={styles.iconText}>✎</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(folder.id)} style={styles.iconBtn}>
                <Text style={[styles.iconText, { color: 'red' }]}>🗑</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8', padding: 20 },
  chartContainer: { backgroundColor: 'white', borderRadius: 15, padding: 20, marginBottom: 20, elevation: 2 },
  chartTitle: { fontSize: 18, fontWeight: 'bold' },
  totalText: { fontSize: 14, color: '#666', marginBottom: 10 },
  noDataText: { textAlign: 'center', marginVertical: 20, color: '#999' },
  
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  
  addFolderBtn: { backgroundColor: '#007bff', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  inputBox: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 20, elevation: 3 },
  inputLabel: { fontWeight: 'bold', marginBottom: 10, color: '#555' },
  inputRow: { flexDirection: 'row', marginBottom: 10 },
  input: { flex: 1, backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, marginRight: 10, borderWidth: 1, borderColor: '#ddd' },
  saveBtn: { backgroundColor: '#28a745', justifyContent: 'center', paddingHorizontal: 20, borderRadius: 8 },
  btnText: { color: 'white', fontWeight: 'bold' },
  cancelText: { color: 'red', textAlign: 'center', marginTop: 5 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  
  folderWrapper: { width: '48%', backgroundColor: 'white', borderRadius: 12, marginBottom: 15, elevation: 2, overflow: 'hidden' },
  folderCard: { padding: 20, alignItems: 'center', backgroundColor: 'white' },
  folderIcon: { fontSize: 30, marginBottom: 5 },
  folderName: { fontWeight: '600', color: '#333' },
  
  actionRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#eee' },
  iconBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: '#fafafa' },
  iconText: { fontSize: 18, fontWeight: 'bold', color: '#666' }
});