import Component from "./Component.js";

export default class TextareaInput extends Component {
    constructor(parent, storeKey, store, prop, inputType, values, locked, options) {
        super(parent, storeKey, store, prop, inputType, values, locked, options);

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

        this.initialHeight = getComputedStyle(this.element).height;

        this.element.onfocus = this.element.oninput = () => {
            this.element.style.height = 'auto';
            const height = this.element.scrollHeight;
            this.element.style.height = `${height}px`;
        };

        this.element.addEventListener('blur', () => this.element.style.height = this.initialHeight);
        this.targetElement.append(this.element);
    }

    check() {

    }
}