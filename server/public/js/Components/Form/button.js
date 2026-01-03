import Component from "../component.js";

export default class Button extends Component {
    constructor(settings, prop, options = {}, tab) {
        super(settings, prop, options, tab);

        this.elementTag = 'button';
        this.defaults = {
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