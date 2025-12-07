import { FileData } from '../types';

export const fileToBase64 = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const processFile = async (file: File): Promise<FileData> => {
  const base64 = await fileToBase64(file);
  const previewUrl = URL.createObjectURL(file);
  
  return {
    file,
    previewUrl,
    base64,
    mimeType: file.type
  };
};

export const isValidImage = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  return validTypes.includes(file.type);
};

export const isValidDocument = (file: File): boolean => {
  const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  return validTypes.includes(file.type);
};

export const isValidAudio = (file: File): boolean => {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/mp3', 'audio/ogg', 'audio/x-m4a'];
    return validTypes.some(type => file.type.includes(type)) || file.type.startsWith('audio/');
};