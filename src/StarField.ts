import Debug from "debug";
import {random} from 'underscore';

const debug = Debug("Blaster:StarField");

import {Point} from './Point';
import {Scheduler} from './timing/Scheduler';
import {Clock} from "./timing/Clock";
import {Star} from './Star';

export class StarField {
    private readonly _world: any;
    private readonly _scheduler: Scheduler;
    private _firstTick: boolean = true;

    constructor(world: any, clock: Clock) {
        debug('StarField constructor');
        this._world = world;
        this._scheduler = new Scheduler(clock);
    }

    tick(): void {
        if (this._firstTick) {
            this.initializeStarField();
            this._firstTick = false;
            this._scheduler.scheduleOperation('addStar', random(500, 1000), () => this.addStar());
        }

        // Continually add new stars to the world.
        this._scheduler.executeDueOperations();
    }

    initializeStarField(): void {
        // Fill the screen with stars before it starts scrolling.
        let worldDimensions = this._world.getDimensions();
        for (let y = 0; y < worldDimensions.height; y++) {
            if (random(1, 100) > 95) {
                let x = random(10, worldDimensions.width - 10);
                let star = new Star(this._world, new Point(x, y));
                this._world.addActor(star);
            }
        }
    }

    addStar(): void {
        let x = random(10, this._world.getDimensions().width - 10);
        let star = new Star(this._world, new Point(x, 0));
        this._world.addActor(star);

        this._scheduler.scheduleOperation('addStar', random(500, 1000), () => this.addStar());
    };
}