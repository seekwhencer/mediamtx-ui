import Component from "./component.js";

export default class RadioInput extends Component {
    constructor(settings, prop, options = {}) {
        super(settings, prop, options);

        this.elementTag = 'input';
        this.defaults = {
            'id': '',
            'className': '',
            'type': 'radio',
            'disabled': '',
            'dataset': {}
        };

        this.init();
        this.render();
    }
}