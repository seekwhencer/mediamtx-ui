import Component from "./Component.js";

export default class RadioInput extends Component {
    constructor(parent, storeKey, store, prop, inputType, values, locked, options) {
        super(parent, storeKey, store, prop, inputType, values, locked, options);

        this.elementTag = 'input';
        this.elementProps = {
            'id': '',
            'className': '',
            'type': 'radio',
            'disabled': '',
            'dataset': {}
        };

        this.init();
        this.render();
    }

    setValue(value) {
        super.setValue(value);
        this.check();
    }

    check() {

    }
}