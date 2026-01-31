/**
 * Page de modification du profil pour le client
 */

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    Camera,
    Check,
    Phone,
    User,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FormData {
    full_name: string;
    phone: string;
    avatar_url: string | null;
}

export default function ClientProfileEditScreen() {
    const router = useRouter();
    const { profile, refreshProfile } = useAuthStore();
    const [isUploading, setIsUploading] = useState(false);

    const [formData, setFormData] = useState<FormData>({
        full_name: '',
        phone: '',
        avatar_url: null,
    });

    // Initialize form data
    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                phone: profile.phone || '',
                avatar_url: profile.avatar_url,
            });
        }
    }, [profile]);

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async (data: FormData) => {
            if (!profile?.id) {
                throw new Error('Profile not found');
            }

            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: data.full_name,
                    phone: data.phone,
                    avatar_url: data.avatar_url,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', profile.id);

            if (error) throw error;
        },
        onSuccess: () => {
            refreshProfile();
            Alert.alert('Succès', 'Votre profil a été mis à jour', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        },
        onError: (error) => {
            Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
            console.error('Update error:', error);
        },
    });

    const handlePickImage = () => {
        Alert.alert(
            'Changer la photo',
            'Choisissez une option',
            [
                {
                    text: 'Prendre une photo',
                    onPress: handleTakePhoto,
                },
                {
                    text: 'Choisir dans la galerie',
                    onPress: handleChooseFromLibrary,
                },
                {
                    text: 'Annuler',
                    style: 'cancel',
                },
            ],
            { cancelable: true }
        );
    };

    const handleTakePhoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la caméra');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled && result.assets[0]?.base64) {
            await uploadImage(result.assets[0].base64);
        }
    };

    const handleChooseFromLibrary = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la galerie photo');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled && result.assets[0]?.base64) {
            await uploadImage(result.assets[0].base64);
        }
    };

    const uploadImage = async (base64: string) => {
        if (!profile?.id) return;

        setIsUploading(true);
        try {
            const fileName = `avatar-${profile.id}-${Date.now()}.jpg`;

            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, bytes.buffer, {
                    contentType: 'image/jpeg',
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            setFormData((prev) => ({ ...prev, avatar_url: publicUrl }));
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Erreur', 'Impossible de télécharger l\'image');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = () => {
        if (!formData.full_name.trim()) {
            Alert.alert('Erreur', 'Le nom est requis');
            return;
        }
        updateMutation.mutate(formData);
    };

    const updateField = (field: keyof FormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <ArrowLeft size={24} color={Colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Modifier mon profil</Text>
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={updateMutation.isPending}
                    >
                        {updateMutation.isPending ? (
                            <LoadingSpinner size="small" />
                        ) : (
                            <Check size={24} color={Colors.primary.DEFAULT} />
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Avatar Section */}
                    <View style={styles.avatarSection}>
                        <TouchableOpacity
                            style={styles.avatarContainer}
                            onPress={handlePickImage}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <View style={styles.avatarPlaceholder}>
                                    <LoadingSpinner size="small" />
                                </View>
                            ) : formData.avatar_url ? (
                                <Image
                                    source={{ uri: formData.avatar_url }}
                                    style={styles.avatar}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <User size={40} color={Colors.gray[400]} />
                                </View>
                            )}
                            <View style={styles.cameraButton}>
                                <Camera size={16} color={Colors.white} />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.avatarHint}>Appuyez pour changer la photo</Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.section}>
                        <View style={styles.inputGroup}>
                            <View style={styles.inputIcon}>
                                <User size={20} color={Colors.gray[400]} />
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Nom complet"
                                placeholderTextColor={Colors.gray[400]}
                                value={formData.full_name}
                                onChangeText={(text) => updateField('full_name', text)}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.inputIcon}>
                                <Phone size={20} color={Colors.gray[400]} />
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Téléphone"
                                placeholderTextColor={Colors.gray[400]}
                                value={formData.phone}
                                onChangeText={(text) => updateField('phone', text)}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.primary,
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[100],
        backgroundColor: Colors.white,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    saveButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 16,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.gray[100],
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primary.DEFAULT,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: Colors.white,
    },
    avatarHint: {
        marginTop: 8,
        fontSize: 13,
        color: Colors.text.secondary,
    },
    section: {
        marginBottom: 24,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.gray[200],
    },
    inputIcon: {
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.text.primary,
        paddingVertical: 14,
        paddingRight: 14,
    },
});
