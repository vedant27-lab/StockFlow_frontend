import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { createFolder } from '../services/api';

export default function CreateFolderScreen() {
  const router = useRouter();
  const [name, setName] = useState('');

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      await createFolder(name);
      router.back(); // Go back to Home
    } catch (error) {
      Alert.alert("Error", "Could not create folder");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Category</Text>
      <Text style={styles.label}>Category Name</Text>
      <TextInput 
        style={styles.input} 
        placeholder="e.g. Groceries, Electronics" 
        value={name}
        onChangeText={setName}
        autoFocus
      />
      <TouchableOpacity style={styles.btn} onPress={handleSave}>
        <Text style={styles.btnText}>Create Category</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  label: { color: '#666', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 8, fontSize: 16, marginBottom: 20 },
  btn: { backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});