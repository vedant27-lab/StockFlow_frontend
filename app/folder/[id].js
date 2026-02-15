import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert, Modal,
  ScrollView,
  StyleSheet,
  Text, TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import {
  createField,
  createProduct,
  deleteField,
  deleteFolder,
  deleteProduct,
  getFields,
  getProducts,
  updateField,
  updateFolder,
  updateProduct
} from '../../services/api';

export default function ExcelSheetScreen() {
  const router = useRouter();
  const { id, name: initialName } = useLocalSearchParams();
  const [folderName, setFolderName] = useState(initialName);
  
  const [fields, setFields] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Management State
  const [activeColumn, setActiveColumn] = useState(null); // Which column header is clicked
  const [showColMenu, setShowColMenu] = useState(false);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  
  // Inputs for Modals
  const [renameText, setRenameText] = useState("");

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      setFields(await getFields(id));
      setProducts(await getProducts(id));
    } catch (e) { console.error(e); }
  };

  // --- 1. DIRECT CELL EDITING (Auto-Save) ---
  const handleCellEdit = async (product, fieldId, newValue) => {
    // 1. Optimistic Update (Update UI immediately)
    const updatedProducts = products.map(p => {
      if (p.id === product.id) {
        // Update the specific value in the values array
        const newValues = p.values.map(v => 
          (v.id === fieldId || v.field_id === fieldId) ? { ...v, value: newValue } : v
        );
        // If value didn't exist yet, push it
        if (!newValues.find(v => v.id === fieldId || v.field_id === fieldId)) {
          newValues.push({ field_id: fieldId, value: newValue });
        }
        return { ...p, values: newValues };
      }
      return p;
    });
    setProducts(updatedProducts);

    // 2. Send to Backend
    // We need to convert the array back to the object format expected by the API
    const valueMap = {};
    updatedProducts.find(p => p.id === product.id).values.forEach(v => {
      valueMap[v.field_id || v.id] = v.value;
    });

    try {
      // Assuming your backend supports partial updates or we re-send everything
      // Ideally, create a specific endpoint for updating a single cell, but reuse updateProduct for now
      await updateProduct(product.id, { name: product.name, values: valueMap });
    } catch (e) {
      console.error("Save failed", e);
    }
  };

  const handleRenameProduct = async (product, newName) => {
    const updatedProducts = products.map(p => p.id === product.id ? { ...p, name: newName } : p);
    setProducts(updatedProducts);
    await updateProduct(product.id, { name: newName });
  };

  // --- 2. COLUMN MANAGEMENT ---
  const openColumnMenu = (field) => {
    setActiveColumn(field);
    setRenameText(field.name);
    setShowColMenu(true);
  };

  const handleRenameColumn = async () => {
    if (!renameText) return;
    await updateField(activeColumn.id, renameText);
    setShowColMenu(false);
    loadData();
  };

  const handleDeleteColumn = async () => {
    Alert.alert("Delete Column?", "Data in this column will be lost.", [
      { text: "Cancel" },
      { text: "Delete", style: 'destructive', onPress: async () => {
        await deleteField(activeColumn.id);
        setShowColMenu(false);
        loadData();
      }}
    ]);
  };

  const handleAddColumn = async () => {
    // Simple prompt for new column
    Alert.prompt("New Column", "Enter column name (e.g. Price)", [
      { text: "Cancel" },
      { text: "Create", onPress: async (text) => {
          if(text) {
            await createField({ name: text, type: 'number', folder_id: id });
            loadData();
          }
      }}
    ]);
  };

  // --- 3. FOLDER MANAGEMENT ---
  const handleRenameFolder = async () => {
    if (!renameText) return;
    await updateFolder(id, renameText);
    setFolderName(renameText);
    setShowFolderMenu(false);
  };

  const handleDeleteFolder = async () => {
    Alert.alert("Delete Folder?", "All products inside will be deleted.", [
      { text: "Cancel" },
      { text: "Delete", style: 'destructive', onPress: async () => {
        await deleteFolder(id);
        router.back();
      }}
    ]);
  };

  // --- 4. ADD/DELETE ROW ---
  const handleAddRow = async () => {
    // Create a blank row immediately
    await createProduct({ name: "New Item", folder_id: id, values: {} });
    loadData();
  };

  const handleDeleteRow = async (prodId) => {
    await deleteProduct(prodId);
    loadData();
  };

  return (
    <View style={styles.container}>
      
      {/* HEADER: FOLDER NAME + MENU */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => { setRenameText(folderName); setShowFolderMenu(true); }}>
          <Text style={styles.folderTitle}>{folderName} ▼</Text>
        </TouchableOpacity>
      </View>

      {/* THE EXCEL GRID */}
      <ScrollView horizontal contentContainerStyle={{flexGrow: 1}}>
        <View>
          {/* HEADER ROW */}
          <View style={styles.headerRow}>
            <View style={[styles.cell, {width: 140, backgroundColor: '#f0f0f0'}]}>
              <Text style={styles.headerText}>Product Name</Text>
            </View>
            
            {fields.map(f => (
              <TouchableOpacity 
                key={f.id} 
                style={[styles.cell, {width: 100, backgroundColor: '#f0f0f0'}]}
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
          <ScrollView style={{marginBottom: 100}}>
            {products.map((prod) => (
              <View key={prod.id} style={styles.row}>
                {/* Product Name Input */}
                <TextInput 
                  style={[styles.cell, styles.input, {width: 140, fontWeight: 'bold'}]}
                  value={prod.name}
                  onChangeText={(text) => handleRenameProduct(prod, text)}
                />

                {/* Dynamic Fields Inputs */}
                {fields.map(f => {
                  const valObj = prod.values.find(v => v.id === f.id || v.field_id === f.id);
                  return (
                    <TextInput
                      key={f.id}
                      style={[styles.cell, styles.input, {width: 100}]}
                      value={valObj ? String(valObj.value) : ''}
                      placeholder="-"
                      keyboardType="numeric"
                      // Auto-save on every character or onBlur (Blur is safer for API)
                      onBlur={(e) => handleCellEdit(prod, f.id, e.nativeEvent.text)} 
                      // For smoother UI, we might need state binding, but direct edit works for simple cases
                      onChangeText={(text) => {
                         // Optional: Update local state immediately if laggy
                      }}
                    />
                  );
                })}

                {/* Delete Row Button */}
                <TouchableOpacity style={styles.deleteRowBtn} onPress={() => handleDeleteRow(prod.id)}>
                   <Text style={{color:'red', fontWeight:'bold'}}>×</Text>
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
              <Text style={styles.menuText}>Rename Column</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteColumn}>
              <Text style={[styles.menuText, {color: 'red'}]}>Delete Column</Text>
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
              <Text style={styles.menuText}>Rename Folder</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteFolder}>
              <Text style={[styles.menuText, {color: 'red'}]}>Delete Folder</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 40 },
  topBar: { paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderColor: '#eee' },
  folderTitle: { fontSize: 22, fontWeight: 'bold' },

  headerRow: { flexDirection: 'row', borderBottomWidth: 2, borderColor: '#333' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee', alignItems: 'center' },
  
  cell: { height: 50, justifyContent: 'center', paddingHorizontal: 10, borderRightWidth: 1, borderColor: '#eee' },
  headerText: { fontWeight: 'bold', fontSize: 13 },
  input: { fontSize: 14, color: '#333' },
  
  addHeader: { width: 60, backgroundColor: '#e6f7ff', justifyContent: 'center', alignItems: 'center' },
  addHeaderText: { color: '#007bff', fontWeight: 'bold' },

  deleteRowBtn: { width: 40, height: 50, justifyContent: 'center', alignItems: 'center' },
  
  addRowBtn: { padding: 15, alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee' },
  addRowText: { color: '#28a745', fontWeight: 'bold' },

  // Menus
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  menuBox: { width: 250, backgroundColor: 'white', borderRadius: 10, padding: 20, elevation: 5 },
  menuTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  menuInput: { borderBottomWidth: 1, borderColor: '#ddd', marginBottom: 15, fontSize: 16, paddingVertical: 5 },
  menuItem: { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  menuText: { fontSize: 16 }
});