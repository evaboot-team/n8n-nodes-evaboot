import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	NodeConnectionType,
} from 'n8n-workflow';

export class Evaboot implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Evaboot',
		name: 'evaboot',
		icon: 'file:evaboot.svg',
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Evaboot API for email finding, validation, and LinkedIn extractions',
		defaults: {
			name: 'Evaboot',
		},
		inputs: [{ displayName: '', type: NodeConnectionType.Main }],
		outputs: [{ displayName: '', type: NodeConnectionType.Main }],
		credentials: [
			{
				name: 'evabootApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://api.evaboot.com',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
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
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['emailFinder'],
					},
				},
				options: [
					{
						name: 'Create Job',
						value: 'create',
						description: 'Create a new email finder job',
						action: 'Create an email finder job',
					},
					{
						name: 'Get Job',
						value: 'get',
						description: 'Get details of an email finder job',
						action: 'Get an email finder job',
					},
					{
						name: 'List Jobs',
						value: 'list',
						description: 'List all email finder jobs',
						action: 'List email finder jobs',
					},
				],
				default: 'create',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['emailValidation'],
					},
				},
				options: [
					{
						name: 'Create Job',
						value: 'create',
						description: 'Create a new email validation job',
						action: 'Create an email validation job',
					},
					{
						name: 'Get Job',
						value: 'get',
						description: 'Get details of an email validation job',
						action: 'Get an email validation job',
					},
					{
						name: 'List Jobs',
						value: 'list',
						description: 'List all email validation jobs',
						action: 'List email validation jobs',
					},
				],
				default: 'create',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['linkedinExtractions'],
					},
				},
				options: [
					{
						name: 'Create Extraction',
						value: 'create',
						description: 'Create a new LinkedIn extraction',
						action: 'Create a linked in extraction',
					},
					{
						name: 'Get Extraction',
						value: 'get',
						description: 'Get details of a LinkedIn extraction',
						action: 'Get a linked in extraction',
					},
					{
						name: 'List Extractions',
						value: 'list',
						description: 'List all LinkedIn extractions',
						action: 'List linked in extractions',
					},
				],
				default: 'create',
			},
			// Email Finder fields
			{
				displayName: 'First Name',
				name: 'firstName',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['emailFinder'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'First name of the person',
				required: true,
			},
			{
				displayName: 'Last Name',
				name: 'lastName',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['emailFinder'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'Last name of the person',
				required: true,
			},
			{
				displayName: 'Company Name',
				name: 'companyName',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['emailFinder'],
						operation: ['create'],
					},
				},
				default: '',
				required: true,
			},
			{
				displayName: 'Company Domain',
				name: 'companyDomain',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['emailFinder'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'Company domain (optional)',
			},
			{
				displayName: 'Job ID',
				name: 'jobId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['emailFinder'],
						operation: ['get'],
					},
				},
				default: '',
				description: 'ID of the email finder job',
				required: true,
			},
			// Email Validation fields
			{
				displayName: 'Email Address',
				name: 'emailAddress',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['emailValidation'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'Email address to validate',
				required: true,
			},
			{
				displayName: 'Job ID',
				name: 'jobId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['emailValidation'],
						operation: ['get'],
					},
				},
				default: '',
				description: 'ID of the email validation job',
				required: true,
			},
			// LinkedIn Extractions fields
			{
				displayName: 'LinkedIn URL',
				name: 'linkedinUrl',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['linkedinExtractions'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'LinkedIn Sales Navigator search URL or profile URL',
				required: true,
			},
			{
				displayName: 'Extraction ID',
				name: 'extractionId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['linkedinExtractions'],
						operation: ['get'],
					},
				},
				default: '',
				description: 'ID of the LinkedIn extraction',
				required: true,
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				let responseData;

				if (resource === 'emailFinder') {
					if (operation === 'create') {
						const firstName = this.getNodeParameter('firstName', i) as string;
						const lastName = this.getNodeParameter('lastName', i) as string;
						const companyName = this.getNodeParameter('companyName', i) as string;
						const companyDomain = this.getNodeParameter('companyDomain', i) as string;

						const body: IDataObject = {
							first_name: firstName,
							last_name: lastName,
							company_name: companyName,
						};

						if (companyDomain) {
							body.company_domain = companyDomain;
						}

						responseData = await this.helpers.requestWithAuthentication.call(
							this,
							'evabootApi',
							{
								method: 'POST',
								url: '/v1/email-finder/',
								body,
							},
						);
					} else if (operation === 'get') {
						const jobId = this.getNodeParameter('jobId', i) as string;

						responseData = await this.helpers.requestWithAuthentication.call(
							this,
							'evabootApi',
							{
								method: 'GET',
								url: `/v1/email-finder/${jobId}/`,
							},
						);
					} else if (operation === 'list') {
						responseData = await this.helpers.requestWithAuthentication.call(
							this,
							'evabootApi',
							{
								method: 'GET',
								url: '/v1/email-finder/',
							},
						);
					}
				} else if (resource === 'emailValidation') {
					if (operation === 'create') {
						const emailAddress = this.getNodeParameter('emailAddress', i) as string;

						const body: IDataObject = {
							email: emailAddress,
						};

						responseData = await this.helpers.requestWithAuthentication.call(
							this,
							'evabootApi',
							{
								method: 'POST',
								url: '/v1/email-validation/',
								body,
							},
						);
					} else if (operation === 'get') {
						const jobId = this.getNodeParameter('jobId', i) as string;

						responseData = await this.helpers.requestWithAuthentication.call(
							this,
							'evabootApi',
							{
								method: 'GET',
								url: `/v1/email-validation/${jobId}/`,
							},
						);
					} else if (operation === 'list') {
						responseData = await this.helpers.requestWithAuthentication.call(
							this,
							'evabootApi',
							{
								method: 'GET',
								url: '/v1/email-validation/',
							},
						);
					}
				} else if (resource === 'linkedinExtractions') {
					if (operation === 'create') {
						const linkedinUrl = this.getNodeParameter('linkedinUrl', i) as string;

						const body: IDataObject = {
							url: linkedinUrl,
						};

						responseData = await this.helpers.requestWithAuthentication.call(
							this,
							'evabootApi',
							{
								method: 'POST',
								url: '/v1/extractions/',
								body,
							},
						);
					} else if (operation === 'get') {
						const extractionId = this.getNodeParameter('extractionId', i) as string;

						responseData = await this.helpers.requestWithAuthentication.call(
							this,
							'evabootApi',
							{
								method: 'GET',
								url: `/v1/extractions/${extractionId}/`,
							},
						);
					} else if (operation === 'list') {
						responseData = await this.helpers.requestWithAuthentication.call(
							this,
							'evabootApi',
							{
								method: 'GET',
								url: '/v1/extractions/',
							},
						);
					}
				}

				if (Array.isArray(responseData)) {
					returnData.push.apply(returnData, responseData as IDataObject[]);
				} else {
					returnData.push(responseData as IDataObject);
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