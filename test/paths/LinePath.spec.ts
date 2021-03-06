import {describe} from 'mocha';
import {expect} from 'chai';

import {every} from 'underscore';

import {LinePath} from "../../src/paths/LinePath";
import {Point} from "../../src/Point";
import {ScheduledAction} from "../../src/paths/ScheduledAction";
import {PathEntry} from "../../src/paths/PathEntry";
import {PathAction} from "../../src/paths/PathAction";

describe('LinePath', () => {
    describe('#getPath()', () => {
        it ('creates a path with the specified number of steps', () => {
            const linePath = new LinePath(new Point(0.0, 0.0), new Point(100.0, 100.0), []);

            const numberOfSteps = 10;
            const path = linePath.getPath(numberOfSteps);

            // A given number of steps require one additional point (fencepost analogy).
            expect(path.length).to.be.equal(numberOfSteps + 1);
        });

        it ('creates a path containing only movements when no other actions are specified in the template', () => {
            const linePath = new LinePath(new Point(0.0, 0.0), new Point(100.0, 100.0), []);

            const path = linePath.getPath(10);

            // All steps that are movements.
            const movements = path.filter((value: PathEntry): boolean => { return value.action === PathAction.Move });

            expect(movements.length).to.be.equal(path.length);
        });

        it('creates paths that begin and terminate at the first and last provided points', () => {
            const linePath = new LinePath(new Point(0.0, 0.0), new Point(10.0, 30.0), []);

            const path = linePath.getPath(10);

            expect(Math.round(path[0].location!.x)).to.be.eql(0.0);
            expect(Math.round(path[0].location!.y)).to.be.eql(0.0);

            expect(Math.round(path[10].location!.x)).to.be.closeTo(10.0, 0.01);
            expect(Math.round(path[10].location!.y)).to.be.closeTo(30.0, 0.01);
        });

        it('inserts non-movement actions at specified positions along the path', () => {
            const linePath = new LinePath(
                new Point(0.0, 0.0),
                new Point(100.0, 100.0),
                [new ScheduledAction(0.50, PathAction.Fire)]);

            const path = linePath.getPath(10);

            // One extra step for the fire action.
            expect(path.length).to.be.equal(12);

            expect(path[5].action).to.be.equal(PathAction.Fire);
        });

        it('only generates coordinates between the start and end points', () => {
            const linePath = new LinePath(new Point(10.0, 50.0), new Point(40.0, 90.0), []);

            const path = linePath.getPath(10);

            expect(
                every(
                    path.map((point: PathEntry): number => { return point.location!.x }),
                    (value: number): boolean => { return (value >= 10.0) && (value <= 40.0); }
                )
            ).to.be.true;
            expect(
                every(
                    path.map((point: PathEntry): number => { return point.location!.y }),
                    (value: number): boolean => { return (value >= 50.0) && (value <= 90.0); }
                )
            ).to.be.true;
        });
    });
});
