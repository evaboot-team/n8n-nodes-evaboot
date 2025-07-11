import {
	ITriggerFunctions,
	IDataObject,
	INodeType,
	INodeTypeDescription,
	ITriggerResponse,
	NodeConnectionType,
} from 'n8n-workflow';

export class EvabootPolling implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Evaboot Polling',
		name: 'evabootPolling',
		icon: 'file:evaboot.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["resource"]}}',
		description: 'Polls Evaboot API for completed jobs',
		defaults: {
			name: 'Evaboot Polling',
		},
		inputs: [],
		outputs: [{ displayName: '', type: NodeConnectionType.Main }],
		credentials: [
			{
				name: 'evabootApi',
				required: true,
			},
		],
		polling: true,
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Email Finder Job',
						value: 'emailFinder',
					},
					{
						name: 'Email Validation Job',
						value: 'emailValidation',
					},
					{
						name: 'LinkedIn Extraction',
						value: 'linkedinExtractions',
					},
				],
				default: 'emailFinder',
			},
			{
				displayName: 'Trigger On',
				name: 'triggerOn',
				type: 'options',
				options: [
					{
						name: 'Completed Jobs',
						value: 'completed',
						description: 'Trigger when jobs are completed',
					},
					{
						name: 'Failed Jobs',
						value: 'failed',
						description: 'Trigger when jobs fail',
					},
					{
						name: 'Any Status Change',
						value: 'any',
						description: 'Trigger on any job status change',
					},
				],
				default: 'completed',
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const resource = this.getNodeParameter('resource') as string;
		const triggerOn = this.getNodeParameter('triggerOn') as string;

		let endpoint = '';
		switch (resource) {
			case 'emailFinder':
				endpoint = '/v1/email-finder/';
				break;
			case 'emailValidation':
				endpoint = '/v1/email-validation/';
				break;
			case 'linkedinExtractions':
				endpoint = '/v1/extractions/';
				break;
		}

		const staticData = this.getWorkflowStaticData('node');
		if (!staticData.lastPollTime) {
			staticData.lastPollTime = new Date().toISOString();
			staticData.processedJobs = [];
		}

		const poll = async () => {
			try {
				const response = await this.helpers.requestWithAuthentication.call(
					this,
					'evabootApi',
					{
						method: 'GET',
						url: endpoint,
						qs: {
							created_at__gte: staticData.lastPollTime,
							ordering: '-created_at',
						},
					},
				);

				const jobs = Array.isArray(response) ? response : response.results || [];
				const processedJobs = (staticData.processedJobs as string[]) || [];
				const newJobs = jobs.filter((job: IDataObject) => {
					const jobId = job.id as string;
					const jobStatus = job.status as string;

					// Skip if already processed
					if (processedJobs.includes(jobId)) {
						return false;
					}

					// Check trigger conditions
					if (triggerOn === 'completed' && jobStatus !== 'complete') {
						return false;
					}
					if (triggerOn === 'failed' && jobStatus !== 'failed') {
						return false;
					}

					// Mark as processed
					processedJobs.push(jobId);
					return true;
				});

				if (newJobs.length > 0) {
					staticData.lastPollTime = new Date().toISOString();
					this.emit([this.helpers.returnJsonArray(newJobs)]);
				}
			} catch (error) {
				this.emit([this.helpers.returnJsonArray([{ error: error.message }])]);
			}
		};

		// Initial poll
		await poll();

		// Manual trigger function
		const manualTriggerFunction = async () => {
			await poll();
		};

		// Cleanup function
		const closeFunction = async () => {
			// Cleanup logic if needed
		};

		return {
			closeFunction,
			manualTriggerFunction,
		};
	}
}