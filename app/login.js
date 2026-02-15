import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { login } from '../services/api';

const screenWidth = Dimensions.get("window").width;

export default function LoginScreen() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            Alert.alert('Error', 'Please enter both username and password');
            return;
        }

        setLoading(true);
        try {
            await login(username, password);
            Alert.alert('Success', 'Logged in successfully!', [
                { text: 'OK', onPress: () => router.replace('/') }
            ]);
        } catch (error) {
            console.error('Login error:', error);
            Alert.alert('Login Failed', 'Invalid username or password');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        router.replace('/');
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoIcon}>📦</Text>
                    </View>
                    <Text style={styles.title}>StockFlow</Text>
                    <Text style={styles.subtitle}>Admin Login</Text>
                </View>

                {/* Login Form */}
                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Username</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter username"
                            placeholderTextColor="#adb5bd"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter password"
                            placeholderTextColor="#adb5bd"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.loginButtonText}>
                            {loading ? 'Logging in...' : 'Login as Admin'}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={handleSkip}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.skipButtonText}>Continue as Viewer</Text>
                    </TouchableOpacity>

                    {/* Info Box */}
                    <View style={styles.infoBox}>
                        <Text style={styles.infoIcon}>ℹ️</Text>
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoTitle}>View-Only Mode</Text>
                            <Text style={styles.infoText}>
                                You can browse and view all data without logging in. Admin login is required only for editing, creating, or deleting content.
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fc'
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
        paddingTop: 60
    },

    // Header
    header: {
        alignItems: 'center',
        marginBottom: 40
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#4e73df',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#4e73df',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6
    },
    logoIcon: {
        fontSize: 40
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4
    },
    subtitle: {
        fontSize: 16,
        color: '#6c757d',
        fontWeight: '500'
    },

    // Form
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3
    },
    inputGroup: {
        marginBottom: 20
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#495057',
        marginBottom: 8
    },
    input: {
        borderWidth: 1,
        borderColor: '#dee2e6',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#1a1a1a',
        backgroundColor: '#f8f9fc'
    },

    // Buttons
    loginButton: {
        backgroundColor: '#4e73df',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#4e73df',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4
    },
    loginButtonDisabled: {
        opacity: 0.6
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700'
    },

    // Divider
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#dee2e6'
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 12,
        color: '#6c757d',
        fontWeight: '600'
    },

    // Skip Button
    skipButton: {
        borderWidth: 2,
        borderColor: '#4e73df',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center'
    },
    skipButtonText: {
        color: '#4e73df',
        fontSize: 16,
        fontWeight: '700'
    },

    // Info Box
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#e7f3ff',
        borderRadius: 12,
        padding: 16,
        marginTop: 24,
        borderLeftWidth: 4,
        borderLeftColor: '#4e73df'
    },
    infoIcon: {
        fontSize: 20,
        marginRight: 12
    },
    infoTextContainer: {
        flex: 1
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4
    },
    infoText: {
        fontSize: 13,
        color: '#495057',
        lineHeight: 18
    },

    // Credentials Box
    credentialsBox: {
        backgroundColor: '#fff3cd',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#ffc107'
    },
    credentialsTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#856404',
        marginBottom: 8
    },
    credentialsText: {
        fontSize: 13,
        color: '#856404',
        marginBottom: 4
    },
    credentialsBold: {
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
    }
});
