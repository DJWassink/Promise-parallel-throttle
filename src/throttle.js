export default function throttle(tasks, maxInProgress = 3, abortOnError = false, progressCallback) {
	return new Promise((resolve, reject) => {
		const result = {
			amountDone: 0,
			amountStarted: 0,
			amountResolved: 0,
			amountRejected: 0,
			tasks: tasks.slice(0)
		};

		const executeTask = (index) => {
			result.tasks[index]()
				.then(taskResult => {
					result.tasks[index] = taskResult;
					result.amountResolved++;
					nextTask();
				}, error => {
					result.tasks[index] = error;
					result.amountRejected++;
					if (abortOnError) return reject(result);
					nextTask();
				})
		};
		
		const nextTask = () => {
			result.amountDone++;
			if (result.amountStarted < result.tasks.length) executeTask(result.amountStarted++);
			if (progressCallback) progressCallback(result);
			if (result.amountDone == result.tasks.length) resolve(result);
		};

		for (let i = 0; i < maxInProgress; i++) {
			executeTask(result.amountStarted++);
		}
	});
}