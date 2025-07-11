import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

export class EvabootWait implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Evaboot Wait',
		name: 'evabootWait',
		icon: 'file:evaboot.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"]}}',
		description: 'Waits for Evaboot jobs to complete before continuing',
		defaults: {
			name: 'Evaboot Wait',
		},
		inputs: [{ displayName: '', type: NodeConnectionType.Main }],
		outputs: [{ displayName: '', type: NodeConnectionType.Main }],
		credentials: [
			{
				name: 'evabootApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Email Finder',
						value: 'emailFinder',
					},
					{
						name: 'Email Validation',
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
				displayName: 'Job ID Source',
				name: 'jobIdSource',
				type: 'options',
				options: [
					{
						name: 'From Previous Node',
						value: 'previous',
						description: 'Get job ID from previous node output',
					},
					{
						name: 'Manual Input',
						value: 'manual',
						description: 'Enter job ID manually',
					},
				],
				default: 'previous',
			},
			{
				displayName: 'Job ID Field',
				name: 'jobIdField',
				type: 'string',
				displayOptions: {
					show: {
						jobIdSource: ['previous'],
					},
				},
				default: 'id',
				description: 'Field name containing the job ID in previous node output',
			},
			{
				displayName: 'Job ID',
				name: 'jobId',
				type: 'string',
				displayOptions: {
					show: {
						jobIdSource: ['manual'],
					},
				},
				default: '',
				description: 'ID of the job to wait for',
				required: true,
			},
			{
				displayName: 'Max Wait Time (Minutes)',
				name: 'maxWaitTime',
				type: 'number',
				default: 30,
				description: 'Maximum time to wait for job completion',
				typeOptions: {
					minValue: 1,
					maxValue: 240,
				},
			},
			{
				displayName: 'Check Interval (Seconds)',
				name: 'checkInterval',
				type: 'number',
				default: 30,
				description: 'How often to check job status',
				typeOptions: {
					minValue: 5,
					maxValue: 300,
				},
			},
			{
				displayName: 'Return Job Data',
				name: 'returnJobData',
				type: 'boolean',
				default: true,
				description: 'Whether to return the complete job data when finished',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const jobIdSource = this.getNodeParameter('jobIdSource', i) as string;
				const maxWaitTime = this.getNodeParameter('maxWaitTime', i) as number;
				const checkInterval = this.getNodeParameter('checkInterval', i) as number;
				const returnJobData = this.getNodeParameter('returnJobData', i) as boolean;

				let jobId: string;

				if (jobIdSource === 'previous') {
					const jobIdField = this.getNodeParameter('jobIdField', i) as string;
					jobId = items[i].json[jobIdField] as string;
				} else {
					jobId = this.getNodeParameter('jobId', i) as string;
				}

				if (!jobId) {
					throw new NodeOperationError(this.getNode(), 'Job ID is required');
				}

				let endpoint = '';
				switch (resource) {
					case 'emailFinder':
						endpoint = `/v1/email-finder/${jobId}/`;
						break;
					case 'emailValidation':
						endpoint = `/v1/email-validation/${jobId}/`;
						break;
					case 'linkedinExtractions':
						endpoint = `/v1/extractions/${jobId}/`;
						break;
				}

				const startTime = Date.now();
				const maxWaitMs = maxWaitTime * 60 * 1000;
				const checkIntervalMs = checkInterval * 1000;

				let jobData: IDataObject = {};
				let isComplete = false;

				while (!isComplete && Date.now() - startTime < maxWaitMs) {
					const response = await this.helpers.requestWithAuthentication.call(
						this,
						'evabootApi',
						{
							method: 'GET',
							url: endpoint,
						},
					);

					jobData = response as IDataObject;
					const status = jobData.status as string;

					if (status === 'complete') {
						isComplete = true;
					} else if (status === 'failed' || status === 'cancelled') {
						throw new NodeOperationError(
							this.getNode(),
							`Job ${jobId} ${status}: ${jobData.error_message || 'Unknown error'}`,
						);
					}

					if (!isComplete) {
						// Wait for the specified interval
						const endTime = Date.now() + checkIntervalMs;
						while (Date.now() < endTime) {
							// Simple busy wait - not ideal but works for now
						}
					}
				}

				if (!isComplete) {
					throw new NodeOperationError(
						this.getNode(),
						`Job ${jobId} did not complete within ${maxWaitTime} minutes`,
					);
				}

				if (returnJobData) {
					returnData.push(jobData);
				} else {
					returnData.push({ jobId, status: 'complete', waitTime: Date.now() - startTime });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ error: error.message });
					continue;
				}
				throw error;
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}