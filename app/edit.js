import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text, TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { getFields, updateProduct } from '../services/api';

export default function EditProductScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // We need the folderId to know which fields (labels) to show
  const { id, name, folderId, fields } = params;
  
  const [productName, setProductName] = useState(name);
  const [fieldValues, setFieldValues] = useState(fields ? JSON.parse(fields) : {});
  const [availableFields, setAvailableFields] = useState([]);

  // Load the field definitions (Labels like "Size", "Color")
  useEffect(() => {
    if (folderId) {
      loadFields();
    }
  }, [folderId]);

  const loadFields = async () => {
    try {
      const data = await getFields(folderId);
      setAvailableFields(data);
    } catch (error) {
      console.error("Error loading fields:", error);
    }
  };

  const handleInputChange = (fieldId, text) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: text }));
  };

  const handleUpdate = async () => {
    if (!productName.trim()) {
      Alert.alert("Error", "Product Name is required");
      return;
    }

    const payload = {
      name: productName,
      fields: fieldValues // Send updated values
    };

    try {
      await updateProduct(id, payload);
      Alert.alert("Success", "Product Updated!");
      router.back(); 
    } catch (error) {
      Alert.alert("Error", "Could not update product");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Edit Item</Text>

      <Text style={styles.label}>Item Name</Text>
      <TextInput
        style={styles.input}
        value={productName}
        onChangeText={setProductName}
      />

      {/* Render inputs for dynamic fields */}
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

      <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
        <Text style={styles.updateButtonText}>Update Item</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 5, marginTop: 10, color: '#444' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 16, backgroundColor: '#fafafa' },
  
  updateButton: {
    backgroundColor: '#ffc107', 
    padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 30, marginBottom: 50
  },
  updateButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
});