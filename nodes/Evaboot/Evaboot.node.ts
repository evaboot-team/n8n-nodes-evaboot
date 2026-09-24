import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';

export class Evaboot implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Evaboot',
		name: 'evaboot',
		icon: 'file:evaboot.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Extract LinkedIn data and find emails with Evaboot',
		defaults: { name: 'Evaboot' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'evabootApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: '={{$credentials.baseUrl}}/v1',
			headers: {
				'Content-Type': 'application/json',
			},
		},
		properties: [
			// ── Resource selector ──
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Extraction', value: 'extraction' },
					{ name: 'Email Finder', value: 'emailFinder' },
					{ name: 'Email Validation', value: 'emailValidation' },
					{ name: 'Account', value: 'account' },
				],
				default: 'extraction',
			},

			// ═══════════════════════════════════════
			// Extraction operations
			// ═══════════════════════════════════════
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['extraction'] } },
				options: [
					{
						name: 'Create Profile Extraction',
						value: 'createProfiles',
						action: 'Create a profile extraction',
						description: 'Extract specific LinkedIn profiles by URL or ID',
						routing: {
							request: { method: 'POST', url: '/extractions/profiles/' },
						},
					},
					{
						name: 'Create Single Profile Extraction',
						value: 'createSingle',
						action: 'Create a single profile extraction',
						description: 'Extract a single LinkedIn profile',
						routing: {
							request: { method: 'POST', url: '/extractions/single/' },
						},
					},
					{
						name: 'Create URL Extraction',
						value: 'createUrl',
						action: 'Create a URL extraction',
						description: 'Extract profiles from a LinkedIn Sales Navigator URL',
						routing: {
							request: { method: 'POST', url: '/extractions/url/' },
						},
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get an extraction',
						description: 'Get extraction details and results',
						routing: {
							request: {
								method: 'GET',
								url: '=/extractions/{{$parameter.extractionId}}/',
							},
						},
					},
					{
						name: 'List',
						value: 'list',
						action: 'List extractions',
						description: 'List all extractions',
						routing: {
							request: { method: 'GET', url: '/extractions/' },
						},
					},
				],
				default: 'createUrl',
			},

			// Extraction fields: linkedin_url
			{
				displayName: 'LinkedIn URL',
				name: 'linkedinUrl',
				type: 'string',
				required: true,
				default: '',
				description: 'LinkedIn Sales Navigator search or list URL to extract data from',
				displayOptions: {
					show: { resource: ['extraction'], operation: ['createUrl'] },
				},
				routing: {
					send: { type: 'body', property: 'linkedin_url' },
				},
			},
			// Extraction fields: search_name (URL + profiles)
			{
				displayName: 'Search Name',
				name: 'searchName',
				type: 'string',
				required: true,
				default: '',
				description: 'Name for the extraction, used for identification',
				displayOptions: {
					show: { resource: ['extraction'], operation: ['createUrl', 'createProfiles'] },
				},
				routing: {
					send: { type: 'body', property: 'search_name' },
				},
			},
			// Extraction fields: profile_ids (profiles extraction)
			{
				displayName: 'Profile IDs',
				name: 'profileIds',
				type: 'string',
				required: true,
				default: '',
				description:
					'Comma-separated list of LinkedIn profile URLs or IDs to extract',
				displayOptions: {
					show: { resource: ['extraction'], operation: ['createProfiles'] },
				},
				routing: {
					send: {
						type: 'body',
						property: 'profile_ids',
						value: '={{$value.split(",").map(id => id.trim()).filter(id => id)}}',
					},
				},
			},
			// Extraction fields: profile_id (single extraction)
			{
				displayName: 'Profile ID',
				name: 'profileId',
				type: 'string',
				required: true,
				default: '',
				description: 'LinkedIn profile URL or ID to extract',
				displayOptions: {
					show: { resource: ['extraction'], operation: ['createSingle'] },
				},
				routing: {
					send: { type: 'body', property: 'profile_id' },
				},
			},
			// Extraction fields: webhook_url (URL + profiles)
			{
				displayName: 'Webhook URL',
				name: 'webhookUrl',
				type: 'string',
				default: '',
				description: 'URL to receive a webhook notification when extraction completes',
				displayOptions: {
					show: {
						resource: ['extraction'],
						operation: ['createUrl', 'createProfiles'],
					},
				},
				routing: {
					send: {
						type: 'body',
						property: 'webhook_url',
						value: '={{$value || undefined}}',
					},
				},
			},
			// Extraction fields: enrich_email (all create operations)
			{
				displayName: 'Enrich Email',
				name: 'enrichEmail',
				type: 'options',
				default: 'none',
				description: 'Email enrichment option',
				displayOptions: {
					show: {
						resource: ['extraction'],
						operation: ['createUrl', 'createProfiles', 'createSingle'],
					},
				},
				options: [
					{ name: 'None', value: 'none' },
					{ name: 'Matching', value: 'matching' },
					{ name: 'All', value: 'all' },
				],
				routing: {
					send: { type: 'body', property: 'enrich_email' },
				},
			},
			// Extraction fields: id (get)
			{
				displayName: 'Extraction ID',
				name: 'extractionId',
				type: 'string',
				required: true,
				default: '',
				description: 'ID of the extraction to retrieve',
				displayOptions: {
					show: { resource: ['extraction'], operation: ['get'] },
				},
			},

			// ═══════════════════════════════════════
			// Email Finder operations
			// ═══════════════════════════════════════
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['emailFinder'] } },
				options: [
					{
						name: 'Create Bulk Job',
						value: 'createBulk',
						action: 'Create a bulk email finder job',
						description: 'Find emails for multiple prospects',
						routing: {
							request: { method: 'POST', url: '/email-finder/' },
						},
					},
					{
						name: 'Find Single Email',
						value: 'findSingle',
						action: 'Find a single email',
						description: 'Find an email for a single person',
						routing: {
							request: { method: 'POST', url: '/email-finder/single/' },
						},
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get an email finder job',
						description: 'Get email finder job details and results',
						routing: {
							request: {
								method: 'GET',
								url: '=/email-finder/{{$parameter.jobId}}/',
							},
						},
					},
					{
						name: 'List',
						value: 'list',
						action: 'List email finder jobs',
						description: 'List all email finder jobs',
						routing: {
							request: { method: 'GET', url: '/email-finder/' },
						},
					},
				],
				default: 'findSingle',
			},

			// Email Finder fields: job_name (bulk)
			{
				displayName: 'Job Name',
				name: 'jobName',
				type: 'string',
				required: true,
				default: '',
				description: 'Name for the email finder job',
				displayOptions: {
					show: { resource: ['emailFinder'], operation: ['createBulk'] },
				},
				routing: {
					send: { type: 'body', property: 'job_name' },
				},
			},
			// Email Finder fields: webhook_url (bulk)
			{
				displayName: 'Webhook URL',
				name: 'emailFinderWebhookUrl',
				type: 'string',
				default: '',
				description: 'URL to receive a webhook notification when job completes',
				displayOptions: {
					show: { resource: ['emailFinder'], operation: ['createBulk'] },
				},
				routing: {
					send: {
						type: 'body',
						property: 'webhook_url',
						value: '={{$value || undefined}}',
					},
				},
			},
			// Email Finder fields: prospects (bulk)
			{
				displayName: 'Prospects',
				name: 'prospects',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: {},
				description: 'Prospects to find emails for',
				displayOptions: {
					show: { resource: ['emailFinder'], operation: ['createBulk'] },
				},
				options: [
					{
						displayName: 'Prospect',
						name: 'prospect',
						values: [
							{
								displayName: 'First Name',
								name: 'first_name',
								type: 'string',
								required: true,
								default: '',
							},
							{
								displayName: 'Last Name',
								name: 'last_name',
								type: 'string',
								required: true,
								default: '',
							},
							{
								displayName: 'Company Name',
								name: 'company_name',
								type: 'string',
								default: '',
								description:
									'Name of the company (required if company domain not provided)',
							},
							{
								displayName: 'Company Domain',
								name: 'company_domain',
								type: 'string',
								default: '',
								description:
									'Domain of the company (required if company name not provided)',
							},
						],
					},
				],
				routing: {
					send: {
						type: 'body',
						property: 'prospects',
						value: '={{$value.prospect}}',
					},
				},
			},
			// Email Finder fields: single person fields
			{
				displayName: 'First Name',
				name: 'firstName',
				type: 'string',
				required: true,
				default: '',
				description: 'First name of the person',
				displayOptions: {
					show: { resource: ['emailFinder'], operation: ['findSingle'] },
				},
				routing: {
					send: { type: 'body', property: 'first_name' },
				},
			},
			{
				displayName: 'Last Name',
				name: 'lastName',
				type: 'string',
				required: true,
				default: '',
				description: 'Last name of the person',
				displayOptions: {
					show: { resource: ['emailFinder'], operation: ['findSingle'] },
				},
				routing: {
					send: { type: 'body', property: 'last_name' },
				},
			},
			{
				displayName: 'Company Name',
				name: 'companyName',
				type: 'string',
				default: '',
				description: 'Name of the company (required if company domain not provided)',
				displayOptions: {
					show: { resource: ['emailFinder'], operation: ['findSingle'] },
				},
				routing: {
					send: {
						type: 'body',
						property: 'company_name',
						value: '={{$value || undefined}}',
					},
				},
			},
			{
				displayName: 'Company Domain',
				name: 'companyDomain',
				type: 'string',
				default: '',
				description: 'Domain of the company (required if company name not provided)',
				displayOptions: {
					show: { resource: ['emailFinder'], operation: ['findSingle'] },
				},
				routing: {
					send: {
						type: 'body',
						property: 'company_domain',
						value: '={{$value || undefined}}',
					},
				},
			},
			// Email Finder fields: job ID (get)
			{
				displayName: 'Job ID',
				name: 'jobId',
				type: 'string',
				required: true,
				default: '',
				description: 'ID of the email finder job to retrieve',
				displayOptions: {
					show: { resource: ['emailFinder'], operation: ['get'] },
				},
			},

			// ═══════════════════════════════════════
			// Email Validation operations
			// ═══════════════════════════════════════
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['emailValidation'] } },
				options: [
					{
						name: 'Create Bulk Job',
						value: 'createBulk',
						action: 'Create a bulk email validation job',
						description: 'Validate multiple email addresses',
						routing: {
							request: { method: 'POST', url: '/email-validation/' },
						},
					},
					{
						name: 'Validate Single Email',
						value: 'validateSingle',
						action: 'Validate a single email',
						description: 'Validate a single email address',
						routing: {
							request: { method: 'POST', url: '/email-validation/single/' },
						},
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get an email validation job',
						description: 'Get email validation job details and results',
						routing: {
							request: {
								method: 'GET',
								url: '=/email-validation/{{$parameter.validationJobId}}/',
							},
						},
					},
					{
						name: 'List',
						value: 'list',
						action: 'List email validation jobs',
						description: 'List all email validation jobs',
						routing: {
							request: { method: 'GET', url: '/email-validation/' },
						},
					},
				],
				default: 'validateSingle',
			},

			// Email Validation fields: job_name (bulk)
			{
				displayName: 'Job Name',
				name: 'validationJobName',
				type: 'string',
				required: true,
				default: '',
				description: 'Name for the email validation job',
				displayOptions: {
					show: { resource: ['emailValidation'], operation: ['createBulk'] },
				},
				routing: {
					send: { type: 'body', property: 'job_name' },
				},
			},
			// Email Validation fields: webhook_url (bulk)
			{
				displayName: 'Webhook URL',
				name: 'validationWebhookUrl',
				type: 'string',
				default: '',
				description: 'URL to receive a webhook notification when job completes',
				displayOptions: {
					show: { resource: ['emailValidation'], operation: ['createBulk'] },
				},
				routing: {
					send: {
						type: 'body',
						property: 'webhook_url',
						value: '={{$value || undefined}}',
					},
				},
			},
			// Email Validation fields: prospects (bulk)
			{
				displayName: 'Emails',
				name: 'validationProspects',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: {},
				description: 'Email addresses to validate',
				displayOptions: {
					show: { resource: ['emailValidation'], operation: ['createBulk'] },
				},
				options: [
					{
						displayName: 'Email',
						name: 'prospect',
						values: [
							{
								displayName: 'Email',
								name: 'email',
								type: 'string',
								required: true,
								default: '',
								placeholder: 'name@example.com',
							},
						],
					},
				],
				routing: {
					send: {
						type: 'body',
						property: 'prospects',
						value: '={{$value.prospect}}',
					},
				},
			},
			// Email Validation fields: single email
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'name@example.com',
				description: 'Email address to validate',
				displayOptions: {
					show: { resource: ['emailValidation'], operation: ['validateSingle'] },
				},
				routing: {
					send: { type: 'body', property: 'email' },
				},
			},
			// Email Validation fields: job ID (get)
			{
				displayName: 'Job ID',
				name: 'validationJobId',
				type: 'string',
				required: true,
				default: '',
				description: 'ID of the email validation job to retrieve',
				displayOptions: {
					show: { resource: ['emailValidation'], operation: ['get'] },
				},
			},

			// ═══════════════════════════════════════
			// Account operations
			// ═══════════════════════════════════════
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['account'] } },
				options: [
					{
						name: 'Get Quota',
						value: 'getQuota',
						action: 'Get account quota',
						description: 'Get current account quota and usage',
						routing: {
							request: { method: 'GET', url: '/quota/' },
						},
					},
				],
				default: 'getQuota',
			},
		],
	};
}
