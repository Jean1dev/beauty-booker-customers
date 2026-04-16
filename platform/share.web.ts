export interface ShareOptions {
  title?: string;
  message: string;
  url?: string;
}

export async function share(options: ShareOptions): Promise<void> {
  if (navigator.share) {
    await navigator.share({
      title: options.title,
      text: options.message,
      url: options.url,
    });
    return;
  }

  // Fallback: copy to clipboard
  const text = options.url ? `${options.message}\n${options.url}` : options.message;
  await navigator.clipboard.writeText(text);
}
