import {describe} from 'mocha';
import {expect} from 'chai';

import {Bounds} from "../../src/Bounds";
import {Bullet} from '../../src/shots/Bullet';
import {Dimensions} from "../../src/Dimensions";
import {Point} from '../../src/Point';
import {World} from '../../src/World';

import {AudioPlayerStub} from "../stubs/AudioPlayerStub";
import {EnemyStub} from "../stubs/EnemyStub";
import {ScoreCounter} from "../../src/ScoreCounter";

describe('Bullet', () => {
    describe('#tick()', () => {
        let audioPlayer: AudioPlayerStub;
        let world: World;

        beforeEach(() => {
            audioPlayer = new AudioPlayerStub();
            world = new World(new Dimensions(480, 640), new ScoreCounter());
        });

        it('should move the bullet directly upwards', () => {
            const bullet = new Bullet(
                audioPlayer,
                world,
                new Point(5, 10)
            );
            bullet.tick();
            expect(bullet.coordinates.x).to.be.equal(5);
            expect(bullet.coordinates.y).to.be.below(10);
        });

        it ('should animate the sprite frames', () => {
            const bullet = new Bullet(
                audioPlayer,
                world,
                new Point(5, 10)
            );
            expect(bullet.imageDetails.currentFrame).to.be.equal(0);
            bullet.tick();
            expect(bullet.imageDetails.currentFrame).to.be.equal(1);
        });

        it('should recycle sprite frames when animating', () => {
            const bullet = new Bullet(
                audioPlayer,
                world,
                new Point(5, 10)
            );
            const numberOfFrames = bullet.imageDetails.numberOfFrames;
            for (let i=0; i < numberOfFrames-1; i++) {
                bullet.tick();
            }
            expect(bullet.imageDetails.currentFrame).to.be.equal(numberOfFrames-1);
            bullet.tick();
            expect(bullet.imageDetails.currentFrame).to.be.equal(0);
        });

        it('should remain active while it remains within the world', () => {
            const bullet = new Bullet(
                audioPlayer,
                world,
                new Point(5, 10)
            );
            bullet.tick();
            expect(bullet.isActive).to.be.true;
        });

        it('should become inactive when it leaves the world', () => {
            const bullet = new Bullet(
                audioPlayer,
                world,
                new Point(5, 0)
            );
            bullet.tick();
            expect(bullet.isActive).to.be.false;
        });

        it('should hit any active enemies within collision distance', () => {
            let hit: boolean = false;
            const enemy = new EnemyStub(world, new Point(10, 10)).onHit(damage => hit = true);
            world.addActor(enemy);
            const bullet = new Bullet(audioPlayer, world, new Point(10, 10));
            bullet.tick();
            expect(hit).to.be.true;
        });

        it('should not hit any active enemies outside collision distance', () => {
            let hit: boolean = false;
            const enemy = new EnemyStub(world, new Point(100, 100))
                .onHit(damage => hit = true)
                .setCollisionMask([new Bounds(-5, 5, -5, 5)]);
            world.addActor(enemy);
            const bullet = new Bullet(audioPlayer, world, new Point(10, 10));
            bullet.tick();
            expect(hit).to.be.false;
        });

        it('should hit a target with damage equal to 1', () => {
            let actualDamage: number = 0;
            const enemy = new EnemyStub(world, new Point(10, 10)).onHit(damage => actualDamage = damage);
            world.addActor(enemy);
            const bullet = new Bullet(audioPlayer, world, new Point(10, 10));
            bullet.tick();
            expect(actualDamage).to.be.equal(1);
        });

        it('should become inactive after it has made a successful hit', () => {
            const enemy = new EnemyStub(world, new Point(10, 10));
            world.addActor(enemy);
            const bullet = new Bullet(audioPlayer, world, new Point(10, 10));
            bullet.tick();
            expect(bullet.isActive).to.be.false;
        });

        it('should become inactive if it makes an unsuccessful hit', () => {
            const enemy = new EnemyStub(world, new Point(10, 10)).refuseHits();
            world.addActor(enemy);
            const bullet = new Bullet(audioPlayer, world, new Point(10, 10));
            bullet.tick();
            expect(bullet.isActive).to.be.false;
        });

        it('should only be able to hit a single target', () => {
            let enemy1Hit = false;
            let enemy2Hit = false;
            const enemy1 = new EnemyStub(world, new Point(10, 10)).onHit(damage => enemy1Hit = true);
            world.addActor(enemy1);
            const enemy2 = new EnemyStub(world, new Point(10, 10)).onHit(damage => enemy2Hit = true);
            world.addActor(enemy2);
            const bullet = new Bullet(audioPlayer, world, new Point(10, 10));
            bullet.tick();
            expect(enemy1Hit).to.not.be.equal(enemy2Hit);
        });

        it('should play a sound on the first tick', () => {
            let playedSound: boolean = false;
            audioPlayer.onPlay((soundName: string) => playedSound = true);

            const bullet = new Bullet(audioPlayer, world, new Point(5, 10));
            bullet.tick();

            expect(playedSound).to.be.true;
        });
    });
});
