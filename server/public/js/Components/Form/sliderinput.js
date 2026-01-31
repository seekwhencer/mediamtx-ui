import Component from "./Component.js";

export default class SliderInput extends Component {
    constructor(options) {
        super(options);

        this.elementTag = 'input';
        this.elementProps = {
            id: '',
            className: '',
            type: 'number',
            disabled: '',
            dataset: {},
            name: `input-${this.name}`,
            value: this.value,
            oninput: (e) => this.value = e.target.value,
        };

        this.debounceTimer = false;

        this.init();
        this.render();
    }

    render() {
        super.render();
        this.targetElement.append(this.element);
    }

    setValue(value) {
        super.setValue(value);
        this.check();
    }

    check() {

    }

    get value() {
        return super.value;
    }

    // extend with type convert
    set value(value) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            value = Number(value);
            if (!Number.isNaN(value)) { // stop if not a number
                super.value = value;
            }
        }, 100);
    }
}