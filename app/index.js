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
import { createFolder, getDashboardStats, getFolders } from '../services/api';

const screenWidth = Dimensions.get("window").width;

export default function HomeScreen() {
  const router = useRouter();
  const [folders, setFolders] = useState([]);
  const [stats, setStats] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [newFolderName, setNewFolderName] = useState("");
  const [showInput, setShowInput] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const folderData = await getFolders();
      const dashboardData = await getDashboardStats();
      
      setFolders(folderData);
      setStats(dashboardData.stats); 
      setGrandTotal(dashboardData.grand_total);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await createFolder(newFolderName);
      setNewFolderName("");
      setShowInput(false);
      loadData();
    } catch (e) {
      Alert.alert("Error", "Could not create folder");
    }
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
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
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
        <View style={styles.inputRow}>
          <TextInput 
            style={styles.input} 
            placeholder="Folder Name (e.g. Jeans)" 
            value={newFolderName}
            onChangeText={setNewFolderName}
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleCreateFolder}>
            <Text style={styles.btnText}>Save</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.addFolderBtn} onPress={() => setShowInput(true)}>
          <Text style={styles.btnText}>+ New Category</Text>
        </TouchableOpacity>
      )}

      <View style={styles.grid}>
        {folders.map((folder) => (
          <TouchableOpacity 
            key={folder.id} 
            style={styles.folderCard}
            onPress={() => router.push({ pathname: "/folder/[id]", params: { id: folder.id, name: folder.name } })}
          >
            <Text style={styles.folderIcon}>📂</Text>
            <Text style={styles.folderName}>{folder.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8', padding: 20 },
  chartContainer: {
    backgroundColor: 'white', borderRadius: 15, padding: 20, marginBottom: 20,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5
  },
  chartTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  totalText: { fontSize: 14, color: '#666', marginBottom: 10 },
  noDataText: { textAlign: 'center', marginVertical: 20, color: '#999' },
  
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#222' },
  
  addFolderBtn: {
    backgroundColor: '#007bff', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20
  },
  inputRow: { flexDirection: 'row', marginBottom: 20 },
  input: { 
    flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 8, marginRight: 10, borderWidth: 1, borderColor: '#ddd' 
  },
  saveBtn: { backgroundColor: '#28a745', justifyContent: 'center', paddingHorizontal: 20, borderRadius: 8 },
  btnText: { color: 'white', fontWeight: 'bold' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  folderCard: {
    width: '48%', backgroundColor: 'white', padding: 20, borderRadius: 12,
    marginBottom: 15, alignItems: 'center', elevation: 2
  },
  folderIcon: { fontSize: 30, marginBottom: 5 },
  folderName: { fontWeight: '600', color: '#444' }
});