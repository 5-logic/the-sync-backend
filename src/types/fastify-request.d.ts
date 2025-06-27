import { UserPayload } from '@/auth/interfaces/user-payload.interface';

declare module 'fastify' {
	interface FastifyRequest {
		user?: UserPayload;
	}
}
