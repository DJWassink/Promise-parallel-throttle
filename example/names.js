import * as Throttle from '../src/throttle';

//array of array containing a firstName and lastName we want to combine.
const names = [
    { firstName: "Irene",     lastName: "Pullman" },
    { firstName: "Sean",      lastName: "Parr" },
    { firstName: "Joe",       lastName: "Slater" },
    { firstName: "Karen",     lastName: "Turner" },
    { firstName: "Tim",       lastName: "Black" },
    { firstName: "Caroline",  lastName: "Thomson" },
    { firstName: "Blake",     lastName: "Scott" },
    { firstName: "Simon",     lastName: "Cornish" },
    { firstName: "Anne",      lastName: "Glover" },
    { firstName: "Ruth",      lastName: "Lewis" },
    { firstName: "Hannah",    lastName: "Stewart" },
    { firstName: "Molly",     lastName: "Wilson" },
    { firstName: "Andrew",    lastName: "MacLeod" },
    { firstName: "Katherine", lastName: "Hardacre" },
    { firstName: "Ava",       lastName: "Campbell" },
    { firstName: "Melanie",   lastName: "Bailey" },
    { firstName: "Audrey",    lastName: "Fisher" },
    { firstName: "Felicity",  lastName: "McLean" }
];

//Crazy slow Promise which actually does what we want!
const slowCombineNames = (firstName, lastName) => {
    return new Promise((resolve, reject) => {
        //Recommended is to return a Error object if we received a error. This is easy to check later on.
        if (firstName == "Ruth") reject(new Error('argh!'));
        //Do some async stuff here. For now we similate it through a timeout.
        setTimeout(
            () => resolve(firstName + " " + lastName),
            (Math.random() * (1000 - 500) + 500)
        );
    });
};

(async() => {
    //Create a array of functions to be run
    const tasks = names.map(u => () => slowCombineNames(u.firstName, u.lastName));

    //Execute the throttle task, only the array of tasks is required, other params are optional.
    const formattedNames = await Throttle.all(tasks, 3, false, statusUpdate => console.log(statusUpdate));

    //Loop through the result and print the result.
    formattedNames.forEach((result, index) => {
        if (result instanceof Error) {
            console.log('Got a error:', result);

            //Since everything is in the same order, we can retrieve everything if we got a error back.
            console.log('Error was in function:', tasks[index]);
            console.log('Source object was:', names[index]);
        } else {
            console.log('Got a resolved result: ', result);
        }
    });

})();
