/**
 * Page de modification du profil pour le provider
 */

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    Briefcase,
    Camera,
    Check,
    FileText,
    Globe,
    Mail,
    MapPin,
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

interface ProviderData {
    id: string;
    business_name: string;
    description: string | null;
    business_email: string | null;
    business_phone: string | null;
    address: string | null;
    city: string | null;
    postal_code: string | null;
    website: string | null;
}

interface FormData {
    // Profile fields
    full_name: string;
    phone: string;
    avatar_url: string | null;
    // Provider fields
    business_name: string;
    description: string;
    business_email: string;
    business_phone: string;
    address: string;
    city: string;
    postal_code: string;
    website: string;
}

export default function ProviderProfileEditScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { profile, refreshProfile } = useAuthStore();
    const [isUploading, setIsUploading] = useState(false);

    const [formData, setFormData] = useState<FormData>({
        full_name: '',
        phone: '',
        avatar_url: null,
        business_name: '',
        description: '',
        business_email: '',
        business_phone: '',
        address: '',
        city: '',
        postal_code: '',
        website: '',
    });

    // Fetch provider data
    const { data: providerData, isLoading: providerLoading } = useQuery({
        queryKey: ['provider', 'edit', profile?.id],
        queryFn: async (): Promise<ProviderData | null> => {
            if (!profile?.id) return null;

            const { data, error } = await supabase
                .from('providers')
                .select('id, business_name, description, business_email, business_phone, address, city, postal_code, website')
                .eq('user_id', profile.id)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!profile?.id,
    });

    // Initialize form data
    useEffect(() => {
        if (profile) {
            setFormData((prev) => ({
                ...prev,
                full_name: profile.full_name || '',
                phone: profile.phone || '',
                avatar_url: profile.avatar_url,
            }));
        }
    }, [profile]);

    useEffect(() => {
        if (providerData) {
            setFormData((prev) => ({
                ...prev,
                business_name: providerData.business_name || '',
                description: providerData.description || '',
                business_email: providerData.business_email || '',
                business_phone: providerData.business_phone || '',
                address: providerData.address || '',
                city: providerData.city || '',
                postal_code: providerData.postal_code || '',
                website: providerData.website || '',
            }));
        }
    }, [providerData]);

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async (data: FormData) => {
            if (!profile?.id || !providerData?.id) {
                throw new Error('Profile or provider not found');
            }

            // Update profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: data.full_name,
                    phone: data.phone,
                    avatar_url: data.avatar_url,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', profile.id);

            if (profileError) throw profileError;

            // Update provider
            const { error: providerError } = await supabase
                .from('providers')
                .update({
                    business_name: data.business_name,
                    description: data.description || null,
                    business_email: data.business_email || null,
                    business_phone: data.business_phone || null,
                    address: data.address || null,
                    city: data.city || null,
                    postal_code: data.postal_code || null,
                    website: data.website || null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', providerData.id);

            if (providerError) throw providerError;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['provider'] });
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
            base64: true, // Get base64 directly
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
            base64: true, // Get base64 directly
        });

        if (!result.canceled && result.assets[0]?.base64) {
            await uploadImage(result.assets[0].base64);
        }
    };

    const uploadImage = async (base64: string) => {
        if (!profile?.id) {
            console.log('No profile ID, aborting upload');
            return;
        }

        console.log('Starting upload, base64 length:', base64.length);
        setIsUploading(true);
        try {
            const fileName = `avatar-${profile.id}-${Date.now()}.jpg`;
            console.log('File path:', fileName);

            // Decode base64 to array buffer
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            console.log('Bytes array size:', bytes.length);

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, bytes.buffer, {
                    contentType: 'image/jpeg',
                    upsert: true,
                });

            console.log('Upload result:', { uploadData, uploadError });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            console.log('Public URL:', publicUrl);
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
        if (!formData.business_name.trim()) {
            Alert.alert('Erreur', 'Le nom commercial est requis');
            return;
        }
        updateMutation.mutate(formData);
    };

    const updateField = (field: keyof FormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    if (providerLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <LoadingSpinner />
                </View>
            </SafeAreaView>
        );
    }

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

                    {/* Personal Info Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Informations personnelles</Text>

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
                                placeholder="Téléphone personnel"
                                placeholderTextColor={Colors.gray[400]}
                                value={formData.phone}
                                onChangeText={(text) => updateField('phone', text)}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>

                    {/* Business Info Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Informations professionnelles</Text>

                        <View style={styles.inputGroup}>
                            <View style={styles.inputIcon}>
                                <Briefcase size={20} color={Colors.gray[400]} />
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Nom commercial *"
                                placeholderTextColor={Colors.gray[400]}
                                value={formData.business_name}
                                onChangeText={(text) => updateField('business_name', text)}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.inputIcon}>
                                <FileText size={20} color={Colors.gray[400]} />
                            </View>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Description de votre activité"
                                placeholderTextColor={Colors.gray[400]}
                                value={formData.description}
                                onChangeText={(text) => updateField('description', text)}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.inputIcon}>
                                <Mail size={20} color={Colors.gray[400]} />
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Email professionnel"
                                placeholderTextColor={Colors.gray[400]}
                                value={formData.business_email}
                                onChangeText={(text) => updateField('business_email', text)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.inputIcon}>
                                <Phone size={20} color={Colors.gray[400]} />
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Téléphone professionnel"
                                placeholderTextColor={Colors.gray[400]}
                                value={formData.business_phone}
                                onChangeText={(text) => updateField('business_phone', text)}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.inputIcon}>
                                <Globe size={20} color={Colors.gray[400]} />
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Site web"
                                placeholderTextColor={Colors.gray[400]}
                                value={formData.website}
                                onChangeText={(text) => updateField('website', text)}
                                keyboardType="url"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    {/* Location Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Adresse</Text>

                        <View style={styles.inputGroup}>
                            <View style={styles.inputIcon}>
                                <MapPin size={20} color={Colors.gray[400]} />
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Adresse"
                                placeholderTextColor={Colors.gray[400]}
                                value={formData.address}
                                onChangeText={(text) => updateField('address', text)}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, styles.postalCodeInput]}>
                                <TextInput
                                    style={styles.inputWithPadding}
                                    placeholder="Code postal"
                                    placeholderTextColor={Colors.gray[400]}
                                    value={formData.postal_code}
                                    onChangeText={(text) => updateField('postal_code', text)}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={styles.spacer} />
                            <View style={[styles.inputGroup, styles.cityInput]}>
                                <TextInput
                                    style={styles.inputWithPadding}
                                    placeholder="Ville"
                                    placeholderTextColor={Colors.gray[400]}
                                    value={formData.city}
                                    onChangeText={(text) => updateField('city', text)}
                                />
                            </View>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        paddingBottom: 40,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 32,
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
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'flex-start',
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
    textArea: {
        height: 100,
        paddingTop: 14,
    },
    row: {
        flexDirection: 'row',
    },
    postalCodeInput: {
        flex: 0.35,
        minWidth: 100,
    },
    cityInput: {
        flex: 0.65,
    },
    inputWithPadding: {
        flex: 1,
        fontSize: 16,
        color: Colors.text.primary,
        paddingVertical: 14,
        paddingHorizontal: 14,
    },
    spacer: {
        width: 12,
    },
});
