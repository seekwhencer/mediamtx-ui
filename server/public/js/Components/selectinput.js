import Component from "./component.js";

export default class SelectInput extends Component {
    constructor(settings, prop, options = {}, tab) {
        super(settings, prop, options, tab);

        this.elementTag = 'select';
        this.defaults = {
            'id': '',
            'className': '',
            'disabled': '',
            'dataset': {},
            'value' : this.settings[this.prop],
            oninput: (e) => this.value = e.target.value,
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
    }

    setValue(value){
        super.setValue(value);
        this.check();
    }

    check() {

    }
}