export default class Slider {
    constructor(options = {}) {
        this.label = options.label ?? 'LABEL';
        this.isPow2 = options.isPow2 ?? false;
        this.min = this.isPow2 ? toExp(options.min) : options.min ?? 0;
        this.max = this.isPow2 ? toExp(options.max) : options.max ?? 12;
        this.step = options.step ?? 1;
        this.isRange = options.isRange ?? false;
        this.hasRuler = options.hasRuler ?? false;
        this.hasHandleValue = options.hasHandleValue ?? true;
        this.onChange = options.onChange ?? this._onChange;
        this.value = this.isPow2 ? toExp(options.value) : options.value ?? this.min;
        this.show();
    }

    show() {
        this.renderBase();
        this.bind();
        this.initState();
        this.updateUI();
    }

    /* ---------- Render ---------- */

    renderBase() {
        this.element = document.createElement('div');
        this.element.className = 'slider-container';

        this.element.innerHTML = `
            <div class="slider">
                <div class="track"></div>
                <div class="range"></div>
                <button class="handle start" role="slider"></button>
                ${this.isRange ? `<button class="handle end" role="slider"></button>` : ``}
            </div>
            ${this.hasRuler ? `<div class="value-label"></div>` : ``}
        `;

        this.track = this.element.querySelector('.track');
        this.rangeEl = this.element.querySelector('.range');
        this.handleStart = this.element.querySelector('.handle.start');
        this.handleEnd = this.element.querySelector('.handle.end');
        this.labelTrack = this.element.querySelector('.value-label');

        if (this.hasRuler) {
            const boxes = [];
            for (let i = 0; i <= this.max; i++) boxes.push('<i></i>');
            this.labelTrack.innerHTML = boxes.join('');
        }
    }

    initState() {
        if (this.isRange) {
            this.state = {
                start: this.isPow2 ? this.snap(toExp(this.min)) : this.snap(this.value[0]),
                end: this.isPow2 ? this.snap(toExp(this.max)) : this.snap(this.value[1])
            };
        } else {
            this.state = {
                value: this.snap(this.value)
            };
        }
    }

    updateUI() {
        if (this.isRange) {
            const ps = this.pctForValue(this.state.start);
            const pe = this.pctForValue(this.state.end);

            this.handleStart.style.left = ps + '%';
            this.handleEnd.style.left = pe + '%';

            this.rangeEl.style.left = ps + '%';
            this.rangeEl.style.width = (pe - ps) + '%';

            if (this.hasHandleValue) {
                this.handleStart.textContent = this.displayValue(this.state.start);
                this.handleEnd.textContent = this.displayValue(this.state.end);
            }
        } else {
            const p = this.pctForValue(this.state.value);

            this.handleStart.style.left = p + '%';

            this.rangeEl.style.left = '0%';
            this.rangeEl.style.width = p + '%';

            if (this.hasHandleValue)
                this.handleStart.textContent = this.displayValue(this.state.value);
        }
    }

    /* ---------- Events ---------- */

    bind() {
        let dragging = null;

        const onPointerMove = (ev) => {
            if (!dragging) return;
            const v = this.valueForClientX(ev.clientX);

            if (!this.isRange) {
                this.state.value = v;
            } else if (dragging === 'start') {
                this.state.start = Math.min(v, this.state.end);
            } else {
                this.state.end = Math.max(v, this.state.start);
            }

            this.updateUI();
            this.value = this.getValue();
        };

        const startDrag = (handle, which) => (ev) => {
            ev.preventDefault();
            handle.setPointerCapture(ev.pointerId);
            dragging = which;
            onPointerMove(ev);
        };

        const stopDrag = (handle) => (ev) => {
            handle.releasePointerCapture(ev.pointerId);
            dragging = null;
            this.value = this.getValue();
        };

        this.handleStart.addEventListener('pointerdown', startDrag(this.handleStart, 'start'));
        this.handleStart.addEventListener('pointerup', stopDrag(this.handleStart));

        if (this.isRange && this.handleEnd) {
            this.handleEnd.addEventListener('pointerdown', startDrag(this.handleEnd, 'end'));
            this.handleEnd.addEventListener('pointerup', stopDrag(this.handleEnd));
        }

        document.addEventListener('pointermove', onPointerMove);

        this.track.addEventListener('click', (ev) => {
            const v = this.valueForClientX(ev.clientX);

            if (!this.isRange) {
                this.state.value = v;
            } else {
                const ds = Math.abs(v - this.state.start);
                const de = Math.abs(v - this.state.end);
                if (ds <= de) {
                    this.state.start = Math.min(v, this.state.end);
                } else {
                    this.state.end = Math.max(v, this.state.start);
                }
            }

            this.updateUI();
            this.value = this.getValue();
        });
    }

    /* ---------- Math ---------- */

    clamp(v, a, b) {
        return Math.min(Math.max(v, a), b);
    }

    snap(v) {
        if (this.isPow2) {
            // v ist Exponent
            return this.clamp(Math.round(v), this.min, this.max);
        }
        const s = Math.round((v - this.min) / this.step);
        return this.clamp(this.min + s * this.step, this.min, this.max);
    }

    pctForValue(v) {
        return ((v - this.min) / (this.max - this.min)) * 100;
    }

    valueForClientX(x) {
        const rect = this.track.getBoundingClientRect();
        const rel = this.clamp((x - rect.left) / rect.width, 0, 1);
        const v = this.min + rel * (this.max - this.min);
        return this.snap(v);
    }

    displayValue(v) {
        if (this.isPow2) {
            if ((2 ** v) === 1) return 0;
            return (2 ** v);
        }
        return v;
    }

    /* ---------- Hooks ---------- */

    _onChange() {
        console.log('Slider value changed:', this.value);
    }

    getValue() {
        if (this.isRange) {
            return {
                start: this.displayValue(this.state.start),
                end: this.displayValue(this.state.end)
            };
        }
        return this.displayValue(this.state.value);
    }

    setValue(value) {
        console.log('SET VALUE', value);
        if (!this.isRange) {
            this.state.value = this.isPow2 ? toExp(value) : value;
        } else {
            this.state.start = value[0];
            this.state.end = value[1];
        }
        this.updateUI();
    }

    get value() {
        return this._value;
    }

    set value(value) {
        if (value === this.value)
            return;

        const before = this.value;
        this._value = value;

        if (before !== undefined)
            this.onChange(this.value);
    }
}
const toExp = v => {
    if (v <= 0 || (v & (v - 1)) !== 0) {
        return 0;
        //throw new Error("value ist keine Zweierpotenz");
    }
    return Math.log2(v);
};