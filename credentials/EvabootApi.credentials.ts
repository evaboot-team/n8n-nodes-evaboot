import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class EvabootApi implements ICredentialType {
	name = 'evabootApi';

	displayName = 'Evaboot API';

	documentationUrl = 'https://docs.evaboot.com/api';

	icon = { light: 'file:../nodes/Evaboot/evaboot.svg', dark: 'file:../nodes/Evaboot/evaboot.svg' } as const;

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Your Evaboot API key from the dashboard Settings page',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.evaboot.com',
			description: 'API base URL (change for staging/testing)',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/v1/quota/',
			method: 'GET',
		},
	};
}
