import Component from "./component.js";

export default class TextInput extends Component {
    constructor(settings, prop, options = {}, tab) {
        super(settings, prop, options, tab);

        this.elementTag = 'input';
        this.defaults = {
            'id': '',
            'className': '',
            'type': 'number',
            'disabled': '',
            'dataset': {},
            'value': this.settings[this.prop],
            oninput: (e) => this.value = e.target.value,
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