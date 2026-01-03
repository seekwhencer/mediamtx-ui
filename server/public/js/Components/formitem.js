import Component from "./Form/component.js";
import * as Inputs from './Form/index.js';

export default class FormItem extends Component {
    constructor(settings, prop, options = {}, tab) {
        super(settings, prop, options, tab);

        this.elementTag = 'div';
        this.defaults = {
            id: '',
            className: 'item'
        };

        this.help = this.parent.page.help;

        this.init();
        this.render();
    }

    render() {
        super.render();

        const label = document.createElement("label");
        label.setAttribute('for', `input-${this.name}`);
        label.innerHTML = `${splitCamelCase(this.prop).toUpperCase()}`;

        if (this.help.data[this.prop]) {
            const helpButton = this.renderHelpButton(this.prop);
            label.append(helpButton);
        }

        this.element.append(label);

        // the input type equals their input class name
        if (this.inputType) {
            this.item = new Inputs[this.inputType](this.settings, this.prop, {}, this);

            // type agnostic
        } else {
            if (this.dataType === 'string' || this.dataType === 'number') {

                // if possible values (.options) specified in the settings data proxy object (/Settings/*.js)
                if (this.values) {

                    // if the data type of the possible value(s) is an array, then it is a choosable list
                    if (this.dataTypeValues === 'array') {

                        // select input
                        this.item = new Inputs.SelectInput(this.settings, this.prop, {}, this);
                    }

                    // if the data type of the possible value(s) is an object, then it contains some input parameters
                    if (this.dataTypeValues === 'object') {
                        if (Object.keys(this.values).includes('min')) { // min, max fields
                            this.item = new Inputs.NumberInput(this.settings, this.prop, {
                                min: this.values.min,
                                max: this.values.max,
                                step: this.values.step
                            }, this);
                            this.element.append(this.item.element);
                        }
                    }
                } else {
                    // when no default values given
                    // text input
                    this.item = new Inputs.TextInput(this.settings, this.prop, {}, this);
                }
            }

            // single check switch
            if (this.dataType === 'boolean') {
                this.item = new Inputs.CheckboxInput(this.settings, this.prop, {}, this);
            }

            // multi check switches (multiselect with checkboxes)
            // if the data type is an array AND preset values exists
            if (this.dataType === 'array' && this.values) {
                this.item = new Inputs.MultiCheckboxInput(this.settings, this.prop, {}, this);
            }

            // if the data type is an array AND no values given
            if (this.dataType === 'array' && !this.values) {
                if (this.prop === 'authHTTPExclude') {
                    // the permissions
                    this.item = new Inputs.PermissionsInput(this.settings, this.prop, {}, this);

                } else {
                    // multi row text input
                    this.item = new Inputs.MultiTextInput(this.settings, this.prop, {}, this);
                }
            }
        }
    }

    destroy() {
        // console.log('>>> DESTROYING', this.prop);
    }

    setValue(value) {
        this.item.setValue(value);
    }

    renderHelpButton(prop) {
        return this.help.renderButton(prop);
    }

}

const splitCamelCase = (str) => {
    return str
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}