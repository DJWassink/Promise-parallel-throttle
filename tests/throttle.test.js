import expect from 'expect.js';
import Throttle from '../src/throttle';

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
        const {tasks: formattedNames} = await Throttle(tasks);

        /* Then */
        expect(formattedNames).to.not.be.empty();
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
        const {tasks: formattedNames} = await Throttle(tasks);

        /* Then */
        expect(formattedNames).to.not.be.empty();
        names.forEach((nameObject, index) => {
            expect(formattedNames[index]).to.be(nameObject.firstName + " " + nameObject.lastName);
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
        const {tasks: formattedNames} = await Throttle(tasks);

        /* Then */
        expect(formattedNames).to.not.be.empty();
        names.forEach((nameObject, index) => {
            expect(formattedNames[index]).to.be(nameObject.firstName + " " + nameObject.lastName);
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
        const {tasks: formattedNames} = await Throttle(tasks);

        /* Then */
        expect(formattedNames).to.not.be.empty();
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
            const {tasks: formattedNames} = await Throttle(tasks, 1, true);
        } catch (failed) {
            expect(failed.tasks[0]).to.be.an(Error);
            return;
        }

        /* Then */
        expect().fail("Throttle didnt abort");
    });

});