import Component from "./component.js";

export default class CheckboxInput extends Component {
    constructor(settings, prop, options = {}, tab) {
        super(settings, prop, options, tab);

        this.elementTag = 'input';
        this.defaults = {
            'id': '',
            'className': '',
            'type': 'checkbox',
            'disabled': '',
            'value': this.settings[this.prop],
            oninput: (e) => this.value = e.target.value
        };

        this.init();
        this.render();
    }

    render() {
        super.render();
        this.check();

        const oninput = this.element.oninput;
        this.element.oninput = (e) => {
            this.element.value === 'false' ? this.element.value = 'true' : this.element.value = 'false';
            oninput(e);
        }
    }

    setValue(value) {
        super.setValue(value);
        this.check();
    }

    check() {
        this.element.value === 'true' ? this.element.checked = true : this.element.checked = false
    }
}