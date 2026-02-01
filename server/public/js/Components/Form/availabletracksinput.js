import Component from "./Component.js";
import Button from "./button.js";

export default class AvailableTracksInput extends Component {
    constructor(options) {
        super(options);

        this.elementTag = 'input';
        this.elementProps = {
            type: 'hidden',
            name: `input-${this.name}`,
            value: JSON.stringify(this.value)
        };

        this.withSampleRateAndChannelCount = ['MPEG4Audio', 'G711', 'LPCM'];

        this.init();
        this.render();
    }

    render() {
        super.render();
        this.renderTextInputs();


        this.targetElement.append(this.element);
        this.targetElement.append(this.inputs);
        this.targetElement.classList.add('available-tracks');
    }

    renderTextInputs() {
        this.inputs = document.createElement('div');
        this.inputs.className = 'rows';

        this.rows = [];
        this.value.forEach(value => {
            if (value === '')
                return;

            const row = this.renderRow(value);
            this.inputs.append(row);
            this.rows.push(row);
        });

        const row = this.renderRow('');
        this.inputs.append(row);
        this.rows.push(row);
    }

    renderRow(value) {
        const row = document.createElement('div');
        row.className = 'row';

        const codecSelect = document.createElement('select');
        codecSelect.name = `codec`;

        ['', ...this.values.codecs].forEach(option => {
            const o = document.createElement("option");
            o.innerHTML = o.value = option;
            codecSelect.append(o);
        });

        codecSelect.change = e => this.concatValue();
        codecSelect.oninput = e => {
            this.concatValue();
            //input.focus();
        }
        codecSelect.value = value.codec;

        const sampleRateInput = document.createElement('input');
        sampleRateInput.type = 'text';
        sampleRateInput.value = value.sampleRate || '';
        sampleRateInput.name = `sampleRate`;
        sampleRateInput.onblur = e => this.concatValue();
        sampleRateInput.onkeyup = e => e.key === 'Enter' ? this.concatValue() : null;
        sampleRateInput.placeholder = 'sample rate';

        const channelCountInput = document.createElement('input');
        channelCountInput.type = 'text';
        channelCountInput.value = value.channelCount || '';
        channelCountInput.name = `channelCount`;
        channelCountInput.onblur = e => this.concatValue();
        channelCountInput.onkeyup = e => e.key === 'Enter' ? this.concatValue() : null;
        channelCountInput.placeholder = 'channel count';

        if (!this.withSampleRateAndChannelCount.includes(value.codec)) {
            channelCountInput.style.display = 'none';
            sampleRateInput.style.display = 'none';
        }

        row.append(codecSelect);
        row.append(sampleRateInput);
        row.append(channelCountInput);

        // the clear button
        const clearButton = new Button({
            parent: this.parent,
            storeKey: this.storeKey,
            store: this.store,
            prop: this.prop,
            inputType: this.inputType,
            values: this.values,
            locked: this.locked,
            elementOptions: {
                innerHTML: '🞬',
                className: 'button clear',
                onclick: (e) => this.clearRow(row)
            }
        });
        row.append(clearButton.element);

        return row;
    };

    concatValue() {
        const values = [];
        const rows = [...this.inputs.querySelectorAll('.row')];
        rows.forEach(row => {
            const codec = row.querySelector('[name=codec]').value;
            const sampleRate = Number(row.querySelector('[name=sampleRate]').value);
            const channelCount = Number(row.querySelector('[name=channelCount]').value);

            if (codec !== '') {
                let value = {codec: codec, sampleRate: 0, channelCount: 0, muLaw: false};
                if (this.withSampleRateAndChannelCount.includes(codec)) {
                    value = {...value, sampleRate: sampleRate, channelCount: channelCount};
                }
                values.push(value);
            }

            if (this.withSampleRateAndChannelCount.includes(codec)) {
                row.querySelector('[name=sampleRate]').style.display = 'block';
                row.querySelector('[name=channelCount]').style.display = 'block';
            } else {
                row.querySelector('[name=sampleRate]').style.display = 'none';
                row.querySelector('[name=channelCount]').style.display = 'none';
            }
        });

        // drop all empty rows
        rows.forEach(row => {
            const codecInput = row.querySelector('[name=codec]');
            if (codecInput.value === '')
                row.remove();
        });
        // add new empty row
        const add = this.renderRow({codec: ''});
        this.inputs.append(add);

        this.element.value = JSON.stringify(values);
        this.value = values; // debounced
    }

    setValue(value) {
        super.setValue(value);
        this.check();
    }

    check() {
        this.parent.element.querySelector('.rows').remove();
        this.renderTextInputs();
        this.parent.element.append(this.inputs);
    }

    clearRow(row) {
        row.remove();
        const index = this.rows.indexOf(row);
        delete this.rows[index];
        this.concatValue();
    }
}

const splitCamelCase = (str) => {
    return str
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}
