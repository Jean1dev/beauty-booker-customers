import { Platform } from 'react-native';

export function showAlert(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    require('./alert.web').showAlert(title, message);
  } else {
    require('./alert.native').showAlert(title, message);
  }
}

export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
): void {
  if (Platform.OS === 'web') {
    require('./alert.web').showConfirm(title, message, onConfirm, onCancel);
  } else {
    require('./alert.native').showConfirm(title, message, onConfirm, onCancel);
  }
}
