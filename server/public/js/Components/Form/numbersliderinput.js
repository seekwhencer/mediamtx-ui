import Component from "./Component.js";
import Slider from "./slider.js";

export default class NumberSliderInput extends Component {
    constructor(options) {
        super(options);

        this.elementTag = 'input';
        this.elementProps = {
            type: 'text',
            disabled: '',
            name: `input-${this.name}`,
            value: this.value,
            blur: (e) => this.value = e.target.value,
            onkeyup: e => e.key === 'Enter' ? this.value = e.target.value : null
        };

        this.debounceTimer = false;

        this.init();
        this.render();
    }

    render() {
        super.render();
        this.targetElement.classList.add('number-slider');

        const sliderOptions = {
            value: this.value,
            isPow2: this.values.isPow2,
            hasHandleValue: this.values.hasHandleValue,
            min: this.values.min,
            max: this.values.max,
            step: this.values.step,
            onChange: value => this.value = value,
        };
        this.slider = new Slider(sliderOptions);

        this.targetElement.append(this.element);
        this.targetElement.append(this.slider.element);

    }

    setValue(value) {
        super.setValue(value);
        this.check();
        this.slider.setValue(value);
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
const toExp = v => {
    if (v <= 0 || (v & (v - 1)) !== 0) {
        return 0;
        //throw new Error("value ist keine Zweierpotenz");
    }
    return Math.log2(v);
};