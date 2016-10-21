function runner(task, paramsArray, maxInProgress = 3, abortOnError = false, progressCallback) {
	return new Promise((resolve, reject) => {
		const result = {
			aborted: [],
			completed: []
		};
		let started = 0;
		let done = 0;

		const executeTask = (index) => {
			const params = ...paramsArray[index];
			task(params)
				.then(taskResult => {
					result.completed.push({result: taskResult, params: params});
					resultHandler();
				}, error => {
					result.aborted.push({error: error, params: params});
					if (abortOnError) return reject(result);
					resultHandler();
				})
		}
		
		const resultHandler = () => {
			if (started < paramsArray.length) executeTask(started++);
			done++;
			if (progressCallback) progressCallback(done, started, result);
			if (done == paramsArray.length) resolve(result);			
		}

		for (let i = 0; i < maxInProgress; i++) {
			executeTask(started++);
		}
	});
}

module.exports = runner;