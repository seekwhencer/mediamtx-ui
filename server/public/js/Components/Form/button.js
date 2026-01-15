import Component from "./Component.js";

export default class Button extends Component {
    constructor(parent, storeKey, store, prop, inputType, values, locked, options) {
        super(parent, storeKey, store, prop, inputType, values, locked, options);

        this.elementTag = 'button';
        this.elementProps = {
            'id': '',
            'className': '',
            'type': 'button',
            'disabled': '',
            'dataset': {},
            'innerHTML': 'Click me'
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