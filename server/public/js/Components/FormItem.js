import Component from "./Form/Component.js";
import * as Inputs from './Form/index.js';

export default class FormItem extends Component {
    constructor(options) {
        super(options);

        this.help = this.parent.page.help;

        this.elementTag = 'div';
        this.elementProps = {
            className: 'form-item'
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
            const helpButton = this.help.renderButton(this.prop);
            label.append(helpButton);
        }

        this.element.append(label);

        const params = {
            parent: this,
            storeKey: this.storeKey,
            store: this.store,
            prop: this.prop,
            inputType: this.inputType,
            values: this.values,
            locked: this.locked,
            elementOptions : {}
        }

        const inputComponent = this.getInputComponent();
        this.item = new Inputs[inputComponent](params);
    }

    getInputComponent() {
        // the input type equals their input class name
        if (this.inputType) {
            return this.inputType;
        } else {
            if (this.dataType === 'string' || this.dataType === 'number') {

                // if possible values (.options) specified in the settings data proxy object (/Settings/*.js)
                if (this.values) {

                    // if the data type of the possible value(s) is an array, then it is a choosable list
                    if (this.dataTypeValues === 'array') {

                        // select input
                        return 'SelectInput';
                    }

                    // if the data type of the possible value(s) is an object, then it contains some input parameters
                    if (this.dataTypeValues === 'object') {
                        if (Object.keys(this.values).includes('min')) { // min, max fields
                            return 'NumberInput';
                        }
                    }
                } else {
                    // when no default values given
                    // text input
                    return 'TextInput';
                }
            }

            // single check switch
            if (this.dataType === 'boolean') {
                return 'CheckboxInput';
            }

            // multi check switches (multiselect with checkboxes)
            // if the data type is an array AND preset values exists
            if (this.dataType === 'array' && this.values) {
                return 'MultiCheckboxInput';
            }

            // if the data type is an array AND no values given
            if (this.dataType === 'array' && !this.values) {
                if (this.prop === 'authHTTPExclude') {
                    // the permissions
                    return 'PermissionsInput';

                } else {
                    // multi row text input
                    return 'MultiTextInput';
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

}

const splitCamelCase = (str) => {
    return str
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}