import Component from "./component.js";
import {Button, TextInput} from "./index.js";

export default class SelectTextInput extends Component {
    constructor(settings, prop, options = {}, tab) {
        super(settings, prop, options, tab);

        this.elementTag = 'select';
        this.defaults = {
            id: '',
            className: '',
            disabled: '',
            dataset: {},
            name: `input-${this.name}`,
            value: this.settings[this.prop],
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

        this.target.append(this.element);
        this.element.style.width = '20%';
        this.element.style.float = 'left';

        // the text input
        this.sourceInput = new TextInput(this.settings, this.prop, {}, this.parent);


        this.setValue(this.value);

        // the clear button
        this.clearButton = new Button(this.settings, this.prop, {
            innerHTML: '🞬',
            className: 'button clear',
            onclick: () => this.value = ''
        }, this.parent);

        this.target.append(this.clearButton.element);
        this.check();
    }


    setValue(value) {
        super.setValue(value);
        this.sourceInput.element.value = this.value;
        this.check();
    }

    check() {
        if (!this.values.includes(this.value) || this.value === '') {
            this.element.style.width = '20%';
            this.element.style.float = 'left';
            this.element.style.marginRight = '5px';
            this.sourceInput.element.style.display = 'block';
            this.sourceInput.element.style.width = 'calc(80% - 57px)';
        } else {
            this.element.style.width = 'calc(100% - 32px)';
            this.element.style.float = 'none';
            this.sourceInput.element.style.display = 'none';
        }
    }
}