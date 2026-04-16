import { Alert } from 'react-native';

export function showAlert(title: string, message?: string): void {
  Alert.alert(title, message);
}

export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
): void {
  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel', onPress: () => onCancel?.() },
    { text: 'Confirmar', style: 'destructive', onPress: onConfirm },
  ]);
}
