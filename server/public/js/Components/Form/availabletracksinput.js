import Component from "./Component.js";
import Button from "./button.js";
import CheckboxInput from "./checkboxinput.js";

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

        const muLawInput = document.createElement('input');
        muLawInput.type = 'checkbox';
        muLawInput.name = 'muLaw';
        muLawInput.checked = value.muLaw;
        muLawInput.oninput = () => {
            muLawInput.value === 'false' ? muLawInput.value = 'true' : muLawInput.value = 'false';
            this.concatValue();
        }

        const muLawLabel = document.createElement('label');
        muLawLabel.innerHTML = 'Mu-Law algorithm';

        if (!this.withSampleRateAndChannelCount.includes(value.codec)) {
            channelCountInput.style.display = 'none';
            sampleRateInput.style.display = 'none';
            muLawInput.style.display = 'none';
        }

        muLawLabel.style.display = muLawInput.style.display = value.codec === 'G711' ? 'block' : 'none';

        row.append(codecSelect);
        row.append(sampleRateInput);
        row.append(channelCountInput);
        row.append(muLawInput);
        row.append(muLawLabel);

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
            const codecInput = row.querySelector('[name=codec]');
            const sampleRateInput = row.querySelector('[name=sampleRate]');
            const channelCountInput = row.querySelector('[name=channelCount]');
            const muLawInput = row.querySelector('[name=muLaw]');
            const labelMuLaw = row.querySelector('label');


            const codec = codecInput.value;
            const sampleRate = Number(sampleRateInput.value);
            const channelCount = Number(channelCountInput.value);
            const muLaw = muLawInput.checked;

            if (codec !== '') {
                let value = {codec: codec, sampleRate: 0, channelCount: 0, muLaw: false};
                if (this.withSampleRateAndChannelCount.includes(codec)) {
                    value = {...value, sampleRate: sampleRate, channelCount: channelCount};
                }
                if (codec === 'G711') {
                    value = {...value, muLaw: muLaw};
                }
                values.push(value);
            }

            if (this.withSampleRateAndChannelCount.includes(codec)) {
                sampleRateInput.style.display = 'block';
                channelCountInput.style.display = 'block';
            } else {
                sampleRateInput.style.display = 'none';
                channelCountInput.style.display = 'none';
            }

            if (codec === 'G711') {
                labelMuLaw.style.display = muLawInput.style.display = 'block';
            } else {
                labelMuLaw.style.display = muLawInput.style.display = 'none';
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

        // check if fields filled
        let check = true;
        values.forEach(v => {
            if (check === false)
                return;

            if (this.withSampleRateAndChannelCount.includes(v.codec) && (v.sampleRate === 0 || v.channelCount === 0)) {
                check = false;
            }
        });

        if (check === true)
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
