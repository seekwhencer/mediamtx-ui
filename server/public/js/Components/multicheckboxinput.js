import Component from "./component.js";

export default class MultiCheckboxInput extends Component {
    constructor(settings, prop, options = {}, tab) {
        super(settings, prop, options, tab);

        this.debounceTime = 50;
        this.elementTag = 'input';
        this.defaults = {
            type: 'hidden',
            value: this.value,
            onchange: () => console.log('>CHECKING')
        };

        this.init();
        this.render();
    }

    render() {
        super.render();
        this.renderCheckboxes();
    }

    renderCheckboxes() {
        this.checkboxes = document.createElement('div');
        this.checkboxes.className = 'checkboxes';

        this.boxes = [];
        this.values.forEach(value => {
            const box = document.createElement('div');
            box.className = 'box';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = value;
            checkbox.name = `input-${this.name}-${value}`;
            checkbox.oninput = e => this.concatValue();
            box.append(checkbox);

            const label = document.createElement("label");
            label.setAttribute('for', `input-${this.name}-${value}`);
            label.innerHTML = splitCamelCase(value).toUpperCase();
            box.append(label);

            this.checkboxes.append(box);
            this.boxes.push(box);
        });

        this.check();
        this.element.classList.add('switch');
    }

    setValue(value){
        super.setValue(value);
        this.check();
    }

    check() {
        this.boxes.forEach(box => {
            const input = box.querySelector('input');
            this.value.includes(input.value) ? input.checked = true : input.checked = false;
        });
    }

    concatValue() {
        this.value = [...this.checkboxes.querySelectorAll('input')].filter(b => b.checked).map(b => b.value);
        this.check();
        this.settings[this.prop] = this.value;
    }
}

const splitCamelCase = (str) => {
    return str
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}
