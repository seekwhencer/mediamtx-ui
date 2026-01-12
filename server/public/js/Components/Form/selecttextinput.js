import Component from "./Component.js";
import {Button, TextInput} from "./index.js";

export default class SelectTextInput extends Component {
    constructor(parent, storeKey, store, prop, inputType, values, locked, options) {
        super(parent, storeKey, store, prop, inputType, values, locked, options);
        this.label = this.constructor.name.toUpperCase();

        this.elementTag = 'select';
        this.elementProps = {
            id: '',
            className: '',
            disabled: '',
            dataset: {},
            name: `input-${this.name}`,
            value: this.value,
            oninput: e => this.checkValue(e.target.value),
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
        this.parent.element.classList.add('select-text');

        // the text input
        this.sourceInput = new TextInput(this.parent,
            this.storeKey, this.store, this.prop,
            this.inputType, this.values, this.locked, {
                onblur: e => this.checkValue(e.target.value),
                onkeyup: e => e.key === 'Enter' ? this.checkValue(e.target.value) : null
            });


        // the clear button
        const clearButton = new Button(this.parent,
            this.storeKey, this.store, this.prop,
            this.inputType, this.values, this.locked, {
                innerHTML: '🞬',
                className: 'button clear',
                onclick: (e) => this.checkValue()
            });

        this.targetElement.append(clearButton.element);

        if (this.values.includes(this.value)) {
            this.setValue(this.value);
        } else {
            this.check();
        }

    }

    checkValue(value) {
        if (value === '') {
            this.sourceInput.element.value = '';
            this.element.value = '';
        }

        //@TODO remove it!!!!
        /*if (value !== 'redirect')
            this.settings['sourceRedirect'] = '';

        if (value !== 'publisher')
            this.settings['sourceOnDemand'] = 'false';
*/
        this.value = value
        this.check();
    }

    setValue(value) {
        super.setValue(value);
        this.check();
    }

    check() {
        const inputValue = this.sourceInput.element.value;

        if (this.values.includes(inputValue))
            this.sourceInput.element.value = '';

        const item = this.parent.element;
        if (this.element.value === '') {
            item.classList.add('custom');
        } else {
            item.classList.remove('custom');
        }
    }
}