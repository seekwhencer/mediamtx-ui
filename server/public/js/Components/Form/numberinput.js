import Component from "./Component.js";

export default class TextInput extends Component {
    constructor(parent, storeKey, store, prop, inputType, values, locked, options) {
        super(parent, storeKey, store, prop, inputType, values, locked, options);

        this.elementTag = 'input';
        this.elementProps = {
            id: '',
            className: '',
            type: 'number',
            disabled: '',
            dataset: {},
            name: `input-${this.name}`,
            'value': this.value,
            oninput: (e) => this.value = e.target.value,
        };

        this.init();
        this.render();
    }

    render(){
        super.render();
        this.targetElement.append(this.element);
    }

    setValue(value) {
        super.setValue(value);
        this.check();
    }

    check() {

    }

    get value() {
        return super.value;
    }

    // extend with type convert
    set value(value) {
        switch(this.dataType){
            case 'number':
                value = parseInt(value);
        }
        super.value = value;
    }
}