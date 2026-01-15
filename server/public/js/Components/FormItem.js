import Component from "./Form/Component.js";
import * as Inputs from './Form/index.js';

export default class FormItem extends Component {
    constructor(parent, storeKey, store, prop, inputType, values, locked, options) {
        super(parent, storeKey, store, prop, inputType, values, locked, options);
        this.help = this.parent.page.help;

        this.elementTag = 'div';
        this.elementProps = {
            className: 'item'
        };

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

        const params = [
            this, this.storeKey, this.store, this.prop,
            this.inputType, this.values, this.locked];

        // the input type equals their input class name
        if (this.inputType) {
            this.item = new Inputs[this.inputType](...params, {});

            // type agnostic
        } else {
            if (this.dataType === 'string' || this.dataType === 'number') {

                // if possible values (.options) specified in the settings data proxy object (/Settings/*.js)
                if (this.values) {

                    // if the data type of the possible value(s) is an array, then it is a choosable list
                    if (this.dataTypeValues === 'array') {

                        // select input
                        this.item = new Inputs.SelectInput(...params, {});
                    }

                    // if the data type of the possible value(s) is an object, then it contains some input parameters
                    if (this.dataTypeValues === 'object') {
                        if (Object.keys(this.values).includes('min')) { // min, max fields
                            this.item = new Inputs.NumberInput(...params, {
                                min: this.values.min,
                                max: this.values.max,
                                step: this.values.step
                            });
                            this.element.append(this.item.element);
                        }
                    }
                } else {
                    // when no default values given
                    // text input
                    this.item = new Inputs.TextInput(...params, {});
                }
            }

            // single check switch
            if (this.dataType === 'boolean') {
                this.item = new Inputs.CheckboxInput(...params, {});
            }

            // multi check switches (multiselect with checkboxes)
            // if the data type is an array AND preset values exists
            if (this.dataType === 'array' && this.values) {
                this.item = new Inputs.MultiCheckboxInput(...params, {});
            }

            // if the data type is an array AND no values given
            if (this.dataType === 'array' && !this.values) {
                if (this.prop === 'authHTTPExclude') {
                    // the permissions
                    this.item = new Inputs.PermissionsInput(...params, {});

                } else {
                    // multi row text input
                    this.item = new Inputs.MultiTextInput(...params, {});
                }
            }
        }
    }

    destroy() {
        // console.log('>>> DESTROYING', this.prop);
    }

    // set the ui, not the store
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