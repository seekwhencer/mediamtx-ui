import Component from "./Component.js";

export default class TextInput extends Component {
    constructor(parent, storeKey, store, prop, inputType, values, locked, options) {
        super(parent, storeKey, store, prop, inputType, values, locked, options);

        this.elementTag = 'input';
        this.elementProps = {
            type: 'text',
            dataset: {},
            value: this.value,
            placeholder: 'type something ...',
            //oninput: (e) => this.value = e.target.value,
            onblur: e => this.value = e.target.value,
            onkeyup: e => e.key === 'Enter' ? this.value = e.target.value : null
        };

        this.init();
        this.render();
    }

    setValue(value) {
        super.setValue(value);
        this.check();
    }

    render(){
        super.render();
        this.targetElement.append(this.element);
    }

    check() {

    }

    get value() {
        return super.value;
    }

    // extend with type convert
    set value(value) {
        const number = Number(value);
        if (!Number.isNaN(number)) {
            super.value = number;
        } else {
            super.value = value;
        }
    }
}