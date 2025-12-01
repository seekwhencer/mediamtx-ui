import EventEmitter from '../event_emitter.js';
import DataProxy from "../data_proxy.js";

export default class Component {
    constructor(settings, prop, options = {}, parent) {
        this.options = options;
        this.settings = settings;
        this.parent = parent;
        this.events = this.parent.events;
        this.prop = prop;

        this.dataType = getType(this.value);
        this.values = this.settings._.parent.options[this.prop] || false; //@TODO;
        this.name = `${prop.toLowerCase()}`;
        this.element = false;
    }

    init() {
        Object.assign(this.defaults, this.options);
        this.props = new DataProxy(this.defaults, this, true);
        Object.keys(this.options).forEach(prop => this.props[prop] = this.options[prop]);
        this.props.keys().forEach(key => this.props[key] === '' ? delete this.props[key] : null);
    }

    render(redraw = false) {
        !this.element || redraw === true ? this.element = document.createElement(this.elementTag) : null;
        this.props.keys().forEach(prop => prop !== 'dataset' ? this.element[prop] = this.props[prop] : null);
        this.props.dataset ? Object.keys(this.props.dataset).forEach(dataKey => this.element.dataset[dataKey] = this.props.dataset[dataKey]) : null;
        this.element.props = this.props;
    }

    on(event, callback) {
        return this.events.on(event, callback);
    }

    emit(event, ...args) {
        return this.events.emit(event, ...args);
    }

    setValue(value) {
        this.element.value = value;
    }

    get value() {
        return this.settings[this.prop];
    }

    set value(value) {
        this.settings[this.prop] = value;
    }
}

const getType = (value) => {
    return Array.isArray(value) ? 'array' : typeof value;
}