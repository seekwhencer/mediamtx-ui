import EventEmitter from '../event_emitter.js';
import DataProxy from "../data_proxy.js";

export default class Component extends EventEmitter {
    constructor(settings, prop, options = {}) {
        super();

        this.options = options;
        this.settings = settings;
        this.prop = prop

        //console.log('+++', this.prop, this.settings);
        this.dataType = getType(this.settings[this.prop]);
        this.values = this.settings._.parent.options[this.prop] || false; //@TODO;
        this.name = `${prop.toLowerCase()}`;
        this.element = false;

        // on prop change update element properties
        this.on('create', (prop, value) => this.element ? this.element[prop] = `${value}` : null);
        this.on('update', (prop, value) => this.element ? this.element[prop] = `${value}` : null);
        this.on('delete', (prop) => this.element ? this.element[prop].removeAttribute(prop) : null);
    }

    init() {
        Object.assign(this.defaults, this.options);
        this.props = new DataProxy(this.defaults, this, true);
        Object.keys(this.options).forEach(prop => this.props[prop] = this.options[prop]);
        this.props.keys().forEach(key => this.props[key] === '' ? delete this.props[key] : null);

        //console.log('>>> PROPS', this.prop, this.props.target);
    }

    render(redraw = false) {
        !this.element || redraw === true ? this.element = document.createElement(this.elementTag) : null;
        this.props.keys().forEach(prop => prop !== 'dataset' ? this.element[prop] = this.props[prop] : null);
        this.props.dataset ? Object.keys(this.props.dataset).forEach(dataKey => this.element.dataset[dataKey] = this.props.dataset[dataKey]) : null;
        this.element.props = this.props;
    }
}

const getType = (value) => {
    return Array.isArray(value) ? 'array' : typeof value;
}