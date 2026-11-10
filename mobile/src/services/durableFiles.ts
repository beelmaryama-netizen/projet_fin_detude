import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
export async function keepLocalFile(uri: string, name = 'attachment') {
 if (Platform.OS === 'web' || !uri.startsWith('file:') || uri.startsWith(FileSystem.documentDirectory ?? 'unavailable')) return uri;
 const folder = FileSystem.documentDirectory + 'magicpro-files/';
 await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
 const extension = name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || 'jpg';
 const target = folder + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + extension;
 await FileSystem.copyAsync({ from: uri, to: target }); return target;
}
