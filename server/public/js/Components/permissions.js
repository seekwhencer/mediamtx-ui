import Component from "./component.js";
import Button from "./button.js";

export default class PermissionsInput extends Component {
    constructor(settings, prop, options = {}, parent) {
        super(settings, prop, options, parent);

        this.elementTag = 'input';
        this.defaults = {
            type: 'hidden',
            value: JSON.stringify(this.value)
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
        this.inputs.className = 'multi-row permissions';

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
    }

    renderRow(value) {
        const row = document.createElement('div');
        row.className = 'row';

        const select = document.createElement('select');
        select.name = `input-${this.name}-action`;
        select.change = e => this.concatValue();

        ['', 'publish', 'read', 'playback', 'api', 'metrics', 'pprof'].forEach(option => {
            const o = document.createElement("option");
            o.innerHTML = o.value = option;
            select.append(o);
        });
        select.oninput = (e) => this.concatValue();
        select.value = value.action;
        row.append(select);

        const input = document.createElement('input');
        input.type = 'text';
        input.value = value.path || '';
        input.name = `input-${this.name}-path`;
        input.oninput = e => this.concatValue();
        input.placeholder = 'path ...';
        row.append(input);

        // the clear button
        const clearButton = new Button(this.settings, this.prop, {
            innerHTML: '🞬',
            className: 'button clear',
            onclick: (e) => this.clearRow(row)
        }, this.parent);
        row.append(clearButton.element);

        return row;
    };

    concatValue() {
        const values = [];
        const rows = [...this.inputs.querySelectorAll('.row')];
        rows.forEach(row => {
            const action = row.querySelector('select').value;
            const path = row.querySelector('input[type=text]').value;
            action !== '' ? values.push({
                action: action,
                path: path,
            }) : null;
        });

        // drop all empty rows
        rows.forEach(row => {
            const select = row.querySelector('select');
            if (select.value === '')
                row.remove();
        });
        // add new empty row
        const add = this.renderRow({action: '', path: ''});
        this.inputs.append(add);

        this.element.value = JSON.stringify(values);
        this.value = values; // debounced
    }

    setValue(value) {
        super.setValue(value);
        this.check();
    }

    check() {
        this.parent.element.querySelector('.multi-row').remove();
        this.renderTextInputs();
        this.parent.element.append(this.inputs);
    }

    clearRow(row) {
        row.remove();
        const index = this.rows.indexOf(row);
        delete this.rows[index];
        this.concatValue();
    }
}

const splitCamelCase = (str) => {
    return str
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}
