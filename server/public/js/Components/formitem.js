import Component from "./component.js";
import Button from './button.js';
import TextInput from "./textinput.js";
import CheckboxInput from './checkboxinput.js';
import SelectInput from './selectinput.js';

export default class FormItem extends Component {
    constructor(settings, prop, options = {}) {
        super(settings, prop, options);

        this.elementTag = 'div';
        this.defaults = {
            'id': '',
            'className': 'item'
        };

        this.init();
        this.render();

        //console.log('???', this.options);
    }

    render() {
        super.render();

        const label = document.createElement("label");
        label.setAttribute('for', `input-${this.name}`);
        label.innerHTML = splitCamelCase(this.prop).toUpperCase();
        this.element.append(label);


        if (this.dataType === 'string' || this.dataType === 'number') {
            if (this.values) {
                const select = new SelectInput(this.settings, this.prop, {
                    name: `input-${this.name}`
                });
                this.settings.on(this.prop, (value, action) => select.element.value = value);
                this.element.append(select.element);

                // the clear button
                this.clearButton = new Button(this.settings, this.prop, {
                    innerHTML: '🞬',
                    className: 'button clear',
                    onclick: () => this.settings[this.prop] = ''
                });
                this.element.append(this.clearButton.element);
            } else {
                const input = new TextInput(this.settings, this.prop, {
                    name: `input-${this.name}`
                });
                this.settings.on(this.prop, (value, action) => input.element.value = value);
                this.element.append(input.element);
            }
        }

        if (this.dataType === 'boolean') {
            const checkbox = new CheckboxInput(this.settings, this.prop, {
                name: `input-${this.name}`
            });
            checkbox.element.value === 'true' ? checkbox.element.checked = true : checkbox.element.checked = false;
            this.settings.on(this.prop, (value, action) => checkbox.element.value = value);
            this.element.append(checkbox.element);
            this.element.classList.add('switch');
        }


    }
}

const splitCamelCase = (str) => {
    return str
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}