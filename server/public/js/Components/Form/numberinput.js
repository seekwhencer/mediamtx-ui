import Component from "./component.js";

export default class TextInput extends Component {
    constructor(settings, prop, options = {}, tab) {
        super(settings, prop, options, tab);

        this.elementTag = 'input';
        this.defaults = {
            id: '',
            className: '',
            type: 'number',
            disabled: '',
            dataset: {},
            name: `input-${this.name}`,
            'value': this.settings[this.prop],
            oninput: (e) => this.value = e.target.value,
        };

        this.init();
        this.render();
    }

    render(){
        super.render();
        this.target.append(this.element);
    }

    setValue(value) {
        super.setValue(value);
        this.check();
    }

    check() {

    }
}