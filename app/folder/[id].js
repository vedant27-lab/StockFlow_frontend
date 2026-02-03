import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { deleteProduct, getProducts } from '../../services/api';

export default function FolderContentsScreen() {
  const { id, name } = useLocalSearchParams(); 
  const router = useRouter();
  const [products, setProducts] = useState([]);

  const loadProducts = async () => {
    try {
      const data = await getProducts(id); 
      setProducts(data);
    } catch (error) {
      console.error(error);
    }
  };

  useFocusEffect(useCallback(() => { loadProducts(); }, []));

  const handleDelete = async (productId) => {
    await deleteProduct(productId);
    loadProducts();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{name}</Text>
      
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={styles.empty}>No products in this folder.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.prodName}>{item.name}</Text>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={styles.delText}>Delete</Text>
              </TouchableOpacity>
            </View>
            {Object.entries(item.fields).map(([k, v]) => (
              <Text key={k} style={styles.field}>{k}: {v}</Text>
            ))}
            
            <TouchableOpacity 
              style={styles.editBtn}
              onPress={() => router.push({
                pathname: "/edit",
                params: { id: item.id, name: item.name, fields: JSON.stringify(item.fields), folderId: id }
              })}
            >
              <Text style={styles.editText}>Edit Details</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push({ pathname: "/add", params: { folderId: id } })}
      >
        <Text style={styles.fabText}>+ Add Item</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  prodName: { fontSize: 18, fontWeight: 'bold' },
  delText: { color: 'red', fontWeight: 'bold' },
  field: { color: '#555', marginBottom: 2 },
  empty: { textAlign: 'center', marginTop: 50, color: '#888' },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#007bff', padding: 15, borderRadius: 30 },
  fabText: { color: 'white', fontWeight: 'bold' },
  editBtn: { marginTop: 10, padding: 8, backgroundColor: '#eee', alignItems: 'center', borderRadius: 5 },
  editText: { fontSize: 12 }
});