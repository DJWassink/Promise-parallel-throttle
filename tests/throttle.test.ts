import * as Throttle from '../src/throttle';
import {Result} from '../src/throttle';

interface Person {
    firstName: string;
    lastName: string;
}

describe('Throttle test', function() {
    describe('raw', function() {
        it('should return the same amount of tasks', async function() {
            /* Given */
            const names: Person[] = [
                {firstName: 'Irene', lastName: 'Pullman'},
                {firstName: 'Sean', lastName: 'Parr'},
                {firstName: 'Joe', lastName: 'Slater'},
                {firstName: 'Karen', lastName: 'Turner'},
                {firstName: 'Tim', lastName: 'Black'},
                {firstName: 'Irene', lastName: 'Pullman'},
                {firstName: 'Sean', lastName: 'Parr'},
                {firstName: 'Joe', lastName: 'Slater'},
                {firstName: 'Karen', lastName: 'Turner'},
                {firstName: 'Tim', lastName: 'Black'}
            ];

            const combineNames = (firstName: string, lastName: string): Promise<string> => {
                return new Promise((resolve, reject) => {
                    resolve(firstName + ' ' + lastName);
                });
            };

            //Create a array of functions to be run
            const tasks = names.map(u => () => combineNames(u.firstName, u.lastName));

            /* When */
            const {taskResults: formattedNames} = await Throttle.raw(tasks);

            /* Then */
            expect(formattedNames).toHaveLength(10);
        });

        it('should return in the same order', async function() {
            /* Given */
            const names: Person[] = [
                {firstName: 'Irene', lastName: 'Pullman'},
                {firstName: 'Sean', lastName: 'Parr'},
                {firstName: 'Joe', lastName: 'Slater'},
                {firstName: 'Karen', lastName: 'Turner'}
            ];

            const combineNames = (firstName: string, lastName: string): Promise<string> => {
                return new Promise((resolve, reject) => {
                    resolve(firstName + ' ' + lastName);
                });
            };

            //Create a array of functions to be run
            const tasks = names.map(u => () => combineNames(u.firstName, u.lastName));

            /* When */
            const {taskResults: formattedNames} = await Throttle.raw(tasks);

            /* Then */
            expect(formattedNames).not.toBeNull();
            names.forEach((nameObject, index) => {
                expect(formattedNames[index]).toEqual(nameObject.firstName + ' ' + nameObject.lastName);
            });
        });

        it('should return in the same order with delayed tasks', async function() {
            /* Given */
            const names: Person[] = [
                {firstName: 'Irene', lastName: 'Pullman'},
                {firstName: 'Sean', lastName: 'Parr'},
                {firstName: 'Joe', lastName: 'Slater'},
                {firstName: 'Karen', lastName: 'Turner'},
                {firstName: 'Tim', lastName: 'Black'}
            ];

            const combineNames = (firstName: string, lastName: string): Promise<string> => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => resolve(firstName + ' ' + lastName), Math.random() * (1000 - 500) + 500);
                });
            };

            //Create a array of functions to be run
            const tasks = names.map(u => () => combineNames(u.firstName, u.lastName));

            /* When */
            const {taskResults: formattedNames} = await Throttle.raw(tasks);

            /* Then */
            expect(formattedNames).not.toBeNull();
            names.forEach((nameObject, index) => {
                expect(formattedNames[index]).toEqual(nameObject.firstName + ' ' + nameObject.lastName);
            });
        });

        it('should continue when a error occurred', async function() {
            /* Given */
            const names: Person[] = [
                {firstName: 'Irene', lastName: 'Pullman'},
                {firstName: 'Sean', lastName: 'Parr'},
                {firstName: 'Joe', lastName: 'Slater'},
                {firstName: 'Karen', lastName: 'Turner'},
                {firstName: 'Tim', lastName: 'Black'}
            ];

            const combineNames = (firstName: string, lastName: string): Promise<string> => {
                return new Promise((resolve, reject) => {
                    reject(new Error());
                });
            };

            //Create a array of functions to be run
            const tasks = names.map(u => () => combineNames(u.firstName, u.lastName));

            /* When */
            const {taskResults: formattedNames} = await Throttle.raw(tasks);

            /* Then */
            expect(formattedNames).not.toBeNull();
            expect(formattedNames).toHaveLength(5);
        });

        it('should abort on the first error occurred', async function() {
            /* Given */
            const names: Person[] = [
                {firstName: 'Irene', lastName: 'Pullman'},
                {firstName: 'Sean', lastName: 'Parr'},
                {firstName: 'Joe', lastName: 'Slater'},
                {firstName: 'Karen', lastName: 'Turner'},
                {firstName: 'Tim', lastName: 'Black'}
            ];

            const combineNames = (firstName: string, lastName: string): Promise<string> => {
                return new Promise((resolve, reject) => {
                    reject(new Error());
                });
            };

            //Create a array of functions to be run
            const tasks = names.map(u => () => combineNames(u.firstName, u.lastName));

            /* When */
            try {
                const {taskResults: formattedNames} = await Throttle.raw(tasks, {maxInProgress: 1, failFast: true});
            } catch (failed) {
                expect(failed.taskResults[0]).toBeInstanceOf(Error);
                return;
            }

            /* Then */
            throw new Error("Throttle didn't abort");
        });

        it('should resolve immediately on a empty task array', async function() {
            /* Given */
            const names: Person[] = [];

            const combineNames = (firstName: string, lastName: string): Promise<string> => {
                return new Promise((resolve, reject) => {
                    resolve(firstName + ' ' + lastName);
                });
            };

            //Create a array of functions to be run
            const tasks = names.map(u => () => combineNames(u.firstName, u.lastName));

            /* When */
            const {taskResults: formattedNames} = await Throttle.raw(tasks);

            /* Then */
            expect(formattedNames).not.toBeNull();
            expect(formattedNames).toHaveLength(0);
        });

        it('should gracefully handle the tasks even if maxInProgress is higher then the amount of tasks', async function() {
            /* Given */
            const names: Person[] = [{firstName: 'Irene', lastName: 'Pullman'}, {firstName: 'Sean', lastName: 'Parr'}];

            const combineNames = (firstName: string, lastName: string): Promise<string> => {
                return new Promise((resolve, reject) => {
                    resolve(firstName + ' ' + lastName);
                });
            };

            //Create a array of functions to be run
            const tasks = names.map(u => () => combineNames(u.firstName, u.lastName));

            /* When */
            const {taskResults: formattedNames} = await Throttle.raw(tasks);

            /* Then */
            expect(formattedNames).not.toBeNull();
            expect(formattedNames).toHaveLength(2);
        });

        it('should allow overriding of the nextCheck method and allow it to throw a error, and this error should propagate', async function() {
            /* Given */
            const names: Person[] = [
                {firstName: 'Irene', lastName: 'Pullman'},
                {firstName: 'Sean', lastName: 'Parr'},
                {firstName: 'Joe', lastName: 'Slater'},
                {firstName: 'Karen', lastName: 'Turner'},
                {firstName: 'Tim', lastName: 'Black'}
            ];

            const combineNames = (firstName: string, lastName: string): Promise<string> => {
                return new Promise<string>((resolve, reject) => {
                    resolve(firstName + ' ' + lastName);
                });
            };

            //Create a array of functions to be run
            const tasks = names.map(u => () => combineNames(u.firstName, u.lastName));

            /* When */
            const nextCheck = (status: Result<string>) => {
                return new Promise<boolean>((resolve, reject) => {
                    if (status.amountStarted > 2) {
                        return reject(new Error('Throw after 2 tasks started'));
                    }
                    resolve(true);
                });
            };

            try {
                const {taskResults: formattedNames} = await Throttle.raw(tasks, {
                    maxInProgress: 2,
                    failFast: false,
                    nextCheck
                });
            } catch (error) {
                //got error, everything good
                return;
            }

            throw new Error("Expected an error, didn't get one");
        });

        it("should throw when a task isn't a function", async function() {
            /* Given */
            const names: Person[] = [
                {firstName: 'Irene', lastName: 'Pullman'},
                {firstName: 'Sean', lastName: 'Parr'},
                {firstName: 'Joe', lastName: 'Slater'},
                {firstName: 'Karen', lastName: 'Turner'},
                {firstName: 'Tim', lastName: 'Black'}
            ];

            const combineNames = (firstName: string, lastName: string): Promise<string> => {
                return new Promise<string>((resolve, reject) => {
                    resolve(firstName + ' ' + lastName);
                });
            };

            //Create a array of functions to be run
            const tasks = names.map(u => () => combineNames(u.firstName, u.lastName));
            tasks[2] = 'a string' as any;

            /* When */
            try {
                const {taskResults: formattedNames} = await Throttle.raw(tasks);
            } catch (error) {
                //got error, everything good
                return;
            }

            throw new Error("Expected an error, didn't get one");
        });

        it('should return the task if its not a function and the ignoreIsFunctionCheck is true', async function() {
            /* Given */
            const names: Person[] = [
                {firstName: 'Irene', lastName: 'Pullman'},
                {firstName: 'Sean', lastName: 'Parr'},
                {firstName: 'Joe', lastName: 'Slater'},
                {firstName: 'Karen', lastName: 'Turner'},
                {firstName: 'Tim', lastName: 'Black'}
            ];

            const combineNames = (firstName: string, lastName: string): Promise<string> => {
                return new Promise<string>((resolve, reject) => {
                    resolve(firstName + ' ' + lastName);
                });
            };

            //Create a array of functions to be run
            const tasks = names.map(u => () => combineNames(u.firstName, u.lastName));
            tasks[2] = 'a string' as any;

            /* When */
            const progressCallback = jest.fn();
            const {taskResults: formattedNames} = await Throttle.raw(tasks, {
                ignoreIsFunctionCheck: true,
                progressCallback
            });

            /* Then */
            expect(progressCallback).toHaveBeenCalledTimes(5);
            expect(formattedNames[2]).toBe('a string');
        });

        it('should call the callback function every time a task is done', async function() {
            /* Given */
            const names: Person[] = [
                {firstName: 'Irene', lastName: 'Pullman'},
                {firstName: 'Sean', lastName: 'Parr'},
                {firstName: 'Joe', lastName: 'Slater'},
                {firstName: 'Karen', lastName: 'Turner'},
                {firstName: 'Tim', lastName: 'Black'}
            ];

            const combineNames = (firstName: string, lastName: string): Promise<string> => {
                return new Promise<string>((resolve, reject) => {
                    resolve(firstName + ' ' + lastName);
                });
            };

            //Create a array of functions to be run
            const tasks = names.map(u => () => combineNames(u.firstName, u.lastName));

            /* When */
            const progressCallback = jest.fn();
            const {taskResults: formattedNames} = await Throttle.raw(tasks, {progressCallback});

            /* Then */
            expect(progressCallback).toHaveBeenCalledTimes(5);
        });

        it('should eventually stop if the nextTaskCheck returns false', async function() {
            /* Given */
            const names: Person[] = [
                {firstName: 'Irene', lastName: 'Pullman'},
                {firstName: 'Sean', lastName: 'Parr'},
                {firstName: 'Joe', lastName: 'Slater'},
                {firstName: 'Karen', lastName: 'Turner'},
                {firstName: 'Tim', lastName: 'Black'},
                {firstName: 'Irene', lastName: 'Pullman'},
                {firstName: 'Sean', lastName: 'Parr'},
                {firstName: 'Joe', lastName: 'Slater'},
                {firstName: 'Karen', lastName: 'Turner'},
                {firstName: 'Tim', lastName: 'Black'}
            ];

            const combineNames = (firstName: string, lastName: string): Promise<string> => {
                return new Promise<string>((resolve, reject) => {
                    resolve(firstName + ' ' + lastName);
                });
            };

            //Create a array of functions to be run
            const tasks = names.map(u => () => combineNames(u.firstName, u.lastName));

            /* When */
            const nextCheck = (status: Result<string>) => {
                return new Promise<boolean>((resolve, reject) => {
                    if (status.amountStarted >= 6) {
                        return resolve(false);
                    }
                    resolve(true);
                });
            };

            const result = await Throttle.raw(tasks, {maxInProgress: 2, failFast: false, nextCheck});

            /* Then */
            expect(result.taskResults).toHaveLength(6);
            expect(result.amountDone).toEqual(10);
            expect(result.nextCheckFalseyIndexes).toHaveLength(4);
            expect(result.amountStarted).toEqual(6);
        });

        it('should reject if task throws', async () => {
            /* Given */
            const names: Person[] = [
                {firstName: 'Irene', lastName: 'Pullman'},
                {firstName: 'Sean', lastName: 'Parr'},
                {firstName: 'Joe', lastName: 'Slater'},
                {firstName: 'Karen', lastName: 'Turner'},
                {firstName: 'Tim', lastName: 'Black'}
            ];

            const combineNames = (firstName: string, lastName: string): Promise<string> => {
                throw new Error('oh no somethings gone wrong');
            };

            //Create a array of functions to be run
            const tasks = names.map(u => () => combineNames(u.firstName, u.lastName));

            /* When */
            const taskResults = await Throttle.raw(tasks);
            expect(taskResults.amountDone).toBe(names.length);
            expect(taskResults.amountRejected).toBe(names.length);
        });
    });

    describe('all', function() {
        it('should only return the taskResults', async function() {
            /* Given */
            const names: Person[] = [
                {firstName: 'Irene', lastName: 'Pullman'},
                {firstName: 'Sean', lastName: 'Parr'},
                {firstName: 'Joe', lastName: 'Slater'},
                {firstName: 'Karen', lastName: 'Turner'},
                {firstName: 'Tim', lastName: 'Black'}
            ];

            const combineNames = (firstName: string, lastName: string): Promise<string> => {
                return new Promise((resolve, reject) => {
                    resolve(firstName + ' ' + lastName);
                });
            };

            //Create a array of functions to be run
            const tasks = names.map(u => () => combineNames(u.firstName, u.lastName));

            /* When */
            const formattedNames = await Throttle.all(tasks);

            /* Then */
            expect(formattedNames).toBeInstanceOf(Array);
            expect(formattedNames).toHaveLength(5);
        });

        it('should only return a single Error if a task failed', async function() {
            /* Given */
            const names: Person[] = [
                {firstName: 'Irene', lastName: 'Pullman'},
                {firstName: 'Sean', lastName: 'Parr'},
                {firstName: 'Joe', lastName: 'Slater'},
                {firstName: 'Karen', lastName: 'Turner'},
                {firstName: 'Tim', lastName: 'Black'}
            ];

            const combineNames = (firstName: string, lastName: string): Promise<string> => {
                return new Promise((resolve, reject) => {
                    reject(new Error('noes'));
                });
            };

            //Create a array of functions to be run
            const tasks = names.map(u => () => combineNames(u.firstName, u.lastName));

            /* Then */
            try {
                const formattedNames = await Throttle.all(tasks);
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toEqual('noes');
                return;
            }

            throw Error('expected error tho throw');
        });

        it('should continue if a error occurred when failFast is false', async function() {
            /* Given */
            const names: Person[] = [
                {firstName: 'Irene', lastName: 'Pullman'},
                {firstName: 'Sean', lastName: 'Parr'},
                {firstName: 'Joe', lastName: 'Slater'},
                {firstName: 'Karen', lastName: 'Turner'},
                {firstName: 'Tim', lastName: 'Black'}
            ];

            const combineNames = (firstName: string, lastName: string): Promise<string> => {
                return new Promise((resolve, reject) => {
                    reject(new Error('noes'));
                });
            };

            //Create a array of functions to be run
            const tasks = names.map(u => () => combineNames(u.firstName, u.lastName));

            /* When */
            const formattedNames = await Throttle.all(tasks, {failFast: false});

            /* Then */
            expect(formattedNames).toHaveLength(5);
        });

        it("should throw if one task isn't a function", async function() {
            /* Given */
            const names: Person[] = [
                {firstName: 'Irene', lastName: 'Pullman'},
                {firstName: 'Sean', lastName: 'Parr'},
                {firstName: 'Joe', lastName: 'Slater'},
                {firstName: 'Karen', lastName: 'Turner'},
                {firstName: 'Tim', lastName: 'Black'}
            ];

            const combineNames = (firstName: string, lastName: string): Promise<string> => {
                return new Promise((resolve, reject) => {
                    resolve(firstName + ' ' + lastName);
                });
            };

            //Create a array of functions to be run
            const tasks = names.map(u => () => combineNames(u.firstName, u.lastName));
            tasks[2] = 'a string' as any;

            /* When */
            try {
                const result = await Throttle.all(tasks);
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                return;
            }

            throw new Error("Expected an error, didn't get one");
        });
    });

    describe('sync', function() {
        it('should only return the taskResults', async function() {
            /* Given */
            const names: Person[] = [
                {firstName: 'Irene', lastName: 'Pullman'},
                {firstName: 'Sean', lastName: 'Parr'},
                {firstName: 'Joe', lastName: 'Slater'},
                {firstName: 'Karen', lastName: 'Turner'},
                {firstName: 'Tim', lastName: 'Black'}
            ];

            const combineNames = (firstName: string, lastName: string): Promise<string> => {
                return new Promise((resolve, reject) => {
                    resolve(firstName + ' ' + lastName);
                });
            };

            //Create a array of functions to be run
            const tasks = names.map(u => () => combineNames(u.firstName, u.lastName));

            /* When */
            const formattedNames = await Throttle.sync(tasks);

            /* Then */
            expect(formattedNames).toBeInstanceOf(Array);
            expect(formattedNames).toHaveLength(5);
        });

        it('should only return a single Error if a task failed', async function() {
            /* Given */
            const names: Person[] = [
                {firstName: 'Irene', lastName: 'Pullman'},
                {firstName: 'Sean', lastName: 'Parr'},
                {firstName: 'Joe', lastName: 'Slater'},
                {firstName: 'Karen', lastName: 'Turner'},
                {firstName: 'Tim', lastName: 'Black'}
            ];

            const combineNames = (firstName: string, lastName: string): Promise<string> => {
                return new Promise((resolve, reject) => {
                    reject(new Error('noes'));
                });
            };

            //Create a array of functions to be run
            const tasks = names.map(u => () => combineNames(u.firstName, u.lastName));

            /* Then */
            try {
                const formattedNames = await Throttle.sync(tasks);
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toEqual('noes');
                return;
            }

            throw Error('expected error to throw');
        });

        it('should continue if a error occurred when failFast is false', async function() {
            /* Given */
            const names: Person[] = [
                {firstName: 'Irene', lastName: 'Pullman'},
                {firstName: 'Sean', lastName: 'Parr'},
                {firstName: 'Joe', lastName: 'Slater'},
                {firstName: 'Karen', lastName: 'Turner'},
                {firstName: 'Tim', lastName: 'Black'}
            ];

            const combineNames = (firstName: string, lastName: string): Promise<string> => {
                return new Promise((resolve, reject) => {
                    reject(new Error('noes'));
                });
            };

            //Create a array of functions to be run
            const tasks = names.map(u => () => combineNames(u.firstName, u.lastName));

            /* When */
            const formattedNames = await Throttle.sync(tasks, {failFast: false});

            /* Then */
            expect(formattedNames).toHaveLength(5);
        });

        it("should throw if one task isn't a function", async function() {
            /* Given */
            const names: Person[] = [
                {firstName: 'Irene', lastName: 'Pullman'},
                {firstName: 'Sean', lastName: 'Parr'},
                {firstName: 'Joe', lastName: 'Slater'},
                {firstName: 'Karen', lastName: 'Turner'},
                {firstName: 'Tim', lastName: 'Black'}
            ];

            const combineNames = (firstName: string, lastName: string): Promise<string> => {
                return new Promise((resolve, reject) => {
                    resolve(firstName + ' ' + lastName);
                });
            };

            //Create a array of functions to be run
            const tasks = names.map(u => () => combineNames(u.firstName, u.lastName));
            tasks[2] = 'a string' as any;

            /* When */
            try {
                const result = await Throttle.sync(tasks);
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                return;
            }

            throw new Error("Expected an error, didn't get one");
        });
    });
});
