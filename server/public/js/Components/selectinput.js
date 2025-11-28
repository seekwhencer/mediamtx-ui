import Component from "./component.js";
import Button from "./button.js";

export default class SelectInput extends Component {
    constructor(settings, prop, options = {}) {
        super(settings, prop, options);

        this.elementTag = 'select';
        this.defaults = {
            'id': '',
            'className': '',
            'disabled': '',
            'dataset': {},
            'value' : this.settings[this.prop],
            oninput: (e) => this.settings[prop] = e.target.value,
        };

        this.init();
        this.render();
    }

    render() {
        super.render();

        // add options
        Array.isArray(this.values) ? this.values.forEach(option => {
            const o = document.createElement("option");
            o.innerHTML = o.value = option;
            this.element.append(o);
        }) : null;

        // extend the on input event, but executes the given default
        /*const oninput = this.element.oninput;
        this.element.oninput = (e) => oninput(e);
        */
        this.element.value = this.props.value;
    }
}