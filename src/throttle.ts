const DEFAULT_MAX = 5;

export interface Result<T> {
    amountDone: number;
    amountStarted: number;
    amountResolved: number;
    amountRejected: number;
    rejectedIndexes: number[];
    resolvedIndexes: number[];
    taskResults: T[];
}

export type Task<T> = () => Promise<T>;
export type Tasks<T> = Array<Task<T>>;
export type nextTaskCheck = <T>(status: Result<T>, tasks: Tasks<T>) => Promise<boolean>;

/**
 * Raw throttle function, which can return extra meta data.
 * @param tasks array[] of functions
 * @param maxInProgress integer with the max amount of tasks to be run in parallel
 * @param failFast boolean if true, do fail-fast behaviour (see Promise.all() documentation)
 * @param progressCallback function which can be used to see the progress
 * @param nextCheck
 * @returns {Promise}
 */
export function raw<T>(tasks: Tasks<T>,
                       maxInProgress = DEFAULT_MAX,
                       failFast = false,
                       progressCallback?: (result: Result<T>) => void,
                       nextCheck = defaultNextTaskCheck): Promise<Result<T>> {
    return new Promise((resolve, reject) => {
        const result: Result<T> = {
            amountDone: 0,
            amountStarted: 0,
            amountResolved: 0,
            amountRejected: 0,
            rejectedIndexes: [],
            resolvedIndexes: [],
            taskResults: []
        };

        if (tasks.length === 0) {
            return resolve(result);
        }

        let failedFast = false;
        let amountQueued = 0;
        const executeTask = (index: number) => {
            if (typeof tasks[index] === 'function') {
                tasks[index]()
                    .then((taskResult: T) => {
                        result.taskResults[index] = taskResult;
                        result.resolvedIndexes.push(index);
                        result.amountResolved++;
                        taskDone();
                    }, error => {
                        result.taskResults[index] = error;
                        result.rejectedIndexes.push(index);
                        result.amountRejected++;
                        if (failFast) {
                            failedFast = true;
                            return reject(result);
                        }
                        taskDone();
                    });
            } else {
                failedFast = true;
                return reject(new Error('tasks[' + index + ']: ' + tasks[index] + ', is supposed to be of type function'));
            }
        };

        const taskDone = () => {
            //make sure no more tasks are spawned when we failedFast
            if (failedFast) {
                return;
            }

            result.amountDone++;
            if (progressCallback) {
                progressCallback(result);
            }
            if (result.amountDone === tasks.length) {
                return resolve(result);
            }
            if (amountQueued < tasks.length) {
                amountQueued++;
                nextTask();
            }
        };

        const nextTask = () => {
            //check if we can execute the next task
            nextCheck(result, tasks)
                .then(canExecuteNextTask => {
                    if (canExecuteNextTask === true) {
                        //execute it
                        executeTask(result.amountStarted++);
                    }
                }, reject);
        };

        //spawn the first X task
        for (let i = 0; i < Math.min(maxInProgress, tasks.length); i++) {
            amountQueued++;
            nextTask();
        }
    });
}

/**
 * Default checker which validates if a next task should begin.
 * This can be overwritten to write own checks for example checking the amount
 * of used ram and waiting till the ram is low enough for a next task.
 *
 * It should always resolve with a boolean, either `true` to start a next task
 * or `false` to stop executing a new task.
 *
 * If this method rejects, the error will propagate to the caller
 * @param status
 * @param tasks
 * @returns {Promise}
 */
const defaultNextTaskCheck: nextTaskCheck = <T>(status: Result<T>, tasks: Tasks<T>): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        if (status.amountStarted < tasks.length) {
            return resolve(true);
        }
        resolve(false);
    });
};

/**
 * Simply run all the promises after each other, so in synchronous manner
 * @param tasks required array of tasks to be executed
 * @param failFast optional boolean if we directly reject on a single error defaults to true
 * @param progressCallback optional function to be run to get status updates
 * @param nextCheck function which should return a promise, when resolved the next task will spawn
 */
export function sync<T>(tasks: Tasks<T>,
                        failFast = true,
                        progressCallback?: () => void,
                        nextCheck = defaultNextTaskCheck): Promise<T[]> {
    return new Promise((resolve, reject) => {
        raw(tasks, 1, failFast, progressCallback, nextCheck)
            .then((result: Result<T>) => {
                resolve(result.taskResults);
            }, reject);
    });
}

/**
 * Exposes the same behaviour as Promise.All(), but throttled!
 * @param tasks required array of tasks to be executed
 * @param maxInProgress optional integer max amount of parallel tasks to be run defaults to 5
 * @param failFast optional boolean if we directly reject on a single error defaults to true
 * @param progressCallback optional function to be run to get status updates
 * @param nextCheck function which should return a promise, when resolved the next task will spawn
 */
export function all<T>(tasks: Tasks<T>,
                       maxInProgress = DEFAULT_MAX,
                       failFast = true,
                       progressCallback?: () => void,
                       nextCheck = defaultNextTaskCheck): Promise<T[]> {
    return new Promise((resolve, reject) => {
        raw(tasks, maxInProgress, failFast, progressCallback, nextCheck)
            .then((result: Result<T>) => {
                resolve(result.taskResults);
            }, reject);
    });
}
