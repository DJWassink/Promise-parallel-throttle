# Promise-parallel-throttle
Run a array of parameters through a function in parallel, but throttled.

## Install 
```bash
npm install promise-parallel-throttle -S
```

## Usage

```js
const ParallelPromiseThrottle = require('promise-parallel-throttle');

function worker(param1, param2) {
  return new Promise((resolve, reject) => {
    //do some difficult stuff here
    resolve(param1 + param2);
  }
}

let paramsArray = [[5, 8],[1337, 1337],[4, 6]];
let result = ParallelPromiseThrottle(worker, paramsArray);

//result is:
result = {
  completed: [{result: 13, params: [5,8]}, {result: 2674, params: [1337,1337]}, {result: 10, params: [4,6]}],
  aborted: []
}

//as you can see result will contain two arrays, completed and aborted.
//completed contains the result and params of the Promise if it succeeded 
//aborted contains the error and params of the Promises which failed
```

## API
`ParallelPromiseThrottle` requires only 2 parameters to work properly, the function to process and a array with parameters for this function. However there are more options!
`ParallelPromiseThrottle(task, paramsArray, maxInProgress = 3, abortOnError = false, progressCallback)`

* task             = function to run
* paramsArray      = params to pass on the the function
* maxInProgress    = max amount of parallel threads
* abortOnError     = reject after a single error, or keep running
* progressCallback = callback with progress reports

The progressCallback returns the following properties:

* amountStarted = amount of tasks started
* amountDone    = amount of tasks which are done
* result        = object containing the Result object (explained below)

The eventual Result is a object looking like this:

```js
const result = {
  completed: [{result: '', params: ''}],
  aborted: [{error: '', params: ''}]
}
```
* completed = array containing all the results and params of a task {result: promiseResult, params: workerParams}
* aborted   = array containing all the errors and params of the different tasks (if any) {error: taskReject, params: params}

## Fancy an example what this actually means? WATCH!

```js
//array of array containing a firstname and lastname we want to combine, with a nice space in between.
const names = [
	["Irene", "Pullman"],
	["Sean", "Parr"],
	["Joe", "Slater"],
	["Karen", "Turner"],
	["Tim", "Black"],
	["Caroline", "Thomson"],
	["Blake", "Scott"],
	["Simon", "Cornish"],
	["Anne", "Glover"],
	["Ruth", "Lewis"],
	["Hannah", "Stewart"],
	["Molly", "Wilson"],
	["Andrew", "MacLeod"],
	["Katherine", "Hardacre"],
	["Ava", "Campbell"],
	["Melanie", "Bailey"],
	["Audrey", "Fisher"],
	["Felicity", "McLean"]
];

//Crazy slow Promise which actually does what we want!
const slowCombineNames = (firstName, lastName) => {
	return new Promise((resolve, reject) => {
		//do stuff here ;]
		setTimeout(() => resolve(firstName + " " + lastName), (Math.random() * (1000 - 500) + 500));	
	});
}

//Well lets start this off, but since the combine method is so slow we want to run the combining of names in parallel (but not too much because imagine a slow server which can't handle too many connections, or another scenario involving high cpu load / memory usage on a server or your machine)
//to still get a fast result we want to run but a few in parallel!
(async function kickOff() {

  //kickoff the ParallelPromiseThrottle with;
    //a function it must run
    //the array with parameters this function will receive
    //the amount of parallel "threads"
    //wether we abort on a single error or go on
    //a callback which gives us insight in the progress, containing (amount started, amount completed, current result)
    
	const awesomeNames = await ParallelPromiseThrottle(slowCombineNames, names, 3, false, (...progressArgs) => {
		console.log(progressArgs);
	});
	console.log(awesomeNames);
})();

```


Taking our code snippit in account, the result would look something like this:
```js
{ aborted: [],
  completed:
    [
      {result: 'Irene Pullman', params: ['Irene', 'Pullman']},
      {result: 'Joe Slater', params: ['Joe', 'Slater']},
      {result: 'Sean Parr', params: ['Sean', 'Parr']},
      {result: 'Tim Black', params: ['Tim', 'Black']},
      {result: 'Karen Turner', params: ['Karen', 'Turner']},
      {result: 'Caroline Thomson', params: ['Caroline', 'Thomson']},
      {result: 'Blake Scott', params: ['Blake', 'Scott']},
      {result: 'Simon Cornish', params: ['Simon', 'Cornish']},
      {result: 'Anne Glover', params: ['Anne', 'Glover']},
      {result: 'Ruth Lewis', params: ['Ruth', 'Lewis']},
      {result: 'Hannah Stewart', params: ['Hannah', 'Stewart']},
      {result: 'Molly Wilson', params: ['Molly', 'Wilson']},
      {result: 'Andrew MacLeod', params: ['Andrew', 'MacLeod']},
      {result: 'Katherine Hardacre', params: ['Katherine', 'Hardacre']},
      {result: 'Ava Campbell', params: ['Ava', 'Campbell']},
      {result: 'Melanie Bailey', params: ['Melanie', 'Bailey']},
      {result: 'Felicity McLean', params: ['Felicity', 'McLean']},
      {result: 'Audrey Fisher',  params: ['Audrey', 'Fisher']}
    ]
}
```
