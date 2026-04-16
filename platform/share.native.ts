import { Share } from 'react-native';

export interface ShareOptions {
  title?: string;
  message: string;
  url?: string;
}

export async function share(options: ShareOptions): Promise<void> {
  await Share.share({
    title: options.title,
    message: options.url ? `${options.message}\n${options.url}` : options.message,
  });
}
