export default class Help {
    constructor(parent) {
        this.page = parent;
        this.fm = this.page.fm;
        this.icons = this.page.icons;
        this.url = 'help/en.json';

        this.data = false;
        this.tooltip = false;

        document.addEventListener('click', e => this.removeTooltip(e));
    }

    async load() {
        const res = await this.fm.fetch(this.url);
        const text = await res.text();
        this.data = await JSON.parse(text);
    }

    renderButton(prop) {
        const button = document.createElement("button");
        button.className = 'help';
        button.type = 'button';
        button.innerHTML = this.icons.svg['message-circle-question-mark'];
        button.onclick = e => this.renderTooltip(e.target, prop);
        return button;
    }

    renderTooltip(button, prop) {
        this.removeTooltip();

        this.item = button.closest('.form-item');
        const label = button.closest('label');

        this.tooltip = document.createElement("div");
        this.tooltip.className = 'tooltip';
        this.tooltip.innerHTML = this.data[prop];
        this.item.classList.add('help');

        this.item.append(this.tooltip);

    }

    removeTooltip(e = false) {
        if (this.tooltip && (e === false || (e !== false && !e.target.closest('button.help')))) {
            this.tooltip.remove();
            this.item.classList.remove('help');
        }
    }
}