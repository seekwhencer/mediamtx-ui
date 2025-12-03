import Component from "./component.js";
import Button from './button.js';
import TextInput from "./textinput.js";
import CheckboxInput from './checkboxinput.js';
import SelectInput from './selectinput.js';
import MultiCheckboxInput from './multicheckboxinput.js';
import MultiTextInput from './multitextinput.js';
import PermissionsInput from "./permissions.js";
import NumberInput from './numberinput.js';

export default class FormItem extends Component {
    constructor(settings, prop, options = {}, tab) {
        super(settings, prop, options, tab);

        this.elementTag = 'div';
        this.defaults = {
            'id': '',
            'className': 'item'
        };

        this.init();
        this.render();
    }

    render() {
        super.render();

        const label = document.createElement("label");
        label.setAttribute('for', `input-${this.name}`);
        label.innerHTML = splitCamelCase(this.prop).toUpperCase();
        this.element.append(label);

        // input field
        if (this.dataType === 'string' || this.dataType === 'number') {
            if (this.values) {

                if (this.dataTypeValues === 'array') {
                    // select input
                    this.item = new SelectInput(this.settings, this.prop, {
                        name: `input-${this.name}`
                    }, this);
                    this.element.append(this.item.element);

                    // the clear button
                    const clearButton = new Button(this.settings, this.prop, {
                        innerHTML: '🞬',
                        className: 'button clear',
                        onclick: () => this.value = ''
                    }, this);
                    this.element.append(clearButton.element);
                }

                if (this.dataTypeValues === 'object') {
                    if (Object.keys(this.values).includes('min')) { // min, max fields
                        this.item = new NumberInput(this.settings, this.prop, {
                            name: `input-${this.name}`,
                            min: this.values.min,
                            max: this.values.max,
                            step: this.values.step
                        }, this);
                        this.element.append(this.item.element);
                    }
                }

            } else {
                // text input
                this.item = new TextInput(this.settings, this.prop, {
                    name: `input-${this.name}`
                }, this);
                this.element.append(this.item.element);
            }
        }

        // single check switch
        if (this.dataType === 'boolean') {
            this.item = new CheckboxInput(this.settings, this.prop, {
                name: `input-${this.name}`
            }, this);

            this.element.append(this.item.element);
            this.element.classList.add('switch');
        }

        // multi check switches
        if (this.dataType === 'array' && this.values) {
            this.item = new MultiCheckboxInput(this.settings, this.prop, {
                name: `input-${this.name}`
            }, this);

            this.element.append(this.item.element);
            this.element.append(this.item.checkboxes);
            this.element.classList.add('switches');
        }

        if (this.dataType === 'array' && !this.values) {
            // the permissions
            if (this.prop === 'authHTTPExclude') {
                this.item = new PermissionsInput(this.settings, this.prop, {
                    name: `input-${this.name}`
                }, this);

                this.element.append(this.item.element);
                this.element.append(this.item.inputs);
                this.element.classList.add('rows');
            } else {
                this.item = new MultiTextInput(this.settings, this.prop, {
                    name: `input-${this.name}`
                }, this);

                this.element.append(this.item.element);
                this.element.append(this.item.inputs);
                this.element.classList.add('rows');
            }
        }
    }

    destroy() {
        // console.log('>>> DESTROYING', this.prop);
    }

    setValue(value) {
        this.item.setValue(value);
    }

}

const splitCamelCase = (str) => {
    return str
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}