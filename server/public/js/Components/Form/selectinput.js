import Component from "./Component.js";
import Button from "./button.js";

export default class SelectInput extends Component {
    constructor(parent, storeKey, store, prop, inputType, values, locked, options) {
        super(parent, storeKey, store, prop, inputType, values, locked, options);

        this.elementTag = 'select';
        this.elementProps = {
            id: '',
            className: '',
            disabled: '',
            dataset: {},
            name: `input-${this.name}`,
            value: this.value,
            oninput: (e) => this.value = e.target.value,
        };

        this.init();
        this.render();
    }

    render() {
        super.render();

        // add options
        Array.isArray(this.values) ? this.values.forEach(option => {
            const o = document.createElement("option");
            o.innerHTML = o.value = option;
            this.element.append(o);
        }) : null;

        this.targetElement.append(this.element);
        this.setValue(this.value);

        // the clear button
        const clearButton = new Button(this.parent,
            this.storeKey, this.store, this.prop,
            this.inputType, this.values, this.locked, {
                innerHTML: '🞬',
                className: 'button clear',
                onclick: (e) => this.value = ''
            });

        this.targetElement.append(clearButton.element);
    }

    setValue(value) {
        super.setValue(value);
        this.check();
    }

    check() {

    }
}