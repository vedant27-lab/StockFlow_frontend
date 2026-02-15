import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import {
  createField,
  createProduct,
  deleteField,
  deleteFolder,
  deleteProduct,
  getFields,
  getFolderChartData,
  getFolderMetrics,
  getProducts,
  isAuthenticated,
  updateField,
  updateFolder,
  updateProduct
} from '../../services/api';

const screenWidth = Dimensions.get("window").width;

export default function FolderDetailScreen() {
  const router = useRouter();
  const { id, name: initialName } = useLocalSearchParams();
  const [folderName, setFolderName] = useState(initialName);

  const [fields, setFields] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  // Analytics State
  const [metrics, setMetrics] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [chartType, setChartType] = useState('Pie');
  const [chartData, setChartData] = useState({ labels: [], values: [], total: 0 });
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Management State
  const [activeColumn, setActiveColumn] = useState(null);
  const [showColMenu, setShowColMenu] = useState(false);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);

  // Inputs for Modals
  const [renameText, setRenameText] = useState("");
  const [newColumnName, setNewColumnName] = useState("");

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      setFields(await getFields(id));
      setProducts(await getProducts(id));

      // Check authentication
      const isAuth = await isAuthenticated();
      setAuthenticated(isAuth);

      // Load analytics
      const availableMetrics = await getFolderMetrics(id);
      setMetrics(availableMetrics);

      if (availableMetrics.length > 0 && !selectedMetric) {
        const metric = availableMetrics[0];
        setSelectedMetric(metric);
        const data = await getFolderChartData(id, metric);
        setChartData(data);
      }
    } catch (e) { console.error(e); }
  };

  const handleMetricSelect = async (metric) => {
    setSelectedMetric(metric);
    const data = await getFolderChartData(id, metric);
    setChartData(data);
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleAuthError = (error) => {
    if (error.response?.data?.code === 'AUTH_REQUIRED' || error.response?.data?.code === 'INVALID_TOKEN') {
      Alert.alert(
        'Admin Access Required',
        'Please login as admin to perform this action.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: handleLogin }
        ]
      );
      return true;
    }
    return false;
  };

  // --- CELL EDITING ---
  const handleCellChange = (product, fieldId, newValue) => {
    // Update local state immediately for responsive typing
    const updatedProducts = products.map(p => {
      if (p.id === product.id) {
        const newValues = p.values.map(v =>
          (v.id === fieldId || v.field_id === fieldId) ? { ...v, value: newValue } : v
        );
        if (!newValues.find(v => v.id === fieldId || v.field_id === fieldId)) {
          newValues.push({ field_id: fieldId, value: newValue });
        }
        return { ...p, values: newValues };
      }
      return p;
    });
    setProducts(updatedProducts);
  };

  const handleCellSave = async (product, fieldId) => {
    if (!authenticated) {
      return;
    }

    // Find the current value from state
    const currentProduct = products.find(p => p.id === product.id);
    const valueMap = {};
    currentProduct.values.forEach(v => {
      valueMap[v.field_id || v.id] = v.value;
    });

    try {
      await updateProduct(product.id, { name: product.name, values: valueMap });
      // Reload analytics after edit
      if (selectedMetric) {
        const data = await getFolderChartData(id, selectedMetric);
        setChartData(data);
      }
    } catch (e) {
      if (!handleAuthError(e)) {
        console.error("Save failed", e);
        Alert.alert('Error', 'Failed to save changes');
      }
    }
  };

  const handleProductNameChange = (product, newName) => {
    // Update state immediately for responsive typing
    const updatedProducts = products.map(p => p.id === product.id ? { ...p, name: newName } : p);
    setProducts(updatedProducts);
  };

  const handleProductNameSave = async (product) => {
    if (!authenticated) {
      return;
    }

    const currentProduct = products.find(p => p.id === product.id);
    try {
      await updateProduct(product.id, { name: currentProduct.name });
    } catch (e) {
      handleAuthError(e);
    }
  };

  const handleRenameProduct = async (product, newName) => {
    if (!authenticated) {
      Alert.alert(
        'Admin Access Required',
        'Please login as admin to edit products.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: handleLogin }
        ]
      );
      return;
    }

    const updatedProducts = products.map(p => p.id === product.id ? { ...p, name: newName } : p);
    setProducts(updatedProducts);
    try {
      await updateProduct(product.id, { name: newName });
    } catch (e) {
      handleAuthError(e);
    }
  };

  // --- COLUMN MANAGEMENT ---
  const openColumnMenu = (field) => {
    if (!authenticated) {
      Alert.alert(
        'Admin Access Required',
        'Please login as admin to manage columns.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: handleLogin }
        ]
      );
      return;
    }
    setActiveColumn(field);
    setRenameText(field.name);
    setShowColMenu(true);
  };

  const handleRenameColumn = async () => {
    if (!renameText) return;
    try {
      await updateField(activeColumn.id, renameText);
      setShowColMenu(false);
      loadData();
    } catch (e) {
      handleAuthError(e);
    }
  };

  const handleDeleteColumn = async () => {
    Alert.alert("Delete Column?", "Data in this column will be lost.", [
      { text: "Cancel" },
      {
        text: "Delete", style: 'destructive', onPress: async () => {
          await deleteField(activeColumn.id);
          setShowColMenu(false);
          loadData();
        }
      }
    ]);
  };

  const handleAddColumn = () => {
    if (!authenticated) {
      Alert.alert(
        'Admin Access Required',
        'Please login as admin to add columns.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: handleLogin }
        ]
      );
      return;
    }
    setNewColumnName('');
    setShowAddColumnModal(true);
  };

  const handleCreateColumn = async () => {
    if (!newColumnName.trim()) {
      Alert.alert('Error', 'Column name cannot be empty');
      return;
    }
    try {
      await createField({ name: newColumnName, type: 'number', folder_id: id });
      setShowAddColumnModal(false);
      setNewColumnName('');
      loadData();
    } catch (e) {
      handleAuthError(e);
    }
  };

  // --- FOLDER MANAGEMENT ---
  const handleRenameFolder = async () => {
    if (!renameText) return;
    try {
      await updateFolder(id, renameText);
      setFolderName(renameText);
      setShowFolderMenu(false);
    } catch (e) {
      handleAuthError(e);
    }
  };

  const handleDeleteFolder = async () => {
    Alert.alert("Delete Folder?", "All products inside will be deleted.", [
      { text: "Cancel" },
      {
        text: "Delete", style: 'destructive', onPress: async () => {
          await deleteFolder(id);
          router.back();
        }
      }
    ]);
  };

  // --- ADD/DELETE ROW ---
  const handleAddRow = async () => {
    if (!authenticated) {
      Alert.alert(
        'Admin Access Required',
        'Please login as admin to add products.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: handleLogin }
        ]
      );
      return;
    }

    try {
      await createProduct({ name: "New Item", folder_id: id, values: {} });
      loadData();
    } catch (e) {
      handleAuthError(e);
    }
  };

  const handleDeleteRow = async (prodId) => {
    if (!authenticated) {
      Alert.alert(
        'Admin Access Required',
        'Please login as admin to delete products.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: handleLogin }
        ]
      );
      return;
    }

    try {
      await deleteProduct(prodId);
      loadData();
    } catch (e) {
      handleAuthError(e);
    }
  };

  // --- CHART RENDERING ---
  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(52, 58, 64, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    decimalPlaces: 0
  };

  const renderChart = () => {
    if (chartData.values.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartIcon}>📊</Text>
          <Text style={styles.emptyChartText}>No data available</Text>
        </View>
      );
    }

    // Calculate responsive dimensions
    const chartWidth = Math.min(screenWidth - 40, 400); // Max 400px width
    const chartHeight = chartType === 'Pie' ? 220 : 200;

    if (chartType === 'Pie') {
      const pieData = chartData.labels.map((label, index) => ({
        name: label.length > 12 ? label.substring(0, 12) + '...' : label,
        population: chartData.values[index],
        color: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796'][index % 6],
        legendFontColor: "#5a5c69",
        legendFontSize: 10
      }));
      return (
        <PieChart
          data={pieData}
          width={chartWidth}
          height={chartHeight}
          chartConfig={chartConfig}
          accessor={"population"}
          backgroundColor={"transparent"}
          paddingLeft={"5"}
          absolute
          hasLegend={true}
        />
      );
    } else if (chartType === 'Bar') {
      return (
        <BarChart
          data={{
            labels: chartData.labels.map(l => l.length > 6 ? l.substring(0, 6) + '...' : l),
            datasets: [{ data: chartData.values }]
          }}
          width={chartWidth}
          height={chartHeight}
          chartConfig={chartConfig}
          verticalLabelRotation={0}
          fromZero
          showValuesOnTopOfBars
          style={styles.chart}
        />
      );
    } else {
      return (
        <LineChart
          data={{
            labels: chartData.labels.map(l => l.length > 6 ? l.substring(0, 6) + '...' : l),
            datasets: [{ data: chartData.values.length > 0 ? chartData.values : [0] }]
          }}
          width={chartWidth}
          height={chartHeight}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      );
    }
  };

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { setRenameText(folderName); setShowFolderMenu(true); }}>
          <Text style={styles.folderTitle}>{folderName}</Text>
        </TouchableOpacity>

        {/* Analytics Toggle */}
        {metrics.length > 0 && (
          <TouchableOpacity
            style={styles.analyticsToggle}
            onPress={() => setShowAnalytics(!showAnalytics)}
          >
            <Text style={styles.analyticsToggleText}>
              {showAnalytics ? '📊 Hide Analytics' : '📊 Show Analytics'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ANALYTICS SECTION - Modern Premium Design */}
      {showAnalytics && metrics.length > 0 && (
        <View style={styles.analyticsSection}>
          {/* Header with Gradient Feel */}
          <View style={styles.analyticsHeader}>
            <Text style={styles.analyticsTitle}>📊 Analytics Dashboard</Text>
            <Text style={styles.analyticsSubtitle}>Visualize your data insights</Text>
          </View>

          {/* Metric Chips - Modern Style */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.metricChipsContainer}
          >
            {metrics.map(m => (
              <TouchableOpacity
                key={m}
                style={[
                  styles.metricChip,
                  selectedMetric === m && styles.metricChipActive
                ]}
                onPress={() => handleMetricSelect(m)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.metricChipText,
                  selectedMetric === m && styles.metricChipTextActive
                ]}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Stats Cards Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statCardLabel}>Total</Text>
              <Text style={styles.statCardValue}>{chartData.total.toFixed(2)}</Text>
              <Text style={styles.statCardMetric}>{selectedMetric}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardLabel}>Items</Text>
              <Text style={styles.statCardValue}>{chartData.values.length}</Text>
              <Text style={styles.statCardMetric}>Products</Text>
            </View>
          </View>

          {/* Chart Type Selector - Modern Pills */}
          <View style={styles.chartTypeSelector}>
            {['Pie', 'Bar', 'Line'].map(type => (
              <TouchableOpacity
                key={type}
                onPress={() => setChartType(type)}
                style={[
                  styles.chartTypePill,
                  chartType === type && styles.chartTypePillActive
                ]}
                activeOpacity={0.7}
              >
                <Text style={styles.chartTypePillIcon}>
                  {type === 'Pie' ? '🥧' : type === 'Bar' ? '📊' : '📈'}
                </Text>
                <Text style={[
                  styles.chartTypePillText,
                  chartType === type && styles.chartTypePillTextActive
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Chart Display Card */}
          <View style={styles.chartDisplayCard}>
            {renderChart()}
          </View>

          {/* Data Breakdown Table - Beautiful & Detailed */}
          {chartData.values.length > 0 && (
            <View style={styles.dataBreakdownSection}>
              <View style={styles.breakdownHeader}>
                <Text style={styles.breakdownTitle}>📋 Data Breakdown</Text>
                <Text style={styles.breakdownSubtitle}>
                  Showing {chartData.values.length} items
                </Text>
              </View>

              <View style={styles.dataTable}>
                {/* Table Header */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Product</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>
                    {selectedMetric}
                  </Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>
                    %
                  </Text>
                </View>

                {/* Table Rows */}
                {chartData.labels.map((label, index) => {
                  const value = chartData.values[index];
                  const percentage = ((value / chartData.total) * 100).toFixed(1);
                  const colors = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796'];
                  const color = colors[index % 6];

                  return (
                    <View key={index} style={styles.tableRow}>
                      <View style={styles.tableRowContent}>
                        {/* Color Indicator */}
                        <View style={[styles.colorDot, { backgroundColor: color }]} />

                        {/* Product Name */}
                        <Text style={styles.productName} numberOfLines={1}>
                          {label}
                        </Text>

                        {/* Value */}
                        <Text style={styles.productValue}>
                          {value.toFixed(2)}
                        </Text>

                        {/* Percentage */}
                        <Text style={styles.productPercentage}>
                          {percentage}%
                        </Text>
                      </View>

                      {/* Progress Bar */}
                      <View style={styles.progressBarBg}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${percentage}%`,
                              backgroundColor: color
                            }
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      )}

      {/* THE EXCEL GRID */}
      <ScrollView horizontal contentContainerStyle={{ flexGrow: 1 }}>
        <View>
          {/* HEADER ROW */}
          <View style={styles.headerRow}>
            <View style={[styles.cell, { width: 140, backgroundColor: '#f8f9fc' }]}>
              <Text style={styles.headerText}>Product Name</Text>
            </View>

            {fields.map(f => (
              <TouchableOpacity
                key={f.id}
                style={[styles.cell, { width: 100, backgroundColor: '#f8f9fc' }]}
                onPress={() => openColumnMenu(f)}
              >
                <Text style={styles.headerText}>{f.name} ▼</Text>
              </TouchableOpacity>
            ))}

            {/* ADD COLUMN BUTTON */}
            <TouchableOpacity style={[styles.cell, styles.addHeader]} onPress={handleAddColumn}>
              <Text style={styles.addHeaderText}>+ Col</Text>
            </TouchableOpacity>
          </View>

          {/* DATA ROWS */}
          <ScrollView style={{ marginBottom: 100 }}>
            {products.map((prod) => (
              <View key={prod.id} style={styles.row}>
                {/* Product Name Input */}
                <TextInput
                  style={[
                    styles.cell,
                    styles.input,
                    { width: 140, fontWeight: '600' },
                    !authenticated && styles.inputReadOnly
                  ]}
                  value={prod.name}
                  editable={authenticated}
                  onFocus={() => {
                    if (!authenticated) {
                      Alert.alert(
                        'Admin Access Required',
                        'Please login as admin to edit products.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Login', onPress: handleLogin }
                        ]
                      );
                    }
                  }}
                  onChangeText={(text) => handleProductNameChange(prod, text)}
                  onBlur={() => handleProductNameSave(prod)}
                />

                {/* Dynamic Fields Inputs */}
                {fields.map(f => {
                  const valObj = prod.values.find(v => v.id === f.id || v.field_id === f.id);
                  return (
                    <TextInput
                      key={f.id}
                      style={[
                        styles.cell,
                        styles.input,
                        { width: 100 },
                        !authenticated && styles.inputReadOnly
                      ]}
                      value={valObj ? String(valObj.value) : ''}
                      placeholder="-"
                      placeholderTextColor="#adb5bd"
                      keyboardType="numeric"
                      editable={authenticated}
                      onFocus={() => {
                        if (!authenticated) {
                          Alert.alert(
                            'Admin Access Required',
                            'Please login as admin to edit values.',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Login', onPress: handleLogin }
                            ]
                          );
                        }
                      }}
                      onChangeText={(text) => handleCellChange(prod, f.id, text)}
                      onBlur={() => handleCellSave(prod, f.id)}
                    />
                  );
                })}

                {/* Delete Row Button */}
                <TouchableOpacity style={styles.deleteRowBtn} onPress={() => handleDeleteRow(prod.id)}>
                  <Text style={{ color: '#e74a3b', fontWeight: 'bold', fontSize: 18 }}>×</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* ADD ROW BUTTON */}
            <TouchableOpacity style={styles.addRowBtn} onPress={handleAddRow}>
              <Text style={styles.addRowText}>+ Add Row</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </ScrollView>

      {/* MODAL: COLUMN MENU */}
      <Modal visible={showColMenu} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowColMenu(false)}>
          <View style={styles.menuBox}>
            <Text style={styles.menuTitle}>Manage "{activeColumn?.name}"</Text>
            <TextInput
              style={styles.menuInput}
              value={renameText}
              onChangeText={setRenameText}
            />
            <TouchableOpacity style={styles.menuItem} onPress={handleRenameColumn}>
              <Text style={styles.menuText}>✏️ Rename Column</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteColumn}>
              <Text style={[styles.menuText, { color: '#e74a3b' }]}>🗑️ Delete Column</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL: FOLDER MENU */}
      <Modal visible={showFolderMenu} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowFolderMenu(false)}>
          <View style={styles.menuBox}>
            <Text style={styles.menuTitle}>Manage Folder</Text>
            <TextInput
              style={styles.menuInput}
              value={renameText}
              onChangeText={setRenameText}
            />
            <TouchableOpacity style={styles.menuItem} onPress={handleRenameFolder}>
              <Text style={styles.menuText}>✏️ Rename Folder</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteFolder}>
              <Text style={[styles.menuText, { color: '#e74a3b' }]}>🗑️ Delete Folder</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL: ADD COLUMN */}
      <Modal visible={showAddColumnModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddColumnModal(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.menuBox}>
              <Text style={styles.menuTitle}>Add New Column</Text>
              <TextInput
                style={styles.menuInput}
                placeholder="Enter column name (e.g. Price)"
                placeholderTextColor="#adb5bd"
                value={newColumnName}
                onChangeText={setNewColumnName}
                autoFocus
              />
              <TouchableOpacity style={styles.menuItem} onPress={handleCreateColumn}>
                <Text style={styles.menuText}>✅ Create Column</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setShowAddColumnModal(false)}
              >
                <Text style={[styles.menuText, { color: '#6c757d' }]}>❌ Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc'
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e3e6f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  backButton: {
    marginBottom: 8
  },
  backButtonText: {
    fontSize: 14,
    color: '#4e73df',
    fontWeight: '500'
  },
  folderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8
  },
  analyticsToggle: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#4e73df',
    borderRadius: 8,
    alignSelf: 'flex-start'
  },
  analyticsToggleText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600'
  },

  // Analytics Section - Modern Premium Design
  analyticsSection: {
    backgroundColor: '#f8f9fc',
    paddingVertical: 20,
    paddingBottom: 24
  },
  analyticsHeader: {
    paddingHorizontal: 20,
    marginBottom: 16
  },
  analyticsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4
  },
  analyticsSubtitle: {
    fontSize: 13,
    color: '#858796',
    fontWeight: '500'
  },

  // Metric Chips - Modern Style
  metricChipsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 10
  },
  metricChip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: '#fff',
    borderRadius: 24,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#e3e6f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  metricChipActive: {
    backgroundColor: '#4e73df',
    borderColor: '#4e73df',
    shadowColor: '#4e73df',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  metricChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5a5c69'
  },
  metricChipTextActive: {
    color: '#fff'
  },

  // Stats Cards Row
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e3e6f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2
  },
  statCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#858796',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4e73df',
    marginBottom: 2
  },
  statCardMetric: {
    fontSize: 11,
    fontWeight: '500',
    color: '#5a5c69'
  },

  // Chart Type Selector - Modern Pills
  chartTypeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16
  },
  chartTypePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e3e6f0',
    gap: 6
  },
  chartTypePillActive: {
    backgroundColor: '#4e73df',
    borderColor: '#4e73df',
    shadowColor: '#4e73df',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3
  },
  chartTypePillIcon: {
    fontSize: 16
  },
  chartTypePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5a5c69'
  },
  chartTypePillTextActive: {
    color: '#fff'
  },

  // Chart Display Card
  chartDisplayCard: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e3e6f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4
  },
  chart: {
    borderRadius: 12
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: 40
  },
  emptyChartIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.3
  },
  emptyChartText: {
    fontSize: 14,
    color: '#858796',
    fontWeight: '500'
  },

  // Data Breakdown Table
  dataBreakdownSection: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 16
  },
  breakdownHeader: {
    marginBottom: 16
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4
  },
  breakdownSubtitle: {
    fontSize: 13,
    color: '#858796'
  },
  dataTable: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e3e6f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fc',
    borderBottomWidth: 1,
    borderColor: '#e3e6f0'
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: '700',
    color: '#858796',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  tableRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#f1f3f5'
  },
  tableRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10
  },
  productName: {
    flex: 2,
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a'
  },
  productValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'right'
  },
  productPercentage: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#858796',
    textAlign: 'right'
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#f1f3f5',
    borderRadius: 2,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2
  },

  // Excel Grid
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderColor: '#4e73df',
    backgroundColor: '#f8f9fc'
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#e3e6f0',
    alignItems: 'center',
    backgroundColor: '#fff'
  },

  cell: {
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderColor: '#e3e6f0'
  },
  headerText: {
    fontWeight: '700',
    fontSize: 13,
    color: '#1a1a1a'
  },
  input: {
    fontSize: 14,
    color: '#5a5c69'
  },
  inputReadOnly: {
    backgroundColor: '#f1f3f5',
    color: '#adb5bd'
  },

  addHeader: {
    width: 70,
    backgroundColor: '#e7f3ff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  addHeaderText: {
    color: '#4e73df',
    fontWeight: '700',
    fontSize: 13
  },

  deleteRowBtn: {
    width: 40,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },

  addRowBtn: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#f8f9fc',
    borderBottomWidth: 1,
    borderColor: '#e3e6f0'
  },
  addRowText: {
    color: '#1cc88a',
    fontWeight: '700',
    fontSize: 14
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  menuBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1a1a1a'
  },
  menuInput: {
    borderWidth: 1,
    borderColor: '#e3e6f0',
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fc',
    color: '#1a1a1a'
  },
  menuItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0'
  },
  menuText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a'
  }
});