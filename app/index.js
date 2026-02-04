import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Button,
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
  
  // State for creating a new folder
  const [newFolderName, setNewFolderName] = useState("");
  const [showInput, setShowInput] = useState(false);

  const loadData = async () => {
    console.log("Loading data..."); // LOG 1
    try {
      const folderData = await getFolders();
      const dashboardData = await getDashboardStats();
      setFolders(folderData);
      setStats(dashboardData.stats); 
      setGrandTotal(dashboardData.grand_total);
    } catch (error) {
      console.error("Load Error:", error);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  // --- DEBUGGING FUNCTION ---
  const handleCreateFolder = async () => {
    console.log("1. Save Button Pressed!"); 
    console.log("2. Current Text in Input:", newFolderName);

    if (!newFolderName || newFolderName.trim() === "") {
      console.log("3. ERROR: Name is empty. Stopping.");
      Alert.alert("Debug", "The input is empty!");
      return;
    }

    try {
      console.log("4. Sending API Request for:", newFolderName);
      const response = await createFolder(newFolderName);
      console.log("5. API Success:", response);
      
      setNewFolderName("");
      setShowInput(false);
      loadData();
      Alert.alert("Success", "Folder created!");
    } catch (e) {
      console.error("6. API ERROR:", e);
      Alert.alert("Error", "Server Request Failed");
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
      {/* ANALYTICS */}
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

      {/* FOLDERS */}
      <Text style={styles.sectionTitle}>My Categories</Text>
      
      {showInput ? (
        <View style={styles.inputRow}>
          <TextInput 
            style={styles.input} 
            placeholder="Folder Name" 
            value={newFolderName}
            onChangeText={(text) => {
                console.log("Typing:", text); // LOG WRITING
                setNewFolderName(text);
            }}
          />
          {/* USING STANDARD BUTTON FOR TESTING */}
          <Button title="SAVE" onPress={handleCreateFolder} />
        </View>
      ) : (
        <Button title="+ NEW CATEGORY" onPress={() => setShowInput(true)} />
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
  chartContainer: { backgroundColor: 'white', borderRadius: 15, padding: 20, marginBottom: 20 },
  chartTitle: { fontSize: 18, fontWeight: 'bold' },
  totalText: { fontSize: 14, color: '#666', marginBottom: 10 },
  noDataText: { textAlign: 'center', marginVertical: 20, color: '#999' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  inputRow: { flexDirection: 'row', marginBottom: 20, alignItems: 'center' },
  input: { flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 8, marginRight: 10, borderWidth: 1, borderColor: '#ddd' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  folderCard: { width: '48%', backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 15, alignItems: 'center' },
  folderIcon: { fontSize: 30, marginBottom: 5 },
  folderName: { fontWeight: '600' }
});