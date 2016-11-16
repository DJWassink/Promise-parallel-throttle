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
});