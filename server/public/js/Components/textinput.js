import Component from "./component.js";

export default class TextInput extends Component {
    constructor(settings, prop, options = {}, tab) {
        super(settings, prop, options, tab);

        this.elementTag = 'input';
        this.defaults = {
            id: '',
            className: '',
            type: 'text',
            disabled: '',
            dataset: {},
            value: this.settings[this.prop],
            placeholder: 'type something ...',
            //oninput: (e) => this.value = e.target.value,
            onblur: (e) => this.value = e.target.value,
            onkeyup: e => e.key === 'Enter' ? this.value = e.target.value : null
        };

        this.init();
        this.render();
    }

    setValue(value) {
        super.setValue(value);
        this.check();
    }

    render(){
        super.render();
        this.target.append(this.element);
    }

    check() {

    }
}