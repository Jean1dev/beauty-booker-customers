export function showAlert(title: string, message?: string): void {
  window.alert(message ? `${title}\n\n${message}` : title);
}

export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
): void {
  const confirmed = window.confirm(`${title}\n\n${message}`);
  if (confirmed) {
    onConfirm();
  } else {
    onCancel?.();
  }
}
