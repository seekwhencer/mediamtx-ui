import Component from "./Component.js";

export default class MultiCheckboxInput extends Component {
    constructor(options) {
        super(options);

        this.elementTag = 'input';
        this.elementProps = {
            type: 'hidden',
            value: this.value,
            name: `input-${this.name}`,
            onchange: () => console.log('>CHECKING')
        };

        this.init();
        this.render();
    }

    render() {
        super.render();
        this.renderCheckboxes();

        this.targetElement.append(this.element);
        this.targetElement.append(this.checkboxes);
        this.targetElement.classList.add('switches');
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
            checkbox.oninput = () => this.concatValue();
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
    }
}

const splitCamelCase = (str) => {
    return str
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}
