import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#007bff' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ title: 'StockFlow Products' }} 
      />
      <Stack.Screen 
        name="add" 
        options={{ title: 'Add New Product' }} 
      />
      <Stack.Screen 
        name="edit" 
        options={{ title: 'Edit Product' }} 
      />
    </Stack>
  );
}