import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text, TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { createField, createProduct, getFields } from '../services/api';

export default function AddProductScreen() {
  const router = useRouter();
  const { folderId } = useLocalSearchParams(); 

  const [productName, setProductName] = useState('');
  const [availableFields, setAvailableFields] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [newFieldName, setNewFieldName] = useState('');
  const [isAnalyticsField, setIsAnalyticsField] = useState(false); 

  useEffect(() => {
    if(folderId) {
      loadFields();
    }
  }, [folderId]);

  const loadFields = async () => {
    try {
      const fields = await getFields(folderId);
      setAvailableFields(fields);
    } catch (error) {
      console.error(error);
    }
  };
  const handleCreateField = async () => {
    if (!newFieldName.trim()) return;
    try {
      await createField({ 
        name: newFieldName, 
        type: 'number', 
        folder_id: folderId,
        is_analytics_target: isAnalyticsField 
      });
      
      Alert.alert("Success", "New field added!");
      setNewFieldName('');
      setIsAnalyticsField(false);
      loadFields(); 
    } catch (error) {
      Alert.alert("Error", "Could not create field");
    }
  };

  const handleInputChange = (fieldId, text) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: text }));
  };
  const handleSaveProduct = async () => {
    if (!productName.trim()) {
      Alert.alert("Validation", "Product Name is required");
      return;
    }

    const payload = {
      name: productName,
      folder_id: folderId, 
      fields: fieldValues
    };

    try {
      await createProduct(payload);
      Alert.alert("Success", "Product Created!");
      router.back(); 
    } catch (error) {
      Alert.alert("Error", "Could not create product");
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.section}>
        <Text style={styles.header}>Step 1: Define Fields</Text>
        <Text style={styles.subHeader}>Add fields specific to this folder (e.g., Size, Stock)</Text>
        
        <View style={styles.newFieldBox}>
          <TextInput
            style={styles.input}
            placeholder="Field Name (e.g. Stock Count)"
            value={newFieldName}
            onChangeText={setNewFieldName}
          />
          
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Use for Charts/Analytics?</Text>
            <Switch 
              value={isAnalyticsField}
              onValueChange={setIsAnalyticsField}
            />
          </View>

          <TouchableOpacity style={styles.smallButton} onPress={handleCreateField}>
            <Text style={styles.smallButtonText}>+ Add Field Definition</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divider} />
      <View style={styles.section}>
        <Text style={styles.header}>Step 2: Add Item Details</Text>
        
        <Text style={styles.label}>Item Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter item name"
          value={productName}
          onChangeText={setProductName}
        />

        {availableFields.map((field) => (
          <View key={field.id} style={styles.fieldContainer}>
            <Text style={styles.label}>
              {field.field_name} 
              {field.is_analytics_target === 1 ? " (📊 Chart Data)" : ""}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={`Enter ${field.field_name}`}
              keyboardType={field.is_analytics_target ? 'numeric' : 'default'} 
              value={fieldValues[field.id] || ''}
              onChangeText={(text) => handleInputChange(field.id, text)}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveProduct}>
          <Text style={styles.saveButtonText}>Save Item</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  section: { marginBottom: 20 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 5, color: '#333' },
  subHeader: { fontSize: 13, color: '#666', marginBottom: 15 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
  
  newFieldBox: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 10 },
  switchLabel: { fontSize: 14, color: '#555' },
  
  label: { fontSize: 15, fontWeight: '600', marginBottom: 5, marginTop: 10, color: '#444' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: 'white' },
  
  smallButton: { backgroundColor: '#6c757d', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  smallButtonText: { color: 'white', fontWeight: 'bold' },
  
  saveButton: { backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 30, marginBottom: 50 },
  saveButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});