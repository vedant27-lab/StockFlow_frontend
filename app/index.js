import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Dimensions, RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit'; // Multiple Charts
import { getAvailableMetrics, getChartData, getFolders, getMetricPreference, saveMetricPreference } from '../services/api';

const screenWidth = Dimensions.get("window").width;

export default function HomeScreen() {
  const router = useRouter();
  const [folders, setFolders] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState(null);
  
  // New: Chart Type State
  const [chartType, setChartType] = useState('Pie'); // Options: Pie, Bar, Line
  const [chartData, setChartData] = useState({ labels: [], values: [] });
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const folderData = await getFolders();
      setFolders(folderData);
      
      const availableMetrics = await getAvailableMetrics();
      setMetrics(availableMetrics);

      // Restore preference or pick first
      let metric = selectedMetric;
      if (!metric) {
        const saved = await getMetricPreference();
        metric = (saved && availableMetrics.includes(saved)) ? saved : availableMetrics[0];
      }

      if (metric) {
        setSelectedMetric(metric);
        const data = await getChartData(metric);
        setChartData(data);
        setGrandTotal(data.total);
      }
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const handleMetricSelect = async (metric) => {
    setSelectedMetric(metric);
    saveMetricPreference(metric);
    setLoading(true);
    const data = await getChartData(metric);
    setChartData(data);
    setGrandTotal(data.total);
    setLoading(false);
  };

  // --- CHART CONFIGURATIONS ---
  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };

  const renderChart = () => {
    if (chartData.values.length === 0) return <Text style={styles.emptyText}>No Data</Text>;

    if (chartType === 'Pie') {
      const pieData = chartData.labels.map((label, index) => ({
        name: label,
        population: chartData.values[index],
        color: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'][index % 5],
        legendFontColor: "#7F7F7F",
        legendFontSize: 12
      }));
      return (
        <PieChart
          data={pieData}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          accessor={"population"}
          backgroundColor={"transparent"}
          paddingLeft={"15"}
          absolute
        />
      );
    } else if (chartType === 'Bar') {
      return (
        <BarChart
          data={{ labels: chartData.labels, datasets: [{ data: chartData.values }] }}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          verticalLabelRotation={30}
        />
      );
    } else {
      return (
        <LineChart
          data={{ labels: chartData.labels, datasets: [{ data: chartData.values }] }}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          bezier
        />
      );
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
    >
      {/* 1. METRIC TABS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        {metrics.map(m => (
          <TouchableOpacity 
            key={m} 
            style={[styles.tab, selectedMetric === m && styles.activeTab]}
            onPress={() => handleMetricSelect(m)}
          >
            <Text style={[styles.tabText, selectedMetric === m && styles.activeTabText]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 2. CHART CARD */}
      <View style={styles.card}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Total: {grandTotal}</Text>
          {/* Chart Type Toggle */}
          <View style={styles.toggleRow}>
            {['Pie', 'Bar', 'Line'].map(type => (
              <TouchableOpacity key={type} onPress={() => setChartType(type)}>
                <Text style={[styles.typeText, chartType === type && styles.activeType]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {renderChart()}
      </View>

      {/* 3. FOLDERS */}
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
      
      <TouchableOpacity style={styles.fab} onPress={() => router.push("/create-folder")}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8', padding: 15 },
  tabsScroll: { marginBottom: 15, maxHeight: 50 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#e0e0e0', borderRadius: 20, marginRight: 10 },
  activeTab: { backgroundColor: '#007bff' },
  tabText: { fontWeight: '600' },
  activeTabText: { color: 'white' },
  
  card: { backgroundColor: 'white', borderRadius: 15, padding: 15, marginBottom: 20, elevation: 3 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' },
  chartTitle: { fontSize: 16, fontWeight: 'bold' },
  toggleRow: { flexDirection: 'row', gap: 15 },
  typeText: { color: '#999', fontSize: 12 },
  activeType: { color: '#007bff', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#aaa', marginVertical: 30 },

  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  folderCard: { width: '48%', backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 15, alignItems: 'center', elevation: 2 },
  folderIcon: { fontSize: 30, marginBottom: 5 },
  
  fab: { position: 'absolute', right: 20, bottom: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#007bff', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabText: { fontSize: 30, color: 'white', marginTop: -5 }
});