export default function(task, paramsArray, maxInProgress = 3, abortOnError = false, progressCallback) => {
	return new Promise((resolve, reject) => {
		const result = {
			aborted: [],
			completed: []
		};
		let started = 0;
		let done = 0;

		const executeTask = (index) => {
			task(...paramsArray[index])
				.then(taskResult => {
					result.completed.push(taskResult);
					if (started < paramsArray.length) executeTask(started++);
					done++;
					if (progressCallback) progressCallback(done, started, result);
					if (done == paramsArray.length) resolve(result);
				}, error => {
					result.aborted.push(error);
					if (abortOnError) return reject(result);
					done++;
					if (progressCallback) progressCallback(done, started, result);
					if (done == paramsArray.length) resolve(result);
				})
		}

		for (let i = 0; i < maxInProgress; i++) {
			executeTask(started++);
		}
	});
}