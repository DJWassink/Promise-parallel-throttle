const expect = require('chai').expect;
const Throttle = require('../build/throttle');

describe('Throttle test', function() {

    it('should return the same amount of tasks', async function() {
        /* Given */
        const names = [
            { firstName: "Irene",     lastName: "Pullman" },
            { firstName: "Sean",      lastName: "Parr" },
            { firstName: "Joe",       lastName: "Slater" },
            { firstName: "Karen",     lastName: "Turner" },
            { firstName: "Tim",       lastName: "Black" }
        ];

        const combineNames = (firstName, lastName) => {
            return new Promise((resolve, reject) => {
                resolve(firstName + " " + lastName);
            });
        };

        //Create a array of functions to be run
        const tasks = names.map(u => () => combineNames(u.firstName, u.lastName));

        /* When */
        const {taskResults: formattedNames} = await Throttle.raw(tasks);

        /* Then */
        expect(formattedNames).to.not.be.empty;
        expect(formattedNames).to.have.length(5);
    });

    it('should return in the same order', async function() {
        /* Given */
        const names = [
            { firstName: "Irene",     lastName: "Pullman" },
            { firstName: "Sean",      lastName: "Parr" },
            { firstName: "Joe",       lastName: "Slater" },
            { firstName: "Karen",     lastName: "Turner" },
            { firstName: "Tim",       lastName: "Black" }
        ];

        const combineNames = (firstName, lastName) => {
            return new Promise((resolve, reject) => {
                resolve(firstName + " " + lastName);
            });
        };

        //Create a array of functions to be run
        const tasks = names.map(u => () => combineNames(u.firstName, u.lastName));

        /* When */
        const {taskResults: formattedNames} = await Throttle.raw(tasks);

        /* Then */
        expect(formattedNames).to.not.be.empty;
        names.forEach((nameObject, index) => {
            expect(formattedNames[index]).to.equal(nameObject.firstName + " " + nameObject.lastName);
        });
    });

    it('should return in the same order with delayed tasks', async function() {
        /* Given */
        const names = [
            { firstName: "Irene",     lastName: "Pullman" },
            { firstName: "Sean",      lastName: "Parr" },
            { firstName: "Joe",       lastName: "Slater" },
            { firstName: "Karen",     lastName: "Turner" },
            { firstName: "Tim",       lastName: "Black" }
        ];

        const combineNames = (firstName, lastName) => {
            return new Promise((resolve, reject) => {
                setTimeout(
                    () => resolve(firstName + " " + lastName),
                    (Math.random() * (1000 - 500) + 500)
                );
            });
        };

        //Create a array of functions to be run
        const tasks = names.map(u => () => combineNames(u.firstName, u.lastName));

        /* When */
        const {taskResults: formattedNames} = await Throttle.raw(tasks);

        /* Then */
        expect(formattedNames).to.not.be.empty;
        names.forEach((nameObject, index) => {
            expect(formattedNames[index]).to.equal(nameObject.firstName + " " + nameObject.lastName);
        });
    });

    it('should continue when a error occured', async function() {
        /* Given */
        const names = [
            { firstName: "Irene",     lastName: "Pullman" },
            { firstName: "Sean",      lastName: "Parr" },
            { firstName: "Joe",       lastName: "Slater" },
            { firstName: "Karen",     lastName: "Turner" },
            { firstName: "Tim",       lastName: "Black" }
        ];

        const combineNames = (firstName, lastName) => {
            return new Promise((resolve, reject) => {
                reject(new Error());
            });
        };

        //Create a array of functions to be run
        const tasks = names.map(u => () => combineNames(u.firstName, u.lastName));

        /* When */
        const {taskResults: formattedNames} = await Throttle.raw(tasks);

        /* Then */
        expect(formattedNames).to.not.be.empty;
        expect(formattedNames).to.have.length(5);
    });

    it('should abort on the first error occured', async function() {
        /* Given */
        const names = [
            { firstName: "Irene",     lastName: "Pullman" },
            { firstName: "Sean",      lastName: "Parr" },
            { firstName: "Joe",       lastName: "Slater" },
            { firstName: "Karen",     lastName: "Turner" },
            { firstName: "Tim",       lastName: "Black" }
        ];

        const combineNames = (firstName, lastName) => {
            return new Promise((resolve, reject) => {
                reject(new Error());
            });
        };

        //Create a array of functions to be run
        const tasks = names.map(u => () => combineNames(u.firstName, u.lastName));

        /* When */
        try {
            const {taskResults: formattedNames} = await Throttle.raw(tasks, 1, true);
        } catch (failed) {
            expect(failed.taskResults[0]).to.be.an.instanceof(Error);
            return;
        }

        /* Then */
        throw new Error("Throttle didn't abort");
    });

    it('should resolve immediately on a empty task array', async function() {
        /* Given */
        const names = [];

        const combineNames = (firstName, lastName) => {
            return new Promise((resolve, reject) => {
                resolve(firstName + " " + lastName);
            });
        };

        //Create a array of functions to be run
        const tasks = names.map(u => () => combineNames(u.firstName, u.lastName));

        /* When */
        const {taskResults: formattedNames} = await Throttle.raw(tasks);

        /* Then */
        expect(formattedNames).to.be.empty;
        expect(formattedNames).to.have.length(0);
    });

    it('should gracefully handle the tasks even if maxInProgress is higher then the amount of tasks', async function() {
        /* Given */
        const names = [
            { firstName: "Irene",     lastName: "Pullman" },
            { firstName: "Sean",      lastName: "Parr" }
        ];

        const combineNames = (firstName, lastName) => {
            return new Promise((resolve, reject) => {
                resolve(firstName + " " + lastName);
            });
        };

        //Create a array of functions to be run
        const tasks = names.map(u => () => combineNames(u.firstName, u.lastName));

        /* When */
        const {taskResults: formattedNames} = await Throttle.raw(tasks);

        /* Then */
        expect(formattedNames).to.not.be.empty;
        expect(formattedNames).to.have.length(2);
    });

    it('should allow overriding of the nextCheck method and allow it to throw a error, and this error should propagate', async function() {
        /* Given */
        const names = [
            { firstName: "Irene",     lastName: "Pullman" },
            { firstName: "Sean",      lastName: "Parr" },
            { firstName: "Joe",       lastName: "Slater" },
            { firstName: "Karen",     lastName: "Turner" },
            { firstName: "Tim",       lastName: "Black" }
        ];

        const combineNames = (firstName, lastName) => {
            return new Promise((resolve, reject) => {
                resolve(firstName + " " + lastName);
            });
        };

        //Create a array of functions to be run
        const tasks = names.map(u => () => combineNames(u.firstName, u.lastName));

        /* When */
        const nextCheck = (status) => {
            return new Promise((resolve, reject) => {
                if (status.amountStarted > 2) {
                    return reject(new Error('Throw after 2 tasks started'));
                }
                resolve(true);
            });
        }

        try {
            const {taskResults: formattedNames} = await Throttle.raw(tasks, 2, false, () => {}, nextCheck);
        } catch (error) {
            //got error, everything good
            return;
        }

        throw new Error('Expected an error, didn\'t get one');
    });

    it('should throw when a task isn\'t a function', async function() {
        /* Given */
        const names = [
            { firstName: "Irene",     lastName: "Pullman" },
            { firstName: "Sean",      lastName: "Parr" },
            { firstName: "Joe",       lastName: "Slater" },
            { firstName: "Karen",     lastName: "Turner" },
            { firstName: "Tim",       lastName: "Black" }
        ];

        const combineNames = (firstName, lastName) => {
            return new Promise((resolve, reject) => {
                resolve(firstName + " " + lastName);
            });
        };

        //Create a array of functions to be run
        let tasks = names.map(u => () => combineNames(u.firstName, u.lastName));
        tasks[2] = 'a string';

        /* When */
        try {
            const {taskResults: formattedNames} = await Throttle.raw(tasks);
        } catch (error) {
            //got error, everything good
            return;
        }

        throw new Error('Expected an error, didn\'t get one');
    });
});