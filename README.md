# Promise-parallel-throttle
Run a array of parameters through a function in parallel, but throttled.

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

|Parameter|Default|Defenition|
|---|---|---|
|tasks|Required array|queue to run|
|maxInProgress |3| max amount of parallel threads|
|abortOnError |false| reject after a single error, or keep running|
|progressCallback |Optional function| callback with progress reports|

### Result / Progress callback
The progressCallback and the Throttle itself will return a object with the following properties:

|Property|Start value|Defenition|
|---|---|---|
|amountDone|0|amount of tasks which are finished|
|amountStarted|0|amount of tasks which started|
|amountResolved|0|amount of tasks which successfully resolved|
|amountRejected|0|amount of tasks which errored and are aborted|
|tasks|Shallow copy of tasks array|array of tasks to be run or a finished task iits result (get's updated over time)|

## Example
Check out the example's directory, it's heavily documented so it should be easy to follow.