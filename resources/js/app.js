import Alpine from 'alpinejs';

window.Alpine = Alpine;

Alpine.data('share', (url) => ({
    copied: false,
    async copy() {
        try {
            await navigator.clipboard.writeText(url);
            this.copied = true;
            setTimeout(() => (this.copied = false), 1800);
        } catch {
            window.prompt('Copy this link', url);
        }
    },
}));

Alpine.start();
