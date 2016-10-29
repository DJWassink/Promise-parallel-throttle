# Promise-parallel-throttle
[![Build Status](https://travis-ci.org/DJWassink/Promise-parallel-throttle.svg?branch=master)](https://travis-ci.org/DJWassink/Promise-parallel-throttle)

Run a array of Promises in parallel. Kinda like Promise.all(), but throttled!

## Install 
```bash
npm i promise-parallel-throttle -S
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

//Default Throttle runs with 3 promises parallel.
const {tasks: formattedNames} = await Throttle(queue);

console.log(formattedNames); //['Irene Pullman', 'Sean Parr']
```

## API
### Options (parameters)
`Throttle` requires only a array of functions to work properly. However there are more parameters.

`Throttle(task, maxInProgress = 3, abortOnError = false, progressCallback)`

|Parameter|Type|Default|Defenition|
|:---|:---|:---|:---|
|tasks|Array|Required|queue to run|
|maxInProgress |Integer|3| max amount of parallel threads|
|abortOnError |Boolean|false| reject after a single error, or keep running|
|progressCallback |Function|Optional| callback with progress reports|

### Result / Progress callback
The progressCallback and the Throttle itself will return a object with the following properties:

|Property|Type|Start value|Defenition|
|:---|:---|:---|:---|
|amountDone|Integer|0|amount of tasks which are finished|
|amountStarted|Integer|0|amount of tasks which started|
|amountResolved|Integer|0|amount of tasks which successfully resolved|
|amountRejected|Integer|0|amount of tasks which errored and are aborted|
|tasks|Array|Shallow copy of tasks array|array of tasks to be run which periodically get replaced with it's result (get's updated over time)|

## Example
Check out the example's directory, it's heavily documented so it should be easy to follow.