# Promise-parallel-throttle
[![Build Status](https://travis-ci.org/DJWassink/Promise-parallel-throttle.svg?branch=master)](https://travis-ci.org/DJWassink/Promise-parallel-throttle)

Run a array of Promises in parallel. Kinda like Promise.all(), but throttled!

## Install 

### NPM
```bash
npm i promise-parallel-throttle -S
```

### Yarn
```bash
yarn add promise-parallel-throttle
```

## Usage

```js
import Throttle from 'promise-parallel-throttle';

//Function which should return a Promise
const doReq = async (firstName, lastName) => {
    //Do something async.
    return firstName + " " + lastName;
}

const users = [
    {firstName: "Irene", lastName: "Pullman"},
    {firstName: "Sean",  lastName: "Parr"}
];

//Queue with functions to be run
const queue = users.map(user => () => doReq(user.firstName, user.lastName));

//Default Throttle runs with 5 promises parallel.
const formattedNames = await Throttle.all(queue);

console.log(formattedNames); //['Irene Pullman', 'Sean Parr']
```

## API
### Throttle.all
`Throttle.all(tasks, maxInProgress = DEFAULT_MAX, failFast = true, progressCallback, nextCheck = defaultNextTaskCheck)`

Throttle.all is made to behave exactly like Promise.all but instead of all the tasks run parallel it runs a max amount of tasks parallel.
All the parameters are optional instead of tasks array which is required.
For the defenition of the other parameters see [Throttle.raw](#Throttle.raw)

### Throttle.sync
`Throttle.sync(tasks, failFast = true, progressCallback, nextCheck = defaultNextTaskCheck)`

Throttle.sync runs all the tasks synchronously. All the parameters are optional except for the tasks array.
For the defenition of the other parameters see [Throttle.raw](#Throttle.raw)

### Throttle.raw
#### Options (parameters)
`Throttle.raw` requires only a array of functions to work properly. However there are more parameters.

`Throttle.raw(tasks, maxInProgress = DEFAULT_MAX, failFast = false, progressCallback, nextCheck = defaultNextTaskCheck)`

|Parameter|Type|Default|Definition|
|:---|:---|:---|:---|
|tasks|Array|Required|queue to run|
|maxInProgress |Integer|5| max amount of parallel threads|
|failFast |Boolean|false| reject after a single error, or keep running|
|progressCallback |Function|Optional| callback with progress reports|
|nextCheck |Function|Optional| function which should return a promise, if the promise resolved next task is spawn|

#### Result / Progress callback
The progressCallback and the Throttle itself will return a object with the following properties:

|Property|Type|Start value|Definition|
|:---|:---|:---|:---|
|amountDone|Integer|0|amount of tasks which are finished|
|amountStarted|Integer|0|amount of tasks which started|
|amountResolved|Integer|0|amount of tasks which successfully resolved|
|amountRejected|Integer|0|amount of tasks which errored and are aborted|
|rejectedIndexes|Array|[]|all the indexes in the tasks array where the promise rejected|
|resolvedIndexes|Array|[]|all the indexes in the tasks array where the promise resolved|
|tasks|Array|Shallow copy of tasks array|array of tasks to be run which periodically get replaced with it's result (get's updated over time)|

#### nextCheck
All the functions got a parameter which will use the passed function as a check before spawning the next task.
The default `nextCheck` look like this;
```js
const defaultNextTaskCheck = (status) => 
	new Promise((resolve, reject) => {
		if (status.amountStarted < status.tasks.length) return resolve();
		reject();
	});
```

This function will get a status object as parameter which adheres to the object in [Result / Progress callback](#result--progress-callback).
In the default we simply check if the amount of started exceeds the amount to be done, if not we are free to start a other task.

This function can be useful to write your own scheduler based on, for example ram usage/cpu usage.
Lets say the tasks you defined use a lot of ram and you don't want to exceed a certain amount.
Then you could write logic inside a `nextCheck` function which resolves after there is enough ram available to start the next task.


## Example
Check out the example's directory, it's heavily documented so it should be easy to follow.

To run the example, at least Node 7.x.x is required, since it supports native async/await.

Simply run the example with npm:
```bash
npm run-script names
```

Or with Yarn:
```bash
yarn names
```