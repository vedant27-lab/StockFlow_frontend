import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { createField, createProduct, getFields } from '../services/api';

export default function AddProductScreen() {
  const router = useRouter();

  const [productName, setProductName] = useState('');
  const [availableFields, setAvailableFields] = useState([]);
  const [fieldValues, setFieldValues] = useState({});

  const [newFieldName, setNewFieldName] = useState('');

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      const fields = await getFields();
      setAvailableFields(fields);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateField = async () => {
    if (!newFieldName.trim()) return;
    try {
      await createField({ name: newFieldName, type: 'text' });
      setNewFieldName('');
      loadFields(); 
      Alert.alert("Success", "New field added!");
    } catch (error) {
      Alert.alert("Error", "Could not create field");
    }
  };

  const handleInputChange = (fieldId, text) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: text 
    }));
  };

  const handleSaveProduct = async () => {
    if (!productName.trim()) {
      Alert.alert("Validation", "Product Name is required");
      return;
    }

    const payload = {
      name: productName,
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
        <Text style={styles.header}>Step 1: Define Custom Fields</Text>
        <Text style={styles.subHeader}>Missing a field? Add it here (e.g., "Color")</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="New Field Name"
            value={newFieldName}
            onChangeText={setNewFieldName}
          />
          <TouchableOpacity style={styles.smallButton} onPress={handleCreateField}>
            <Text style={styles.smallButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.header}>Step 2: Create Product</Text>
        
        <Text style={styles.label}>Product Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter product name"
          value={productName}
          onChangeText={setProductName}
        />

        {availableFields.map((field) => (
          <View key={field.id} style={styles.fieldContainer}>
            <Text style={styles.label}>{field.field_name}</Text>
            <TextInput
              style={styles.input}
              placeholder={`Enter ${field.field_name}`}
              value={fieldValues[field.id] || ''}
              onChangeText={(text) => handleInputChange(field.id, text)}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveProduct}>
          <Text style={styles.saveButtonText}>Save Product</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  section: {
    marginBottom: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subHeader: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  smallButton: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    marginLeft: 10,
  },
  smallButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 50,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});