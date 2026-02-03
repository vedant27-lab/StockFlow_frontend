import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { deleteProduct, getProducts } from '../services/api';

export default function ProductListScreen() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      Alert.alert("Error", "Failed to load products. Check your API URL.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [])
  );

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      loadProducts();
    } catch (error) {
      Alert.alert("Error", "Could not delete product");
    }
  };

  const handleEdit = (item) => {
    const fieldsString = JSON.stringify(item.fields);
    
    router.push({
      pathname: "/edit",
      params: { 
        id: item.id, 
        name: item.name, 
        fields: fieldsString 
      }
    });
  };

  const renderProduct = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.productName}>{item.name}</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            onPress={() => handleEdit(item)}
            style={styles.editButton}
          >
            <Text style={styles.btnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleDelete(item.id)}
            style={styles.deleteButton}
          >
            <Text style={styles.btnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.fieldsContainer}>
        {Object.entries(item.fields).map(([key, value]) => (
          <Text key={key} style={styles.fieldText}>
            <Text style={styles.fieldLabel}>{key}: </Text> {value}
          </Text>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No products found.</Text>}
        />
      )}

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/add')} 
      >
        <Text style={styles.fabText}>+ Add Product</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  listContent: {
    paddingBottom: 80,
  },
  card: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1, 
  },
  buttonGroup: {
    flexDirection: 'row',
  },
  editButton: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  btnText: {
    color: 'black', 
    fontSize: 12,
    fontWeight: 'bold',
  },
  fieldsContainer: {
    marginTop: 5,
  },
  fieldText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  fieldLabel: {
    fontWeight: '600',
    color: '#555',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#888',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007bff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 5,
  },
  fabText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});