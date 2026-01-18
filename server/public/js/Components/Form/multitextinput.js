import Component from "./Component.js";
import Button from "./button.js";

export default class MultiTextInput extends Component {
    constructor(parent, storeKey, store, prop, inputType, values, locked, options) {
        super(parent, storeKey, store, prop, inputType, values, locked, options);

        this.elementTag = 'input';
        this.elementProps = {
            type: 'hidden',
            name: `input-${this.name}`,
            value: this.value
        };

        this.init();
        this.render();
    }

    render() {
        super.render();
        this.renderTextInputs();
    }

    renderTextInputs() {
        this.inputs = document.createElement('div');
        this.inputs.className = 'multi-row';

        this.rows = [];
        this.value.forEach(value => {
            if (value === '')
                return;

            const row = this.renderRow(value);
            this.inputs.append(row);
            this.rows.push(row);
        });

        const row = this.renderRow('');
        this.inputs.append(row);
        this.rows.push(row);

        this.targetElement.append(this.element);
        this.targetElement.append(this.inputs);
        this.targetElement.classList.add('rows');
    }

    renderRow(value) {
        const row = document.createElement('div');
        row.className = 'row';

        const input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        input.name = `input-${this.name}-${value}`;
        input.onblur = e => this.concatValue();
        input.onkeyup = e => e.key === 'Enter' ? this.concatValue() : null;
        input.placeholder = 'add new ...';
        row.append(input);

        // the clear button
        const clearButton = new Button(this.parent,
            this.storeKey, this.store, this.prop,
            this.inputType, this.values, this.locked, {
                innerHTML: '🞬',
                className: 'button clear',
                onclick: (e) => this.clearValue(input)
            });
        row.append(clearButton.element);

        return row;
    };

    clearValue(input) {
        input.value = '';
        this.concatValue();
    }

    concatValue() {
        const value = [...this.inputs.querySelectorAll('input[type=text]')].filter(i => i.value !== "").map(i => i.value);
        this.element.value = JSON.stringify(value);
        this.value = value;

        this.rows = this.inputs.querySelectorAll('.row');
        [...this.rows].forEach(row => {
            const input = row.querySelector('input[type=text]');
            if (input.value === '')
                row.remove();
        });

        const add = this.renderRow('');
        this.inputs.append(add);
    }

    setValue(value) {
        super.setValue(value);
        this.check();
    }

    check() {
        this.renderTextInputs();
        this.parent.element.querySelector('.multi-row').remove();
        this.parent.element.append(this.inputs);
    }
}

const splitCamelCase = (str) => {
    return str
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}
