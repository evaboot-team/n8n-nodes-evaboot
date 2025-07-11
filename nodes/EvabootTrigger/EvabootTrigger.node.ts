import {
	IHookFunctions,
	IWebhookFunctions,
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	NodeConnectionType,
} from 'n8n-workflow';

export class EvabootTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Evaboot Trigger',
		name: 'evabootTrigger',
		icon: 'file:evaboot.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"]}}',
		description: 'Starts the workflow when Evaboot jobs complete',
		defaults: {
			name: 'Evaboot Trigger',
		},
		inputs: [],
		outputs: [{ displayName: '', type: NodeConnectionType.Main }],
		credentials: [
			{
				name: 'evabootApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'events',
				type: 'multiOptions',
				options: [
					{
						name: 'Email Finder Job Complete',
						value: 'email_finder_complete',
						description: 'Triggers when an email finder job completes',
					},
					{
						name: 'Email Validation Job Complete',
						value: 'email_validation_complete',
						description: 'Triggers when an email validation job completes',
					},
					{
						name: 'LinkedIn Extraction Complete',
						value: 'extraction_complete',
						description: 'Triggers when a LinkedIn extraction completes',
					},
				],
				default: ['email_finder_complete'],
				required: true,
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				return webhookData.webhookId !== undefined;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const events = this.getNodeParameter('events') as string[];

				// Store webhook info for later deletion
				webhookData.webhookId = `evaboot_${Date.now()}`;
				webhookData.events = events;

				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				delete webhookData.webhookId;
				delete webhookData.webhookUrl;
				delete webhookData.events;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData() as IDataObject;
		const events = this.getNodeParameter('events') as string[];

		// Extract event type from webhook payload
		const eventType = EvabootTrigger.determineEventType(bodyData);

		// Only process if it's an event we're listening for
		if (events.includes(eventType)) {
			return {
				workflowData: [this.helpers.returnJsonArray([bodyData])],
			};
		}

		// Return empty response if not interested in this event
		return {
			workflowData: [this.helpers.returnJsonArray([])],
		};
	}

	static determineEventType(data: IDataObject): string {
		// Determine event type based on webhook payload structure
		if (data.job_type === 'email_finder') {
			return 'email_finder_complete';
		} else if (data.job_type === 'email_validation') {
			return 'email_validation_complete';
		} else if (data.extraction_type || data.url) {
			return 'extraction_complete';
		}
		return 'unknown';
	}
}