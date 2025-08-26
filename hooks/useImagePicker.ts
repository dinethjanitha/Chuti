import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface ImagePickerResult {
  uri: string;
  fileName: string;
  fileSize: number;
}

export const useImagePicker = () => {
  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need gallery permissions to select images!'
        );
        return false;
      }

      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera permissions to take photos!'
        );
        return false;
      }
    }
    return true;
  };

  const pickImage = async (): Promise<ImagePickerResult | null> => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;

    return new Promise((resolve) => {
      Alert.alert(
        'Select Image',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
          {
            text: 'Camera',
            onPress: async () => {
              try {
                const result = await ImagePicker.launchCameraAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [1, 1],
                  quality: 0.8,
                  base64: false,
                });

                if (!result.canceled && result.assets[0]) {
                  const asset = result.assets[0];
                  resolve({
                    uri: asset.uri,
                    fileName: asset.fileName || `camera_${Date.now()}.jpg`,
                    fileSize: asset.fileSize || 0,
                  });
                } else {
                  resolve(null);
                }
              } catch (error) {
                console.error('Camera error:', error);
                Alert.alert('Error', 'Failed to take photo');
                resolve(null);
              }
            },
          },
          {
            text: 'Gallery',
            onPress: async () => {
              try {
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [1, 1],
                  quality: 0.8,
                  base64: false,
                });

                if (!result.canceled && result.assets[0]) {
                  const asset = result.assets[0];
                  resolve({
                    uri: asset.uri,
                    fileName: asset.fileName || `image_${Date.now()}.jpg`,
                    fileSize: asset.fileSize || 0,
                  });
                } else {
                  resolve(null);
                }
              } catch (error) {
                console.error('Gallery error:', error);
                Alert.alert('Error', 'Failed to select image');
                resolve(null);
              }
            },
          },
        ]
      );
    });
  };

  return { pickImage };
};
