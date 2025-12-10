import Component from "./component.js";
import {Button, TextInput} from "./index.js";

export default class SelectTextInput extends Component {
    constructor(settings, prop, options = {}, tab) {
        super(settings, prop, options, tab);
        this.label = this.constructor.name.toUpperCase();


        this.elementTag = 'select';
        this.defaults = {
            id: '',
            className: '',
            disabled: '',
            dataset: {},
            name: `input-${this.name}`,
            value: this.settings[this.prop],
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

        this.target.append(this.element);
        this.parent.element.classList.add('select-text');

        // the text input
        this.sourceInput = new TextInput(this.settings, this.prop, {
            onblur: e => this.checkValue(e.target.value),
            onkeyup: e => e.key === 'Enter' ? this.checkValue(e.target.value) : null
        }, this.parent);


        // the clear button
        this.clearButton = new Button(this.settings, this.prop, {
            innerHTML: '🞬',
            className: 'button clear',
            onclick: () => this.checkValue('')
        }, this.parent);

        this.target.append(this.clearButton.element);

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
        if (value !== 'redirect')
            this.settings['sourceRedirect'] = '';

        if (value !== 'publisher')
            this.settings['sourceOnDemand'] = 'false';

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