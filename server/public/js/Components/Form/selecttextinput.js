import Component from "./Component.js";
import {Button, TextInput} from "./index.js";

export default class SelectTextInput extends Component {
    constructor(options) {
        super(options);
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
        this.sourceInput = new TextInput({
            parent: this.parent,
            storeKey: this.storeKey,
            store: this.store,
            prop: this.prop,
            inputType: this.inputType,
            values: this.values,
            locked: this.locked,
            elementOptions: {
                onblur: e => this.checkValue(e.target.value),
                onkeyup: e => e.key === 'Enter' ? this.checkValue(e.target.value) : null
            }
        });

        // the clear button
        const clearButton = new Button({
            parent: this.parent,
            storeKey: this.storeKey,
            store: this.store,
            prop: this.prop,
            inputType: this.inputType,
            values: this.values,
            locked: this.locked,
            elementOptions: {
                innerHTML: '🞬',
                className: 'button clear',
                onclick: (e) => this.value = ''
            }
        });

        this.targetElement.append(clearButton.element);

        this.check();

    }

    checkValue(value) {
        const inputText = this.sourceInput.element.value || '';
        const selectValue = this.values.includes(value) ? value : '';

        if (selectValue !== '') {
            this.sourceInput.element.value = '';
            this.value = selectValue;
        } else {
            this.value = inputText;
        }
    }

    setValue(value) {
        this.check();
    }

    check() {
        const selectValue = this.values.includes(this.value) ? this.value : '';
        const isTextInput = !this.values.includes(this.value);

        this.element.value = selectValue;
        this.sourceInput.element.value = isTextInput ? this.value : '';

        const parentElement = this.parent.element;
        if (this.element.value === '') {
            parentElement.classList.add('custom');
        } else {
            parentElement.classList.remove('custom');
        }
    }
}