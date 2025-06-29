import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

interface BasicAuthConfig {
	username: string;
	password: string;
	protectedRoute: string;
	realm?: string;
}

export const setupBasicAuthBullBoard = (
	fastify: FastifyInstance,
	config: BasicAuthConfig,
) => {
	const {
		username,
		password,
		protectedRoute,
		realm = 'Protected Area',
	} = config;

	fastify.addHook(
		'onRequest',
		(req: FastifyRequest, res: FastifyReply, done) => {
			if (!req.url.startsWith(`/${protectedRoute}`)) {
				done();
				return;
			}

			const auth = req.headers.authorization;

			if (!auth?.startsWith('Basic ')) {
				res.header('WWW-Authenticate', `Basic realm="${realm}"`);
				res.code(401).send({
					error: 'Unauthorized',
					statusCode: 401,
					success: false,
					message: 'Basic authentication required',
				});
				return;
			}

			try {
				const credentials = Buffer.from(auth.substring(6), 'base64').toString();
				const [user, pass] = credentials.split(':');

				if (user !== username || pass !== password) {
					res.header('WWW-Authenticate', `Basic realm="${realm}"`);
					res.code(401).send({
						error: 'Unauthorized',
						statusCode: 401,
						success: false,
						message: 'Invalid credentials',
					});
					return;
				}

				done();
			} catch {
				res.header('WWW-Authenticate', `Basic realm="${realm}"`);
				res.code(401).send({
					error: 'Unauthorized',
					statusCode: 401,
					success: false,
					message: 'Invalid authorization header',
				});
			}
		},
	);
};
