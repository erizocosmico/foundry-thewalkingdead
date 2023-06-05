export class TWDBaseDie extends Die {
    constructor(termData) {
        termData.faces = 6;
        super(termData);
    }

    /** @override */
    static DENOMINATION = 'w';

    /** @override */
    get total() {
        return this.results.length;
    }

    /** @override */
    getResultLabel(result) {
        return {
            1: '<img src="systems/thewalkingdead/assets/dice/base-0.png" />',
            2: '<img src="systems/thewalkingdead/assets/dice/base-0.png" />',
            3: '<img src="systems/thewalkingdead/assets/dice/base-0.png" />',
            4: '<img src="systems/thewalkingdead/assets/dice/base-0.png" />',
            5: '<img src="systems/thewalkingdead/assets/dice/base-0.png" />',
            6: '<img src="systems/thewalkingdead/assets/dice/base-6.png" />',
        }[result.result];
    }
}

export class TWDStressDie extends Die {
    constructor(termData) {
        termData.faces = 6;
        super(termData);
    }

    /** @override */
    static DENOMINATION = 's';

    /** @override */
    get total() {
        return this.results.length;
    }

    /** @override */
    getResultLabel(result) {
        return {
            1: '<img src="systems/thewalkingdead/assets/dice/stress-1.png" />',
            2: '<img src="systems/thewalkingdead/assets/dice/stress-0.png" />',
            3: '<img src="systems/thewalkingdead/assets/dice/stress-0.png" />',
            4: '<img src="systems/thewalkingdead/assets/dice/stress-0.png" />',
            5: '<img src="systems/thewalkingdead/assets/dice/stress-0.png" />',
            6: '<img src="systems/thewalkingdead/assets/dice/stress-6.png" />',
        }[result.result];
    }
}

export function registerDice3D(dice3d) {
    dice3d.addColorset(
        {
            name: 'TWD',
            description: 'TWD',
            category: 'Colors',
            foreground: ['#ffffff'],
            background: ['#000000'],
            outline: 'black',
            texture: 'none',
        },
        'preferred',
    );

    dice3d.addColorset(
        {
            name: 'TWDStress',
            description: 'TWDStres',
            category: 'Colors',
            foreground: ['#000000'],
            background: ['#AC2929'],
            outline: '#AC2929',
            texture: 'none',
        },
        'preferred',
    );

    dice3d.addSystem({ id: 'thewalkingdead', name: 'The Walking Dead' }, 'preferred');
    dice3d.addDicePreset({
        type: 'dw',
        labels: [
            'systems/thewalkingdead/assets/dice/base-0.png',
            'systems/thewalkingdead/assets/dice/base-0.png',
            'systems/thewalkingdead/assets/dice/base-0.png',
            'systems/thewalkingdead/assets/dice/base-0.png',
            'systems/thewalkingdead/assets/dice/base-0.png',
            'systems/thewalkingdead/assets/dice/base-6.png',
        ],
        colorset: 'TWD',
        system: 'thewalkingdead',
    });
    dice3d.addDicePreset({
        type: 'ds',
        labels: [
            'systems/thewalkingdead/assets/dice/stress-1.png',
            'systems/thewalkingdead/assets/dice/stress-0.png',
            'systems/thewalkingdead/assets/dice/stress-0.png',
            'systems/thewalkingdead/assets/dice/stress-0.png',
            'systems/thewalkingdead/assets/dice/stress-0.png',
            'systems/thewalkingdead/assets/dice/stress-6.png',
        ],
        colorset: 'TWDStress',
        system: 'thewalkingdead',
    });
}
