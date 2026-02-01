import Component from "./Component.js";
import Slider from "./slider.js";
import TextInput from "./textinput.js";

export default class NumberSliderInput extends Component {
    constructor(options) {
        super(options);

        this.elementTag = 'input';
        this.elementProps = {
            type: 'hidden',
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
        if (this.values.isRange) {
            this.targetElement.classList.add('range-slider');
        }

        this.renderInputs();

        // the slider
        const sliderOptions = {
            value: this.value,
            isRange: this.values.isRange,
            isPow2: this.values.isPow2,
            hasHandleValue: this.values.hasHandleValue,
            min: this.values.min,
            max: this.values.max,
            step: this.values.step,
            onChange: value => this.concatValue(value),
        };
        this.slider = new Slider(sliderOptions);

        this.targetElement.append(this.element);
        this.targetElement.append(this.inputs);
        this.targetElement.append(this.slider.element);

    }

    renderInputs() {
        this.inputs = document.createElement('div');
        this.inputs.className = 'slider-input';

        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.value = this.value[0] || this.value || 0;
        this.input.onblur = e => this.concatValue();
        this.input.onkeyup = e => e.key === 'Enter' ? this.concatValue() : null;
        this.input.placeholder = 'from';
        this.inputs.append(this.input);

        if (this.values.isRange === true) {
            this.toInput = document.createElement('input');
            this.toInput.type = 'text';
            this.toInput.value = this.value[1] || '';
            this.toInput.onblur = e => this.concatValue();
            this.toInput.onkeyup = e => e.key === 'Enter' ? this.concatValue() : null;
            this.toInput.placeholder = 'to';
            this.inputs.append(this.toInput);
        }

    }

    concatValue(sliderValue) {
        if (sliderValue !== undefined) {
            if (typeof sliderValue === 'object') {
                this.input.value = Number(sliderValue.start);
                this.toInput.value = Number(sliderValue.end);
            }
            if (typeof sliderValue === 'string' || typeof sliderValue === 'number') {
                this.input.value = Number(sliderValue);
            }
        }

        if (this.values.isRange === true) {
            this.value = [Number(this.input.value), Number(this.toInput.value)];
        } else {
            this.value = Number(this.input.value);
        }

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
        this.debounceTimer = setTimeout(() => super.value = value, 100);
    }
}
const toExp = v => {
    if (v <= 0 || (v & (v - 1)) !== 0) {
        return 0;
        //throw new Error("value ist keine Zweierpotenz");
    }
    return Math.log2(v);
};