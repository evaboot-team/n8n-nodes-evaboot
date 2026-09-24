import type {
	IDataObject,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, randomString } from 'n8n-workflow';

const SECRET_HEADER = 'x-evaboot-secret';

const KINDS: Record<string, string> = {
	exportFinished: 'export',
	emailFinderFinished: 'email_finder',
	emailVerificationFinished: 'email_validation',
};

interface Registration extends IDataObject {
	id: string;
	secret: string;
	event: string;
}

type HookContext = IHookFunctions | IWebhookFunctions;

function registrations(ctx: HookContext): Record<string, Registration> {
	const data = ctx.getWorkflowStaticData('node');
	if (!data.registrations) data.registrations = {};
	return data.registrations as Record<string, Registration>;
}

async function evabootRequest(
	ctx: IHookFunctions,
	method: IHttpRequestMethods,
	path: string,
	body?: IDataObject,
) {
	const credentials = await ctx.getCredentials('evabootApi');
	const options: IHttpRequestOptions = {
		method,
		url: `${credentials.baseUrl as string}/v1/integrations/${path}`,
		body,
		json: true,
		returnFullResponse: true,
		ignoreHttpStatusErrors: true,
	};
	return (await ctx.helpers.httpRequestWithAuthentication.call(ctx, 'evabootApi', options)) as {
		statusCode: number;
		body: IDataObject;
	};
}

export class EvabootTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Evaboot Trigger',
		name: 'evabootTrigger',
		icon: 'file:evaboot.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Starts the workflow when an Evaboot export or email job finishes',
		defaults: { name: 'Evaboot Trigger' },
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'evabootApi', required: true }],
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
				name: 'event',
				type: 'options',
				required: true,
				noDataExpression: true,
				options: [
					{
						name: 'Email Finder Job Finished',
						value: 'emailFinderFinished',
						description: 'A bulk email finder job completes',
					},
					{
						name: 'Email Verification Job Finished',
						value: 'emailVerificationFinished',
						description: 'A bulk email verification job completes',
					},
					{
						name: 'Export Finished',
						value: 'exportFinished',
						description: 'A Sales Navigator export completes',
					},
				],
				default: 'exportFinished',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const url = this.getNodeWebhookUrl('default') as string;
				const saved = registrations(this)[url];
				if (!saved) return false;
				// On an event change, create replaces the saved destination.
				if (saved.event !== (this.getNodeParameter('event') as string)) return false;
				const response = await evabootRequest(this, 'GET', '');
				if (response.statusCode !== 200) return false;
				const rows = (response.body.integrations ?? []) as IDataObject[];
				// A destination Evaboot turned off stays saved, so create removes it first.
				return rows.some((row) => row.id === saved.id && row.status === 'active');
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const url = this.getNodeWebhookUrl('default') as string;
				const event = this.getNodeParameter('event') as string;
				// Evaboot returns an existing destination for the same URL unchanged, with its
				// old secret and status. Remove the one this node saved so a fresh row is created.
				const saved = registrations(this)[url];
				if (saved) {
					await evabootRequest(this, 'DELETE', `${saved.id}/`);
					delete registrations(this)[url];
				}
				const secret = randomString(40);
				const body: IDataObject = {
					type: 'n8n',
					url,
					auto: true,
					source: 'all',
					header_name: SECRET_HEADER,
					secret,
					kind: KINDS[event],
					label: `n8n: ${this.getWorkflow().name ?? 'workflow'}`,
				};
				const response = await evabootRequest(this, 'POST', '', body);
				const integration = response.body.integration as IDataObject | undefined;
				// 409, a different scope, or an inactive row: a destination this node did not
				// save already uses the URL, and Evaboot will not replace it.
				const taken =
					response.statusCode === 409 ||
					(response.statusCode === 200 &&
						(response.body.scope_unchanged === true || integration?.status !== 'active'));
				if (response.statusCode !== 200 || !integration || taken) {
					throw new NodeApiError(this.getNode(), response.body as never, {
						message: 'Evaboot could not register the webhook',
						description: taken
							? 'Another Evaboot integration already uses this webhook URL. Delete the "n8n: ..." integration for this workflow in the Evaboot dashboard, then activate the workflow again.'
							: undefined,
						httpCode: String(response.statusCode),
					});
				}
				const id = integration.id as string;
				registrations(this)[url] = { id, secret, event };
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const url = this.getNodeWebhookUrl('default') as string;
				const saved = registrations(this)[url];
				if (!saved) return true;
				const response = await evabootRequest(this, 'DELETE', `${saved.id}/`);
				// 404: already gone. 401: API key revoked. Either way deactivation must finish.
				const done = response.statusCode < 300 || [401, 404].includes(response.statusCode);
				if (done) delete registrations(this)[url];
				return done;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const url = this.getNodeWebhookUrl('default') as string;
		const saved = registrations(this)[url];
		const received = this.getHeaderData()[SECRET_HEADER];
		if (!saved || received !== saved.secret) {
			this.getResponseObject().status(401).send('Unauthorized').end();
			return { noWebhookResponse: true };
		}
		return { workflowData: [this.helpers.returnJsonArray(this.getBodyData())] };
	}
}
