export default class Component {
    constructor(parent, storeKey, store, prop, inputType, values, locked, options) {
        this.parent = parent;
        this.storeKey = storeKey;
        this.store = store;

        this.prop = prop;
        this.name = `${prop}`.toLowerCase();

        this.inputType = inputType; // the name of the form input class from Components/Form/index.js
        this.values = values;       // available enums
        this.locked = locked;       // not editable props
        this.options = options;     // the elementProps override

        this.debounceTime = 50;     //ms

        this.targetElement = this.parent.element || false;
        this.elementTag = 'div';
        this.elementProps = {
            className: 'item'
        };
    }

    init() {
        Object.assign(this.elementProps, this.options);
    }

    render() {
        // create the element
        this.element = document.createElement(this.elementTag);
        // use element props
        Object.keys(this.elementProps).forEach(prop => prop !== 'dataset' ? this.element[prop] = this.elementProps[prop] : null);
        // all props except dataset
        Object.keys(this.elementProps).forEach(prop => prop !== 'dataset' ? this.element[prop] = this.elementProps[prop] : null);
        // only dataset
        this.elementProps.dataset ? Object.keys(this.elementProps.dataset).forEach(dataKey => this.element.dataset[dataKey] = this.elementProps.dataset[dataKey]) : null;
    }

    /*
    on(event, callback) {
        return this.events.on(event, callback);
    }

    emit(event, ...args) {
        return this.events.emit(event, ...args);
    }
     */

    // triggered from outside
    setValue(value) {
        this.element.value = value;
    }

    get value() {
        return this.store[this.prop];
    }

    set value(value) {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.store[this.prop] = value, this.debounceTime);
    }

    get dataType() {
        return Array.isArray(this.value) ? 'array' : typeof this.value;
    }

    set dataType(val) {
        // do nothing
    }

    get dataTypeValues() {
        return Array.isArray(this.