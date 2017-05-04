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

export interface Options {
    maxInProgress?: number;
    failFast?: boolean;
    progressCallback?: <T>(result: Result<T>) => void;
    nextCheck?: nextTaskCheck;
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
        resolve(status.amountStarted < tasks.length);
    });
};

const DEFAULT_OPTIONS = {
    maxInProgress: DEFAULT_MAX,
    failFast: false,
    nextCheck: defaultNextTaskCheck,
};

export type Task<T> = () => Promise<T>;
export type Tasks<T> = Array<Task<T>>;
export type nextTaskCheck = <T>(status: Result<T>, tasks: Tasks<T>) => Promise<boolean>;

/**
 * Raw throttle function, which can return extra meta data.
 * @param tasks required array of tasks to be executed
 * @param options Options object
 * @returns {Promise}
 */
export function raw<T>(tasks: Tasks<T>, options?: Options): Promise<Result<T>> {
    return new Promise((resolve, reject) => {
        const myOptions = Object.assign({}, DEFAULT_OPTIONS, options);
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
                        if (myOptions.failFast === true) {
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
            if (failedFast === true) {
                return;
            }

            result.amountDone++;
            if (typeof (myOptions as Options).progressCallback === 'function') {
                (myOptions as any).progressCallback(result);
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
            myOptions.nextCheck(result, tasks)
                .then(canExecuteNextTask => {
                    if (canExecuteNextTask === true) {
                        //execute it
                        executeTask(result.amountStarted++);
                    } else {
                        taskDone();
                    }
                }, reject);
        };

        //spawn the first X task
        for (let i = 0; i < Math.min(myOptions.maxInProgress, tasks.length); i++) {
            amountQueued++;
            nextTask();
        }
    });
}

/**
 * Simply run all the promises after each other, so in synchronous manner
 * @param tasks required array of tasks to be executed
 * @param options Options object
 * @returns {Promise}
 */
export function sync<T>(tasks: Tasks<T>, options?: Options): Promise<T[]> {
    return new Promise((resolve, reject) => {
        const myOptions = Object.assign({}, {maxInProgress: 1, failFast: true}, options);
        raw(tasks, myOptions)
            .then((result: Result<T>) => {
                resolve(result.taskResults);
            }, (error: Error|Result<T>) => {
                if (error instanceof Error) {
                    reject(error);
                } else {
                    reject(error.taskResults[error.rejectedIndexes[0]]);
                }
            });
    });
}

/**
 * Exposes the same behaviour as Promise.All(), but throttled!
 * @param tasks required array of tasks to be executed
 * @param options Options object
 * @returns {Promise}
 */
export function all<T>(tasks: Tasks<T>, options?: Options): Promise<T[]> {
    return new Promise((resolve, reject) => {
        const myOptions = Object.assign({}, {failFast: true}, options);
        raw(tasks, myOptions)
            .then((result: Result<T>) => {
                resolve(result.taskResults);
            }, (error: Error|Result<T>) => {
                if (error instanceof Error) {
                    reject(error);
                } else {
                    reject(error.taskResults[error.rejectedIndexes[0]]);
                }
            });
    });
}
