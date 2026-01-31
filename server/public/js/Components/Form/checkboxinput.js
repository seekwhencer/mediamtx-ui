import Component from "./Component.js";

export default class CheckboxInput extends Component {
    constructor(options) {
        super(options);

        this.elementTag = 'input';
        this.elementProps = {
            id: '',
            className: '',
            type: 'checkbox',
            disable: '',
            name: `input-${this.name}`,
            value: this.value,
            oninput: (e) => this.value = e.target.value === 'true'
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

        this.targetElement.append(this.element);
        this.targetElement.classList.add('switch');
    }

    setValue(value) {
        super.setValue(value);
        this.check();
    }

    check() {
        this.element.value === 'true' ? this.element.checked = true : this.element.checked = false;

    }
}