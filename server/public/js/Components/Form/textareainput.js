import Component from "./Component.js";

export default class TextareaInput extends Component {
    constructor(options) {
        super(options);

        this.elementTag = 'textarea';
        this.elementProps = {
            dataset: {},
            value: this.value,
            placeholder: 'type like a bash ...',
            onblur: e => this.value = e.target.value,
        };


        this.init();
        this.render();
    }

    setValue(value) {
        super.setValue(value);
        this.check();
    }

    render() {
        super.render();

        this.element.onfocus = this.element.oninput = () => {
            this.initialHeight = this.initialHeight === undefined ? parseInt(getComputedStyle(this.element).height.replace('px', '')) : this.initialHeight;
            this.element.style.height = 'auto'; // <- important
            const height = this.element.scrollHeight < this.initialHeight ? this.initialHeight : this.element.scrollHeight;
            this.element.style.height = `${height}px`;
        };

        this.element.addEventListener('blur', () => this.element.style.height = `${this.initialHeight}px`);
        this.targetElement.append(this.element);
    }

    check() {

    }
}