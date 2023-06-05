import { TWDBaseItemSheet } from './base';

export class TWDInjuryItemSheet extends TWDBaseItemSheet {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ['thewalkingdead', 'sheet', 'item', 'injury'],
            height: 200,
            width: 550,
            resizable: false,
        });
    }
}
