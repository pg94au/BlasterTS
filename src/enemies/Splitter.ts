import Debug from "debug";
const debug = Debug("Blaster:Splitter");
import {random} from 'underscore';

import {Bounds} from '../Bounds';
const Enemy = require('./Enemy');
import {ExplosionProperties} from '../ExplosionProperties';
import {HitArbiter} from '../HitArbiter';
import {ImageDetails} from '../ImageDetails';
import {PathAction} from '../paths/PathAction';
import {PathTemplate} from '../paths/PathTemplate';
import {Point} from '../Point';
import {ScheduledAction} from '../paths/ScheduledAction';
import {Scheduler} from '../timing/Scheduler';
import {Shrapnel} from '../shots/Shrapnel';
import {SplinePath} from '../paths/SplinePath';
import {Clock} from "../timing/Clock";
import {PathEntry} from "../paths/PathEntry";
const SplitterFragment = require('./SplitterFragment');

export class Splitter extends Enemy {
    private static readonly InitialHealth = 1;

    private static _pathsCalculated: boolean = false;
    private static _introPathTemplate: PathEntry[];
    private static _floatAroundPathTemplate: PathEntry[];
    private static _flyRightPathTemplate: PathEntry[];
    private static _flyLeftPathTemplate: PathEntry[];
    private static _flyUpPathTemplate: PathEntry[];
    private static _flyDownPathTemplate: PathEntry[];
    private static _diveRightPathTemplate: PathEntry[];
    private static _diveLeftPathTemplate: PathEntry[];

    private readonly _clock: Clock;
    private readonly _scheduler: Scheduler;
    private readonly _hitArbiter: HitArbiter;
    private readonly _frameIndices = [0, 1, 2, 3, 4, 5, 4, 3, 2, 1];
    private _currentFrame: number = 0;
    private _health: number = Splitter.InitialHealth;

    constructor(audioPlayer: any, world: any, clock: Clock, startingPoint: Point) {
        super(audioPlayer, world, startingPoint);
        debug('Splitter constructor');

        this._clock = clock;
        this._scheduler = new Scheduler(clock);
        this._hitArbiter = new HitArbiter(this);

        this.calculatePaths();
        this.prepareNextPath(Splitter._introPathTemplate);
        this.advanceCurrentFrame();
    }

    getExplosionProperties(): ExplosionProperties {
        return new ExplosionProperties(
            'saucer_explosion',
            4,
            80,
            0.8,
            'saucer_explosion'
        );
    }

    getScoreTotal(): number {
        return 10;
    }

    getCollisionMask(): Bounds[] {
        return [new Bounds(-40, 40, -20, 20)];
    }

    getDamageAgainst(): number {
        return 5;
    }

    getImageDetails(): ImageDetails {
        return new ImageDetails('splitter', 6, 100, this._frameIndices[this._currentFrame]);
    }

    hitBy(actor: any, damage: number): boolean {
        this._health = Math.max(0, this._health - damage);
        return true;
    }

    tick(): void {
        debug('Splitter.tick');
        super.tick();

        this._scheduler.executeDueOperations();

        this.move();

        // Check if this Splitter has collided with any active enemies.
        let player = this._world.getPlayer();
        if (player) {
            this._hitArbiter.attemptToHit(player);
        }

        if (this._health <= 0) {
            let leftSplitterFragment = new SplitterFragment(
                this._audioPlayer,
                this._world,
                this._clock,
                SplitterFragment.Side.Left,
                this._location.left(40)
            );
            this._world.addActor(leftSplitterFragment);

            let rightSplitterFragment = new SplitterFragment(
                this._audioPlayer,
                this._world,
                this._clock,
                SplitterFragment.Side.Right,
                this._location.right(40)
            );
            this._world.addActor(rightSplitterFragment);
        }
    }

    advanceCurrentFrame(): void {
        this._currentFrame = (this._currentFrame + 1) % this._frameIndices.length;

        this._scheduler.scheduleOperation(
            'advanceCurrentFrame',
            100,
            () => { this.advanceCurrentFrame() }
        );
    }

    scheduleNextBombDrop(): void {
        // Need to bind so that 'this' in dropBomb will refer to the Splitter.
        this._scheduler.scheduleOperation(
            'dropBombAt',
            3000,
            () => { this.dropBomb() }
        );
    }

    dropBomb(): void {
        let leftShrapnel = new Shrapnel(this._audioPlayer, this._world, this._location, 267);
        this._world.addActor(leftShrapnel);

        let rightShrapnel = new Shrapnel(this._audioPlayer, this._world, this._location, 273);
        this._world.addActor(rightShrapnel);
    }

    move(): void {
        // Choose the next path to follow once we've reach the end of the current path.
        if (this._pathPosition >= this._currentPath.length) {
            let nextPath: PathEntry[];
            if (this._currentPathTemplate === Splitter._floatAroundPathTemplate) {
                if (random(0, 1) > 0.5) {
                    if (this._location.x < this._world.getDimensions().width / 2) {
                        nextPath = Splitter._flyRightPathTemplate;
                    }
                    else {
                        nextPath = Splitter._flyLeftPathTemplate;
                    }
                }
                else {
                    if (this._location.y < this._world.getDimensions().height / 2) {
                        if (random(0, 1) > 0.5) {
                            nextPath = Splitter._flyDownPathTemplate;
                        }
                        else {
                            if (this._location.x < this._world.getDimensions().width / 2) {
                                nextPath = Splitter._diveRightPathTemplate;
                            }
                            else {
                                nextPath = Splitter._diveLeftPathTemplate;
                            }
                        }
                    }
                    else {
                        nextPath = Splitter._flyUpPathTemplate;
                    }
                }
            }
            else {
                nextPath = Splitter._floatAroundPathTemplate;
            }

            this.prepareNextPath(nextPath);
        }

        // Follow the current path.
        switch(this._currentPath[this._pathPosition].action) {
            case PathAction.Move:
                this._location = this._currentPath[this._pathPosition].location;
                break;
            case PathAction.Fire:
                this.dropBomb();
                break;
        }
        this._pathPosition++;
    }

    calculatePaths(): void {
        if (!Splitter._pathsCalculated) {
            let introPath = new SplinePath(new PathTemplate(
                [
                    new Point(0, 0),
                    new Point(100, 50),
                    new Point(200, 100),
                    new Point(50, 150),
                    new Point(-150, 200),
                    new Point(-200, 250),
                    new Point(-50, 300),
                    new Point(50, 350),
                    new Point(150, 400),
                    new Point(100, 350),
                    new Point(0, 200),
                    new Point(-100, 150),
                    new Point(-60, 175),
                    new Point(-30, 150),
                    new Point(0, 150)
                ],
                [
                    new ScheduledAction(0.25, PathAction.Fire),
                    new ScheduledAction(0.50, PathAction.Fire),
                    new ScheduledAction(0.70, PathAction.Fire)
                ]
            ));
            Splitter._introPathTemplate = introPath.getPath(150);

            let floatAroundPath = new SplinePath(new PathTemplate(
                [
                    new Point(0.0, 0.0),
                    new Point(40.0, 40.0),
                    new Point(0.0, 80.0),
                    new Point(-40.0, 40.0),
                    new Point(0.0, 0.0)
                ],
                []
            ));
            Splitter._floatAroundPathTemplate = floatAroundPath.getPath(50);

            let flyRightPath = new SplinePath(new PathTemplate(
                [
                    new Point(0, 0),
                    new Point(75, 50),
                    new Point(150, -75),
                    new Point(200, 50),
                    new Point(250, 0)
                ],
                [
                    new ScheduledAction(0.50, PathAction.Fire)
                ]
            ));
            Splitter._flyRightPathTemplate = flyRightPath.getPath(50);

            let flyLeftPath = new SplinePath(new PathTemplate(
                [
                    new Point(0, 0),
                    new Point(-75, -50),
                    new Point(-150, 75),
                    new Point(-200, -50),
                    new Point(-250, 0)
                ],
                [
                    new ScheduledAction(0.50, PathAction.Fire)
                ]
            ));
            Splitter._flyLeftPathTemplate = flyLeftPath.getPath(50);

            let flyUpPath = new SplinePath(new PathTemplate(
                [
                    new Point(0, 0),
                    new Point(-50, -50),
                    new Point(50, -100),
                    new Point(0, -150)
                ],
                [
                    new ScheduledAction(0.50, PathAction.Fire)
                ]
            ));
            Splitter._flyUpPathTemplate = flyUpPath.getPath(50);

            let flyDownPath = new SplinePath(new PathTemplate(
                [
                    new Point(0, 0),
                    new Point(-50, 50),
                    new Point(50, 100),
                    new Point(0, 150)
                ],
                [
                    new ScheduledAction(0.50, PathAction.Fire)
                ]
            ));
            Splitter._flyDownPathTemplate = flyDownPath.getPath(50);

            let diveRightPath = new SplinePath(new PathTemplate(
                [
                    new Point(0, 0),
                    new Point(-40, 30),
                    new Point(30, 120),
                    new Point(120, 200),
                    new Point(160, 200),
                    new Point(180, 120),
                    new Point(200, 30)
                ],
                [
                    new ScheduledAction(0.20, PathAction.Fire),
                    new ScheduledAction(0.40, PathAction.Fire),
                    new ScheduledAction(0.65, PathAction.Fire) // The bottom of the incoming dive.
                ]
            ));
            Splitter._diveRightPathTemplate = diveRightPath.getPath(60);

            let diveLeftPath = new SplinePath(new PathTemplate(
                [
                    new Point(0, 0),
                    new Point(40, 30),
                    new Point(-30, 120),
                    new Point(-120, 200),
                    new Point(-160, 200),
                    new Point(-180, 120),
                    new Point(-200, 30)
                ],
                [
                    new ScheduledAction(0.20, PathAction.Fire),
                    new ScheduledAction(0.40, PathAction.Fire),
                    new ScheduledAction(0.65, PathAction.Fire) // The bottom of the incoming dive.
                ]
            ))
            Splitter._diveLeftPathTemplate = diveLeftPath.getPath(60);

            Splitter._pathsCalculated = true;
        }
    }

    prepareNextPath(pathTemplate: PathEntry[]): void {
        this._currentPathTemplate = pathTemplate;
        this._currentPath = SplinePath.translatePath(pathTemplate, this._location.x, this._location.y);
        this._pathPosition = 0;
    }
}