import Component from "./component.js";
import Button from "./button.js";

export default class CheckboxInput extends Component {
    constructor(settings, prop, options = {}) {
        super(settings, prop, options);

        this.elementTag = 'input';
        this.defaults = {
            'id': '',
            'className': '',
            'type': 'checkbox',
            'disabled': '',
            'value' : this.settings[this.prop],
            oninput: (e) => this.settings[prop] = e.target.value,
        };

        this.init();
        this.render();
    }

    render() {
        super.render();
        const oninput = this.element.oninput;
        this.element.oninput = (e) => {
            this.element.value === 'false' ? this.element.value = 'true' : this.element.value = 'false';
            oninput(e);
        }
    }
}