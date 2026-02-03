import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { getFields, updateProduct } from '../services/api';

export default function EditProductScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const productId = params.id;
  const initialName = params.name;
  
  const initialFieldValues = params.fields ? JSON.parse(params.fields) : {};

  const [productName, setProductName] = useState(initialName);
  const [fieldValues, setFieldValues] = useState(initialFieldValues);
  const [availableFields, setAvailableFields] = useState([]);

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

  const handleInputChange = (fieldId, text) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: text 
    }));
  };

  const handleUpdate = async () => {
    if (!productName.trim()) {
      Alert.alert("Error", "Product Name is required");
      return;
    }

    const payload = {
      name: productName,
      fields: fieldValues
    };

    try {
      await updateProduct(productId, payload);
      Alert.alert("Success", "Product Updated!");
      router.back(); 
    } catch (error) {
      Alert.alert("Error", "Could not update product");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Edit Product</Text>

      <Text style={styles.label}>Product Name</Text>
      <TextInput
        style={styles.input}
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

      <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
        <Text style={styles.updateButtonText}>Update Product</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
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
  updateButton: {
    backgroundColor: '#ffc107', 
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 50,
  },
  updateButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});