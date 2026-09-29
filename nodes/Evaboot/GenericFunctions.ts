import {
	NodeApiError,
	sleep,
	type IDataObject,
	type IExecuteSingleFunctions,
	type IN8nHttpFullResponse,
	type INodeExecutionData,
	type JsonObject,
} from 'n8n-workflow';

const POLL_INTERVAL_MS = 4000;
const RUNNING_STATUSES = ['pending', 'running'];

/** The single-email routes answer 202 with a job id past ~25 s; the job route finishes it. */
const JOB_PATHS: Record<string, string> = {
	findSingle: 'email-finder',
	validateSingle: 'email-validation',
};

export function isRunning(body: IDataObject): boolean {
	return (
		typeof body.job_id === 'string' &&
		body.prospect === undefined &&
		RUNNING_STATUSES.includes(String(body.status))
	);
}

/** Give a finished job the same shape the single route returns when it answers in time. */
export function toSingleResult(operation: string, jobId: string, job: IDataObject): IDataObject {
	const prospects = (job.prospects as IDataObject[] | undefined) ?? [];
	const prospect = prospects[0] ?? {};
	const failed = prospect.status === 'failed';
	if (operation === 'findSingle') {
		const found = Boolean(prospect.found_email);
		return {
			success: !failed,
			job_id: jobId,
			prospect: {
				...prospect,
				status: found ? 'complete' : 'failed',
				error_message: found ? null : prospect.error_message || 'Email not found',
			},
		};
	}
	return {
		success: !failed,
		job_id: jobId,
		prospect: {
			...prospect,
			status: failed ? 'failed' : 'complete',
			error_message: failed ? prospect.error_message || 'Validation error' : null,
		},
	};
}

/**
 * When a single find or verify answers "still running", poll the job endpoint
 * until it finishes or the configured wait runs out. On timeout the running
 * payload is returned unchanged.
 */
export async function waitForSingleResult(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
	const body = items[0]?.json;
	if (!body || !isRunning(body)) return items;

	const maxWaitSeconds = this.getNodeParameter('maxWaitSeconds', 150) as number;
	if (!maxWaitSeconds || maxWaitSeconds <= 0) return items;

	const operation = this.getNodeParameter('operation') as string;
	const path = JOB_PATHS[operation];
	if (!path) return items;

	const jobId = body.job_id as string;
	const credentials = await this.getCredentials('evabootApi');
	const baseUrl = String(credentials.baseUrl).replace(/\/+$/, '');
	const deadline = Date.now() + maxWaitSeconds * 1000;

	while (Date.now() + POLL_INTERVAL_MS <= deadline) {
		await sleep(POLL_INTERVAL_MS);

		let response: IN8nHttpFullResponse;
		try {
			response = (await this.helpers.httpRequestWithAuthentication.call(this, 'evabootApi', {
				method: 'GET',
				url: `${baseUrl}/v1/${path}/${encodeURIComponent(jobId)}/`,
				json: true,
				returnFullResponse: true,
			})) as IN8nHttpFullResponse;
		} catch (error) {
			throw new NodeApiError(this.getNode(), error as JsonObject);
		}

		if (response.statusCode === 200) {
			return [{ json: toSingleResult(operation, jobId, response.body as IDataObject) }];
		}
	}

	return items;
}
