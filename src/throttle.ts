const DEFAULT_MAX = 5;

export interface Result {
    amountDone: number,
    amountStarted: number,
    amountResolved: number,
    amountRejected: number,
    rejectedIndexes: number[],
    resolvedIndexes: number[],
    tasks: any[]
}

/**
 * Raw throttle function, which can return extra meta data.
 * @param tasks array[] of tasks
 * @param maxInProgress integer with amount ot tasks parallel to be run
 * @param failFast boolean if true, do fail-fast behaviour (see Promise.all() documentation)
 * @param progressCallback function which can be used to see the progress
 * @param nextCheck
 * @returns {Promise}
 */
export const raw = (tasks: (() => Promise<any>)[],
                    maxInProgress = DEFAULT_MAX,
                    failFast = false,
                    progressCallback?: Function,
                    nextCheck: (status: Result) => Promise<any> = defaultNextTaskCheck): Promise<Result> => {
    return new Promise((resolve, reject) => {
        let failedFast = false;
        const result: Result = {
            amountDone: 0,
            amountStarted: 0,
            amountResolved: 0,
            amountRejected: 0,
            rejectedIndexes: [],
            resolvedIndexes: [],
            tasks: tasks.slice(0)
        };

        const executeTask = (index) => {
            result.tasks[index]()
                .then(taskResult => {
                    result.tasks[index] = taskResult;
                    result.resolvedIndexes.push(index);
                    result.amountResolved++;
                    taskDone();
                }, error => {
                    result.tasks[index] = error;
                    result.rejectedIndexes.push(index);
                    result.amountRejected++;
                    if (failFast) {
                        failedFast = true;
                        return reject(result);
                    }
                    taskDone();
                })
        };

        const taskDone = () => {
            //make sure no more tasks are spawned when we rejected
            if (failedFast) return;

            result.amountDone++;
            if (progressCallback) progressCallback(result);
            if (result.amountDone == result.tasks.length)return resolve(result);
            nextTask();
        };

        const nextTask = () => {
            //check if we can execute the next task
            nextCheck(result)
                .then(resolve => {
                    //execute it
                    executeTask(result.amountStarted++);
                }, reject => {
                });
        };

        //spawn the first X tasks
        for (let i = 0; i < maxInProgress; i++) {
            nextTask();
        }
    });
};

/**
 * Default checker which validates if a next task should begin.
 * This can be overwritten to write own checks for example checking the amount
 * of used ram and waiting till the ram is low enough for a next task.
 * @param status
 * @returns {Promise}
 */
const defaultNextTaskCheck = (status: Result) =>
    new Promise((resolve, reject) => {
        if (status.amountStarted < status.tasks.length) return resolve();
        reject();
    });

/**
 * Simply run all the promises after each other, so in synchronous manner
 * @param tasks required array of tasks to be executed
 * @param failFast optional boolean if we directly reject on a single error defaults to true
 * @param progressCallback optional function to be run to get status updates
 * @param nextCheck function which should return a promise, when resolved the next task will spawn
 */
export const sync = (tasks: (() => Promise<any>)[],
                     failFast = true,
                     progressCallback?: Function,
                     nextCheck: (status: Result) => Promise<any> = defaultNextTaskCheck): Promise<Array<any>> =>
    new Promise((resolve, reject) =>
        raw(tasks, 1, failFast, progressCallback, nextCheck)
            .then(result => {
                resolve(result.tasks)
            }, reject)
    );

/**
 * Exposes the same behaviour as Promise.All(), but throttled!
 * @param tasks required array of tasks to be executed
 * @param maxInProgress optional integer max amount of parallel tasks to be run defaults to 5
 * @param failFast optional boolean if we directly reject on a single error defaults to true
 * @param progressCallback optional function to be run to get status updates
 * @param nextCheck function which should return a promise, when resolved the next task will spawn
 */
export const all = (tasks: (() => Promise<any>)[],
                    maxInProgress = DEFAULT_MAX,
                    failFast = true,
                    progressCallback?: Function,
                    nextCheck: (status: Result) => Promise<any> = defaultNextTaskCheck): Promise<Array<any>> =>
    new Promise((resolve, reject) =>
        raw(tasks, maxInProgress, failFast, progressCallback, nextCheck)
            .then(result => {
                resolve(result.tasks)
            }, reject)
    );
