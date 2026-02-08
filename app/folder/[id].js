import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert, Modal,
  ScrollView,
  StyleSheet,
  Text, TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { createField, createProduct, getFields, getProducts } from '../../services/api';

export default function FolderExcelScreen() {
  const { id, name } = useLocalSearchParams();
  const [fields, setFields] = useState([]); // Columns (Price, Qty)
  const [products, setProducts] = useState([]); // Rows (Apple, Banana)
  
  // Modal State for adding new Column/Row
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [showRowModal, setShowRowModal] = useState(false);
  const [newRowName, setNewRowName] = useState('');
  const [newRowValues, setNewRowValues] = useState({});

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const fieldData = await getFields(id);
      const productData = await getProducts(id);
      setFields(fieldData);
      setProducts(productData);
    } catch (e) {
      console.error(e);
    }
  };

  // 1. Add a New Column (e.g., "Tax", "Margin")
  const handleAddColumn = async () => {
    if(!newColName) return;
    try {
      await createField({ 
        name: newColName, 
        type: 'number', // We default to number for analytics
        folder_id: id 
      });
      setNewColName('');
      setShowColumnModal(false);
      loadData();
    } catch (e) { Alert.alert("Error", "Failed to add column"); }
  };

  // 2. Add a New Row (Product)
  const handleAddRow = async () => {
    if(!newRowName) return;
    try {
      await createProduct({
        name: newRowName,
        folder_id: id,
        values: newRowValues
      });
      setNewRowName('');
      setNewRowValues({});
      setShowRowModal(false);
      loadData();
    } catch (e) { Alert.alert("Error", "Failed to add product"); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{name} Sheet</Text>

      {/* THE EXCEL GRID HEADER */}
      <View style={styles.headerRow}>
        <Text style={[styles.cell, styles.headerCell, styles.nameCell]}>Product Name</Text>
        {fields.map(field => (
          <Text key={field.id} style={[styles.cell, styles.headerCell]}>{field.name}</Text>
        ))}
      </View>

      {/* THE EXCEL ROWS */}
      <ScrollView>
        {products.map((prod) => (
          <View key={prod.id} style={styles.row}>
            <Text style={[styles.cell, styles.nameCell]}>{prod.name}</Text>
            {fields.map(field => {
              // Find the value for this specific column
              const valObj = prod.values.find(v => v.field_id === field.id);
              return (
                <Text key={field.id} style={styles.cell}>
                  {valObj ? valObj.value : '-'}
                </Text>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* ACTION BUTTONS */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => setShowColumnModal(true)}>
          <Text style={styles.btnTextSec}>+ Add Column (Metric)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => setShowRowModal(true)}>
          <Text style={styles.btnText}>+ Add Row (Product)</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL: ADD COLUMN */}
      <Modal visible={showColumnModal} transparent animationType="slide">
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Add New Metric</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Name (e.g. Buying Price)" 
            value={newColName}
            onChangeText={setNewColName} 
          />
          <TouchableOpacity style={styles.btnPrimary} onPress={handleAddColumn}>
            <Text style={styles.btnText}>Save Column</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setShowColumnModal(false)}>
            <Text>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* MODAL: ADD ROW */}
      <Modal visible={showRowModal} transparent animationType="slide">
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Add New Product</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Product Name" 
            value={newRowName}
            onChangeText={setNewRowName} 
          />
          
          <Text style={styles.subTitle}>Enter Values:</Text>
          {fields.map(f => (
            <TextInput
              key={f.id}
              style={styles.input}
              placeholder={f.name}
              keyboardType="numeric"
              onChangeText={(text) => setNewRowValues(prev => ({...prev, [f.id]: text}))}
            />
          ))}

          <TouchableOpacity style={styles.btnPrimary} onPress={handleAddRow}>
            <Text style={styles.btnText}>Save Product</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setShowRowModal(false)}>
            <Text>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 10 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  
  // Excel Grid Styles
  headerRow: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#000', paddingBottom: 5 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 10 },
  cell: { flex: 1, textAlign: 'center', fontSize: 14 },
  headerCell: { fontWeight: 'bold' },
  nameCell: { flex: 2, textAlign: 'left', paddingLeft: 10 },

  // Buttons
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  btnPrimary: { backgroundColor: '#28a745', padding: 12, borderRadius: 8, flex: 0.48, alignItems: 'center' },
  btnSecondary: { backgroundColor: '#6c757d', padding: 12, borderRadius: 8, flex: 0.48, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' },
  btnTextSec: { color: 'white' },

  // Modals
  modalView: { margin: 20, marginTop: 100, backgroundColor: 'white', padding: 35, borderRadius: 20, elevation: 5, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.25 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  subTitle: { fontSize: 16, marginTop: 10, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, marginBottom: 10 },
  closeBtn: { marginTop: 10, alignItems: 'center' }
});