import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import {
  getAvailableMetrics,
  getChartData,
  getFolders,
  getMetricPreference,
  saveMetricPreference
} from '../services/api';

const screenWidth = Dimensions.get("window").width;

export default function HomeScreen() {
  const router = useRouter();
  const [folders, setFolders] = useState([]);
  
  const [metrics, setMetrics] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const folderData = await getFolders();
      setFolders(folderData);
      const availableMetrics = await getAvailableMetrics();
      setMetrics(availableMetrics);
      let metricToShow = selectedMetric;
      if (!metricToShow) {
        const saved = await getMetricPreference();
        if (saved && availableMetrics.includes(saved)) {
          metricToShow = saved;
        } else if (availableMetrics.length > 0) {
          metricToShow = availableMetrics[0]; 
        }
      }
      if (metricToShow) {
        setSelectedMetric(metricToShow);
        const data = await getChartData(metricToShow);
        setChartData(data.chart_data);
        setGrandTotal(data.total);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));
  const handleMetricSelect = async (metric) => {
    setSelectedMetric(metric);
    saveMetricPreference(metric); 
    setLoading(true);
    const data = await getChartData(metric);
    setChartData(data.chart_data);
    setGrandTotal(data.total);
    setLoading(false);
  };
  const pieData = chartData.map((item, index) => ({
    name: item.label,
    population: item.value,
    color: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'][index % 5],
    legendFontColor: "#7F7F7F",
    legendFontSize: 15
  }));

  return (
    <ScrollView 
      style={styles.container} 
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
    >
      <View style={styles.tabContainer}>
        <Text style={styles.tabLabel}>Visualize by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {metrics.map(m => (
            <TouchableOpacity 
              key={m} 
              style={[styles.tab, selectedMetric === m && styles.activeTab]}
              onPress={() => handleMetricSelect(m)}
            >
              <Text style={[styles.tabText, selectedMetric === m && styles.activeTabText]}>
                {m}
              </Text>
            </TouchableOpacity>
          ))}
          {metrics.length === 0 && <Text style={styles.noMetrics}>Add numeric fields to see options</Text>}
        </ScrollView>
      </View>
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Total {selectedMetric}: {grandTotal}</Text>
        {pieData.length > 0 ? (
          <PieChart
            data={pieData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            absolute
          />
        ) : (
          <Text style={styles.emptyChart}>No data available for {selectedMetric}</Text>
        )}
      </View>
      <Text style={styles.sectionTitle}>Categories</Text>
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

      <TouchableOpacity 
        style={styles.addBtn}
        onPress={() => router.push("/create-folder")}
      >
        <Text style={styles.addBtnText}>+ New Category</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8', padding: 15 },
  
  tabContainer: { marginBottom: 15 },
  tabLabel: { fontSize: 14, color: '#666', marginBottom: 8 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#e0e0e0', borderRadius: 20, marginRight: 10 },
  activeTab: { backgroundColor: '#007bff' },
  tabText: { color: '#333', fontWeight: '600' },
  activeTabText: { color: 'white' },
  noMetrics: { color: '#999', fontStyle: 'italic', marginTop: 5 },

  chartCard: { backgroundColor: 'white', borderRadius: 15, padding: 20, marginBottom: 20, elevation: 3 },
  chartTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  emptyChart: { textAlign: 'center', color: '#999', marginVertical: 20 },

  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  folderCard: { width: '48%', backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 15, alignItems: 'center', elevation: 2 },
  folderIcon: { fontSize: 30, marginBottom: 5 },
  
  addBtn: { backgroundColor: '#28a745', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, marginBottom: 30 },
  addBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});