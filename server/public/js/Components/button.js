import Component from "./component.js";
import DataProxy from "../data_proxy.js";

export default class Button extends Component {
    constructor(settings, prop, options = {}) {
        super(settings, prop, options);

        this.elementTag = 'button';
        this.defaults = {
            'id': '',
            'className': '',
            'type': 'button',
            'disabled': '',
            'dataset': {},
            'innerHTML': 'Click me'
        };

        this.init();
        this.render();

        console.log('>>> PROPS', this.prop, this.defaults, this.options);
    }
}