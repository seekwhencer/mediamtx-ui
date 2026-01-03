import Component from "../component.js";

export default class RadioInput extends Component {
    constructor(settings, prop, options = {}, tab) {
        super(settings, prop, options, tab);

        this.elementTag = 'input';
        this.defaults = {
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