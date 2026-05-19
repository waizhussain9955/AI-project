import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { MediaAttachment } from '../types/incident.types';
import { ENV } from '../../config/env';

const MAX_IMAGE_DIMENSION = 1920;
const COMPRESSION_QUALITY = 0.75;

export const mediaService = {
  /**
   * Opens image library picker and returns a MediaAttachment.
   */
  pickImage: async (): Promise<MediaAttachment | null> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[Media] Gallery permission denied');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    return {
      id: `media_${Date.now()}`,
      uri: asset.uri,
      type: asset.type === 'video' ? 'video' : 'image',
    };
  },

  /**
   * Opens camera for photo/video capture.
   */
  captureFromCamera: async (): Promise<MediaAttachment | null> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[Media] Camera permission denied');
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    return {
      id: `media_${Date.now()}`,
      uri: asset.uri,
      type: asset.type === 'video' ? 'video' : 'image',
    };
  },

  /**
   * Compresses an image to reduce upload size.
   */
  compressMedia: async (uri: string): Promise<string> => {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: MAX_IMAGE_DIMENSION } }],
        { compress: COMPRESSION_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
      );
      return result.uri;
    } catch {
      console.warn('[Media] Compression failed, using original');
      return uri;
    }
  },

  /**
   * Uploads media to server and returns public URL.
   * (Simulated — returns local URI in dev)
   */
  uploadImage: async (uri: string, incidentId: string): Promise<string> => {
    console.log(`[Media] Uploading ${uri} for incident ${incidentId}`);
    await new Promise((res) => setTimeout(res, 800));
    // In production: use FormData + fetch to your upload endpoint
    return uri; // dev fallback
  },

  uploadVideo: async (uri: string, incidentId: string): Promise<string> => {
    console.log(`[Media] Uploading video for incident ${incidentId}`);
    await new Promise((res) => setTimeout(res, 2000));
    return uri;
  },

  /**
   * Attaches an uploaded URL to an incident media array.
   */
  attachToIncident: (attachment: MediaAttachment, uploadedUrl: string): MediaAttachment => ({
    ...attachment,
    uploadedUrl,
  }),
};
