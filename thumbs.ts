// Miniatury do katalogu: zrzuty z podglądu 3D (nick „KubaGG”), zapisane w src/assets/katalog.
// Gdy będą prawdziwe zdjęcia, wystarczy podmienić pliki o tych samych nazwach.
const files = import.meta.glob('../assets/katalog/*.jpg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>

export const thumb = (key: string): string | undefined => files[`../assets/katalog/${key.replace(':', '--')}.jpg`]
