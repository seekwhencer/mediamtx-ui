export default class Toast {
    constructor(options = {}) {
        this.duration = options.duration ?? 3000;
        this.maxWidth = options.maxWidth ?? 300;
        this.position = options.position ?? 'top-right';

        this._createContainer(this.maxWidth, this.position);
    }

    error(message) {
        this.show('error', message);
    }

    success(message) {
        this.show('success', message);
    }

    warn(message) {
        this.show('warn', message);
    }

    info(message) {
        this.show('info', message);
    }

    show(type = 'info', message) {
        if (typeof message !== 'string' || !message.trim()) {
            throw new Error('Toast.show: message must be a non-empty string');
        }

        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.innerHTML = message;

        // Accessibility
        if (type === 'error' || type === 'warn') {
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'assertive');
        } else {
            toast.setAttribute('role', 'status');
            toast.setAttribute('aria-live', 'polite');
        }

        this.container.appendChild(toast);

        // Transition trigger
        requestAnimationFrame(() => toast.classList.add('show'));

        // Auto-remove
        setTimeout(() => {
            toast.classList.remove('show');

            const cleanup = () => toast.remove();
            toast.addEventListener('transitionend', cleanup, { once: true });

            // Fallback
            setTimeout(cleanup, 500);
        }, this.duration);
    }

    _createContainer(maxWidth, position) {
        const existing = document.querySelector('.toast-container');
        if (existing) {
            this.container = existing;
            return;
        }

        this.container = document.createElement('div');
        this.container.className = `toast-container ${position}`;
        this.container.style.maxWidth = `${maxWidth}px`;
        document.body.appendChild(this.container);
    }
}
