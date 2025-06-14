import { PrismaClient } from '../generated/prisma';
import { hash } from '../src/utils/hash.util';

const prisma = new PrismaClient();

const seedAdmin = async () => {
	await prisma.admin.upsert({
		where: { username: 'admin' },
		update: {},
		create: {
			username: 'admin',
			password: await hash('FPTUniversity@2025'),
		},
	});

	console.log('👤 Admin seeded successfully');
};

const seedMajor = async () => {
	const majors = [
		{ name: 'Software Engineering', code: 'SE' },
		{ name: 'Artificial Intelligence', code: 'AI' },
	];

	const operations = majors.map((major) =>
		prisma.major.upsert({
			where: { code: major.code },
			update: {},
			create: major,
		}),
	);

	await prisma.$transaction(operations);

	console.log('🎓 Major seeded successfully');
};

const seedResponsibility = async () => {
	const responsibilities = [
		// Software Engineering
		{ id: 'a485b1a7-6ce5-4a64-b087-11ef57772897', name: 'Backend' },
		{ id: 'f06a27c3-5ed5-405f-9bd8-469da9992aeb', name: 'Frontend' },
		{ id: 'b8726d62-59b8-4698-97e4-7f71eddbba82', name: 'Fullstack' },
		{ id: 'eb0e7575-63c4-43af-8a36-5385e00d5d86', name: 'DevOps' },
		{ id: '84924449-3d3e-46ff-9080-1e270d83e767', name: 'QA' },
		{ id: '85988b53-0dcb-4102-ba98-2ded21b847ff', name: 'Architect' },
		{ id: '0ecb8cd6-56a0-4281-bf82-ee9ac7e6d153', name: 'PM' },
		{ id: '97d3d7ef-0d95-45cb-afdb-052ef8b3aec2', name: 'BA' },
		{ id: '058a6080-6269-47bf-a34a-02634a5f101f', name: 'UXUI' },

		// Artificial Intelligence
		{ id: '6746805b-f082-47e0-b670-0e9cc8048292', name: 'Data Scientist' },
		{ id: 'a43c3835-d37f-43c2-8a5c-40833c2d076a', name: 'ML Engineer' },
		{ id: '009cd08c-d85a-49e4-9187-91e6fc99174c', name: 'Data Engineer' },
		{ id: 'b5cdf467-c7ef-44ee-9a59-ae4570069e60', name: 'AI Engineer' },
		{ id: 'f2339a1d-8f10-4f2d-84d7-a1afd79cab3e', name: 'AI PM' },
		{ id: '0cc745a1-7de7-4615-8423-35139f6059ef', name: 'AI Ethicist' },
		{ id: '79b37b8f-291e-44dc-bfd2-139935dc8280', name: 'Prompt Engineer' },
		{ id: 'e78f96ed-40eb-4400-bc40-14a4f750e760', name: 'Model Validator' },
		{ id: '6bab02d2-5d26-49d6-97ec-e960c7229e0d', name: 'UX for AI' },
	];

	await prisma.$transaction(
		responsibilities.map((r) =>
			prisma.responsibility.upsert({
				where: { id: r.id },
				update: {},
				create: r,
			}),
		),
	);

	console.log('📋 Responsibilities seeded successfully');
};

const seedSkillSets = async () => {
	const skillSets = [
		// Software Engineering
		{ id: '2f8e4b91-7c3a-4d2e-b156-8a9f1c2d3e4f', name: 'Backend' },
		{ id: '5a1b2c3d-4e5f-6789-abcd-ef1234567890', name: 'Frontend' },
		{ id: '9e8d7c6b-5a49-3827-1605-94837261058f', name: 'Fullstack' },
		{ id: 'c4b3a291-8e7d-6c5b-4a39-28172605948e', name: 'DevOps' },
		{ id: 'f1e2d3c4-b5a6-9786-5432-1098765abcde', name: 'QA' },
		{ id: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654', name: 'Architect' },
		{ id: 'a9b8c7d6-e5f4-3210-9876-543210fedcba', name: 'PM' },
		{ id: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890', name: 'BA' },
		{ id: '8f9e0d1c-2b3a-4958-6776-5544332211aa', name: 'UXUI' },

		// Artificial Intelligence
		{ id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890', name: 'Data Scientist' },
		{ id: '4d5e6f7a-8b9c-0123-4567-890abcdef123', name: 'ML Engineer' },
		{ id: '7a8b9c0d-1e2f-3456-7890-abcdef123456', name: 'Data Engineer' },
		{ id: '0d1e2f3a-4b5c-6789-0123-456789abcdef', name: 'AI Engineer' },
		{ id: '3a4b5c6d-7e8f-9012-3456-789abcdef012', name: 'AI PM' },
		{ id: '6d7e8f9a-0b1c-2345-6789-abcdef012345', name: 'AI Ethicist' },
		{ id: '9a0b1c2d-3e4f-5678-9012-345678901234', name: 'Prompt Engineer' },
		{ id: 'c2d3e4f5-6a7b-8901-2345-678901234567', name: 'Model Validator' },
		{ id: 'f5a6b7c8-9d0e-1234-5678-901234567890', name: 'UX for AI' },
	];

	await prisma.$transaction(
		skillSets.map((ss) =>
			prisma.skillSet.upsert({
				where: { id: ss.id },
				update: { name: ss.name },
				create: ss,
			}),
		),
	);

	console.log('📦 Skill sets seeded successfully');
};

const seedSkills = async () => {
	const skills = [
		// Backend Skills (skillSetId: 2f8e4b91-7c3a-4d2e-b156-8a9f1c2d3e4f)
		{
			id: 'ad93e2ad-e3ca-4e6f-b938-6bb9e0ccbbf8',
			name: 'Node.js',
			skillSetId: '2f8e4b91-7c3a-4d2e-b156-8a9f1c2d3e4f',
		},
		{
			id: '1ed41457-c3a3-43e0-ae36-583990e9d797',
			name: 'Express.js',
			skillSetId: '2f8e4b91-7c3a-4d2e-b156-8a9f1c2d3e4f',
		},
		{
			id: '26efbb7a-1b6d-462f-9b6a-276969596ead',
			name: 'NestJS',
			skillSetId: '2f8e4b91-7c3a-4d2e-b156-8a9f1c2d3e4f',
		},
		{
			id: '5ee511cd-3787-4a06-9206-d67619701a58',
			name: 'Python',
			skillSetId: '2f8e4b91-7c3a-4d2e-b156-8a9f1c2d3e4f',
		},
		{
			id: '20e4de95-39d8-4f68-8533-cdafdaf467e4',
			name: 'Django',
			skillSetId: '2f8e4b91-7c3a-4d2e-b156-8a9f1c2d3e4f',
		},
		{
			id: '1e54af49-b47e-41fb-8e3e-fde62233b2dd',
			name: 'FastAPI',
			skillSetId: '2f8e4b91-7c3a-4d2e-b156-8a9f1c2d3e4f',
		},
		{
			id: 'cc24b473-da0f-4220-a3ff-cc129900cf8d',
			name: 'Java',
			skillSetId: '2f8e4b91-7c3a-4d2e-b156-8a9f1c2d3e4f',
		},
		{
			id: '80d22900-d0c1-4ca7-9370-f005cdf2d842',
			name: 'Spring Boot',
			skillSetId: '2f8e4b91-7c3a-4d2e-b156-8a9f1c2d3e4f',
		},
		{
			id: 'cb72c72b-161a-43a3-9a0f-ab6af2b8c4ff',
			name: 'C#',
			skillSetId: '2f8e4b91-7c3a-4d2e-b156-8a9f1c2d3e4f',
		},
		{
			id: '707c92bb-df74-476f-9fa0-84ad8bc4d3ae',
			name: '.NET Core',
			skillSetId: '2f8e4b91-7c3a-4d2e-b156-8a9f1c2d3e4f',
		},
		{
			id: 'f982813c-57a2-49f1-be3d-95ef79eb5e79',
			name: 'Go',
			skillSetId: '2f8e4b91-7c3a-4d2e-b156-8a9f1c2d3e4f',
		},
		{
			id: '6cc8632a-7ec1-4889-bf8c-b6c9c1381eef',
			name: 'Rust',
			skillSetId: '2f8e4b91-7c3a-4d2e-b156-8a9f1c2d3e4f',
		},
		{
			id: '059c701f-c20c-4443-b72b-67d6c374ee56',
			name: 'PostgreSQL',
			skillSetId: '2f8e4b91-7c3a-4d2e-b156-8a9f1c2d3e4f',
		},
		{
			id: '54ae993c-9e91-4d3a-b5d8-2226d32bde41',
			name: 'MySQL',
			skillSetId: '2f8e4b91-7c3a-4d2e-b156-8a9f1c2d3e4f',
		},
		{
			id: '67db0b48-b0b1-4e14-a436-466f8dd7e216',
			name: 'MongoDB',
			skillSetId: '2f8e4b91-7c3a-4d2e-b156-8a9f1c2d3e4f',
		},
		{
			id: 'd702b709-eef1-42cc-a4c6-927250f0faf2',
			name: 'Redis',
			skillSetId: '2f8e4b91-7c3a-4d2e-b156-8a9f1c2d3e4f',
		},
		{
			id: 'cee2164c-893c-47d4-bbda-ba626d664700',
			name: 'GraphQL',
			skillSetId: '2f8e4b91-7c3a-4d2e-b156-8a9f1c2d3e4f',
		},
		{
			id: '6bbec517-5bc3-4135-8884-f235d7f7d477',
			name: 'REST API',
			skillSetId: '2f8e4b91-7c3a-4d2e-b156-8a9f1c2d3e4f',
		},
		{
			id: '70517221-053d-4033-a401-b74a6c31fbda',
			name: 'Microservices',
			skillSetId: '2f8e4b91-7c3a-4d2e-b156-8a9f1c2d3e4f',
		},
		{
			id: 'c94e948c-a008-4867-aa8a-03a511aa6461',
			name: 'Socket.io',
			skillSetId: '2f8e4b91-7c3a-4d2e-b156-8a9f1c2d3e4f',
		},

		// Frontend Skills (skillSetId: 5a1b2c3d-4e5f-6789-abcd-ef1234567890)
		{
			id: '9bfb3055-5c4e-46a9-a489-acee643ee3ce',
			name: 'HTML',
			skillSetId: '5a1b2c3d-4e5f-6789-abcd-ef1234567890',
		},
		{
			id: '08e78162-180d-4579-8c8f-44a0d184d82b',
			name: 'CSS',
			skillSetId: '5a1b2c3d-4e5f-6789-abcd-ef1234567890',
		},
		{
			id: '5174dd4a-3152-4391-b802-e7bd18e898e8',
			name: 'JavaScript',
			skillSetId: '5a1b2c3d-4e5f-6789-abcd-ef1234567890',
		},
		{
			id: '7ee2bb1c-c44a-4a42-8056-22e77bbceb4c',
			name: 'TypeScript',
			skillSetId: '5a1b2c3d-4e5f-6789-abcd-ef1234567890',
		},
		{
			id: 'a5bf2e7f-8bc0-4f5a-98fd-b7b5ffea0742',
			name: 'React',
			skillSetId: '5a1b2c3d-4e5f-6789-abcd-ef1234567890',
		},
		{
			id: '17651538-2bf1-4186-ba38-e03fa92c593d',
			name: 'Vue.js',
			skillSetId: '5a1b2c3d-4e5f-6789-abcd-ef1234567890',
		},
		{
			id: 'dcdf9596-1ab1-48ba-ac1f-135dee8d9ed4',
			name: 'Angular',
			skillSetId: '5a1b2c3d-4e5f-6789-abcd-ef1234567890',
		},
		{
			id: '41d812c9-9f3b-4ace-a372-baffd283b022',
			name: 'Next.js',
			skillSetId: '5a1b2c3d-4e5f-6789-abcd-ef1234567890',
		},
		{
			id: 'ab918e65-e2df-4f96-b995-51acf3303b72',
			name: 'Nuxt.js',
			skillSetId: '5a1b2c3d-4e5f-6789-abcd-ef1234567890',
		},
		{
			id: 'd663c0d6-9e41-4667-9599-bc3388f27996',
			name: 'Svelte',
			skillSetId: '5a1b2c3d-4e5f-6789-abcd-ef1234567890',
		},
		{
			id: '97e14a65-ecc6-4ed9-a94f-467ade533ba9',
			name: 'Tailwind CSS',
			skillSetId: '5a1b2c3d-4e5f-6789-abcd-ef1234567890',
		},
		{
			id: 'ad2a4cc8-6f29-4458-9031-181bac596317',
			name: 'Bootstrap',
			skillSetId: '5a1b2c3d-4e5f-6789-abcd-ef1234567890',
		},
		{
			id: 'f9acc6da-14ef-4540-aa0e-25893b8acf47',
			name: 'Material UI',
			skillSetId: '5a1b2c3d-4e5f-6789-abcd-ef1234567890',
		},
		{
			id: '2ca32df4-2f41-4eb6-bc58-ba2f7c2e805f',
			name: 'Sass/SCSS',
			skillSetId: '5a1b2c3d-4e5f-6789-abcd-ef1234567890',
		},
		{
			id: '6e925d8c-85c8-403e-9ef6-53eebbd30ed9',
			name: 'Webpack',
			skillSetId: '5a1b2c3d-4e5f-6789-abcd-ef1234567890',
		},
		{
			id: '1f5645e2-cca2-4894-bd05-dc889c50a789',
			name: 'Vite',
			skillSetId: '5a1b2c3d-4e5f-6789-abcd-ef1234567890',
		},
		{
			id: '6f277494-775f-49b1-a16b-d8556a98905c',
			name: 'Redux',
			skillSetId: '5a1b2c3d-4e5f-6789-abcd-ef1234567890',
		},
		{
			id: 'b099601b-028a-4e26-ae9a-326cb3c8f99c',
			name: 'Zustand',
			skillSetId: '5a1b2c3d-4e5f-6789-abcd-ef1234567890',
		},
		{
			id: 'a2342975-5a8f-44a2-bcad-d4b3d2d2fdcf',
			name: 'PWA',
			skillSetId: '5a1b2c3d-4e5f-6789-abcd-ef1234567890',
		},
		{
			id: 'afe68932-1815-4122-933c-1cc92bdbe18f',
			name: 'Web Components',
			skillSetId: '5a1b2c3d-4e5f-6789-abcd-ef1234567890',
		},

		// Fullstack Skills (skillSetId: 9e8d7c6b-5a49-3827-1605-94837261058f)
		{
			id: 'b1eefdea-2f9a-4c7c-b362-7bca838d4670',
			name: 'MEAN Stack',
			skillSetId: '9e8d7c6b-5a49-3827-1605-94837261058f',
		},
		{
			id: '518ea2a9-323b-4493-829c-fb53795f637d',
			name: 'MERN Stack',
			skillSetId: '9e8d7c6b-5a49-3827-1605-94837261058f',
		},
		{
			id: '410bf1ca-5343-47d0-88e0-a2db73f540a9',
			name: 'LAMP Stack',
			skillSetId: '9e8d7c6b-5a49-3827-1605-94837261058f',
		},
		{
			id: '5741d7f5-169b-4b37-be30-e79629483da8',
			name: 'T3 Stack',
			skillSetId: '9e8d7c6b-5a49-3827-1605-94837261058f',
		},
		{
			id: '88888aad-1ca8-439c-952d-d2bd745de4e7',
			name: 'JAMstack',
			skillSetId: '9e8d7c6b-5a49-3827-1605-94837261058f',
		},
		{
			id: 'c9cdd246-54bc-46e0-97d7-a8208d6e4c1d',
			name: 'Serverless',
			skillSetId: '9e8d7c6b-5a49-3827-1605-94837261058f',
		},
		{
			id: '86e68cbd-afbf-4f74-9438-4d8e5b7d8e22',
			name: 'API Integration',
			skillSetId: '9e8d7c6b-5a49-3827-1605-94837261058f',
		},
		{
			id: 'c29c5e97-fac3-4efc-9ecc-6a5dc743cefc',
			name: 'Database Design',
			skillSetId: '9e8d7c6b-5a49-3827-1605-94837261058f',
		},
		{
			id: 'aca84fe8-52e2-4696-b575-1db5b57a54f7',
			name: 'Authentication & Authorization',
			skillSetId: '9e8d7c6b-5a49-3827-1605-94837261058f',
		},
		{
			id: 'be77bf0c-7f04-45be-8c61-6fffcf1fc300',
			name: 'State Management',
			skillSetId: '9e8d7c6b-5a49-3827-1605-94837261058f',
		},

		// DevOps Skills (skillSetId: c4b3a291-8e7d-6c5b-4a39-28172605948e)
		{
			id: 'd51fd4d0-c73e-41c7-aaa0-091ec27751b4',
			name: 'Docker',
			skillSetId: 'c4b3a291-8e7d-6c5b-4a39-28172605948e',
		},
		{
			id: '721cdb82-aceb-4b8e-9ccc-308271f7f96f',
			name: 'Kubernetes',
			skillSetId: 'c4b3a291-8e7d-6c5b-4a39-28172605948e',
		},
		{
			id: '61b96c3c-889c-46aa-9e4e-5d65a310ccb6',
			name: 'AWS',
			skillSetId: 'c4b3a291-8e7d-6c5b-4a39-28172605948e',
		},
		{
			id: 'b4f038d8-c408-48d7-888b-adbe5070c375',
			name: 'Azure',
			skillSetId: 'c4b3a291-8e7d-6c5b-4a39-28172605948e',
		},
		{
			id: 'ff600667-5da9-46de-989c-52d595a0664e',
			name: 'Google Cloud Platform',
			skillSetId: 'c4b3a291-8e7d-6c5b-4a39-28172605948e',
		},
		{
			id: 'dddcc64a-7a9d-4a11-95db-83ac4876d9bc',
			name: 'Jenkins',
			skillSetId: 'c4b3a291-8e7d-6c5b-4a39-28172605948e',
		},
		{
			id: 'e4385e4a-5764-4993-b497-d1083e3be0ef',
			name: 'GitHub Actions',
			skillSetId: 'c4b3a291-8e7d-6c5b-4a39-28172605948e',
		},
		{
			id: 'f469db9b-bff7-4127-a1fb-6d374be30eec',
			name: 'GitLab CI/CD',
			skillSetId: 'c4b3a291-8e7d-6c5b-4a39-28172605948e',
		},
		{
			id: '2f91c17e-be55-4816-b69c-d471ad4af25a',
			name: 'Terraform',
			skillSetId: 'c4b3a291-8e7d-6c5b-4a39-28172605948e',
		},
		{
			id: '5ad6e677-c24f-4b6e-8b9e-45bf8a57cc42',
			name: 'Ansible',
			skillSetId: 'c4b3a291-8e7d-6c5b-4a39-28172605948e',
		},
		{
			id: 'e3ee57e0-099c-47d3-8de0-e8ae5cc56d15',
			name: 'Prometheus',
			skillSetId: 'c4b3a291-8e7d-6c5b-4a39-28172605948e',
		},
		{
			id: 'fa090fb9-ef77-4858-adde-6f00a7331b85',
			name: 'Grafana',
			skillSetId: 'c4b3a291-8e7d-6c5b-4a39-28172605948e',
		},
		{
			id: '8201620b-9c18-48f1-a0cc-8ad295453c4f',
			name: 'ELK Stack',
			skillSetId: 'c4b3a291-8e7d-6c5b-4a39-28172605948e',
		},
		{
			id: '1091be26-ec78-428c-aa1f-ffe0f686cbc0',
			name: 'Nginx',
			skillSetId: 'c4b3a291-8e7d-6c5b-4a39-28172605948e',
		},
		{
			id: '5033902e-f275-4dd1-bd6b-d4c311f2e797',
			name: 'Apache',
			skillSetId: 'c4b3a291-8e7d-6c5b-4a39-28172605948e',
		},

		// QA Skills (skillSetId: f1e2d3c4-b5a6-9786-5432-1098765abcde)
		{
			id: 'ed4abe03-b4c8-440b-acdd-282dccae1ccd',
			name: 'Manual Testing',
			skillSetId: 'f1e2d3c4-b5a6-9786-5432-1098765abcde',
		},
		{
			id: '6513fc82-6d13-486d-8c67-52322ecc8ec1',
			name: 'Automated Testing',
			skillSetId: 'f1e2d3c4-b5a6-9786-5432-1098765abcde',
		},
		{
			id: '2374c04d-1437-4e6d-a4f1-56f9bd24a050',
			name: 'Selenium',
			skillSetId: 'f1e2d3c4-b5a6-9786-5432-1098765abcde',
		},
		{
			id: 'a0052439-b5a0-4f8a-9ae9-08695835bc59',
			name: 'Cypress',
			skillSetId: 'f1e2d3c4-b5a6-9786-5432-1098765abcde',
		},
		{
			id: 'bc41032b-ff8d-4314-b529-79c83ef15878',
			name: 'Jest',
			skillSetId: 'f1e2d3c4-b5a6-9786-5432-1098765abcde',
		},
		{
			id: 'b2741490-e04c-4ab8-b0e6-1681a505364d',
			name: 'Playwright',
			skillSetId: 'f1e2d3c4-b5a6-9786-5432-1098765abcde',
		},
		{
			id: '241eea42-a5ed-4fa2-962b-b0f2f17a2a2a',
			name: 'Postman',
			skillSetId: 'f1e2d3c4-b5a6-9786-5432-1098765abcde',
		},
		{
			id: '4fa532b2-c7ae-4584-ab04-5729f7a7df7e',
			name: 'API Testing',
			skillSetId: 'f1e2d3c4-b5a6-9786-5432-1098765abcde',
		},
		{
			id: '28b3da50-29db-4731-87d2-1b004813fb3c',
			name: 'Performance Testing',
			skillSetId: 'f1e2d3c4-b5a6-9786-5432-1098765abcde',
		},
		{
			id: '7efc4c54-dade-4c28-8b71-83cc2726bd50',
			name: 'Security Testing',
			skillSetId: 'f1e2d3c4-b5a6-9786-5432-1098765abcde',
		},
		{
			id: '13193590-d17b-467e-93e2-4c3f826b9842',
			name: 'Load Testing',
			skillSetId: 'f1e2d3c4-b5a6-9786-5432-1098765abcde',
		},
		{
			id: '7247fcc3-9957-48f4-8188-0ebaccf456f5',
			name: 'Test Planning',
			skillSetId: 'f1e2d3c4-b5a6-9786-5432-1098765abcde',
		},
		{
			id: 'd1a8bc11-1806-4f8c-bf48-e6ef5b8df0a0',
			name: 'Bug Tracking',
			skillSetId: 'f1e2d3c4-b5a6-9786-5432-1098765abcde',
		},
		{
			id: 'f0ccac13-fbf0-4ec5-8a91-82e5adaf1f2a',
			name: 'Test Case Design',
			skillSetId: 'f1e2d3c4-b5a6-9786-5432-1098765abcde',
		},
		{
			id: 'aaf99522-6972-48a1-997c-75b25feed6f3',
			name: 'Mobile Testing',
			skillSetId: 'f1e2d3c4-b5a6-9786-5432-1098765abcde',
		},

		// Architect Skills (skillSetId: 6d5c4b3a-2918-7e6f-5d4c-3b2a19087654)
		{
			id: 'bc6deac8-5bc7-4fe0-b296-db263a54d055',
			name: 'System Design',
			skillSetId: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654',
		},
		{
			id: '8b79b836-6154-4ce6-840f-0e6b6b73367c',
			name: 'Software Architecture',
			skillSetId: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654',
		},
		{
			id: 'dbd85fd1-f703-4031-9559-26380e341449',
			name: 'Design Patterns',
			skillSetId: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654',
		},
		{
			id: 'e0cfb2bc-abfb-456d-b6e9-22e5081427d1',
			name: 'Clean Architecture',
			skillSetId: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654',
		},
		{
			id: '5fa9b55a-13ad-46f3-b22d-e4f9f7e96960',
			name: 'Domain-Driven Design',
			skillSetId: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654',
		},
		{
			id: 'ab4b1206-725b-42d5-b3b0-6f0475e89185',
			name: 'Event-Driven Architecture',
			skillSetId: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654',
		},
		{
			id: '291adbe8-7749-4dba-bbc4-b9ba078d378f',
			name: 'Scalability',
			skillSetId: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654',
		},
		{
			id: 'db752707-1157-47f4-aede-7844aed3dbce',
			name: 'Performance Optimization',
			skillSetId: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654',
		},
		{
			id: '36a53807-87c0-4f90-a4fb-bee2c5ff8fb0',
			name: 'Security Architecture',
			skillSetId: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654',
		},
		{
			id: '6978825c-618f-4fb1-9d12-d5ac1b89ca94',
			name: 'Database Architecture',
			skillSetId: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654',
		},
		{
			id: '4cc03452-1641-4485-83fc-a69d7abeeda3',
			name: 'Cloud Architecture',
			skillSetId: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654',
		},
		{
			id: '9695a392-fc85-431d-8bfe-7d4c08bc1ebe',
			name: 'Technical Documentation',
			skillSetId: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654',
		},
		{
			id: '08ed7546-7f65-4d6c-9b75-6b2a01875123',
			name: 'Code Review',
			skillSetId: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654',
		},
		{
			id: 'aaaabc80-b8a5-436d-86be-7df6aa4563de',
			name: 'Technology Evaluation',
			skillSetId: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654',
		},
		{
			id: 'ac0b24cf-c76d-4e0e-807f-2613bd966064',
			name: 'Technical Leadership',
			skillSetId: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654',
		},

		// PM Skills (skillSetId: a9b8c7d6-e5f4-3210-9876-543210fedcba)
		{
			id: 'e5aec94b-0918-495e-91f5-e0f8c5b0b5bb',
			name: 'Scrum',
			skillSetId: 'a9b8c7d6-e5f4-3210-9876-543210fedcba',
		},
		{
			id: 'db9e2c6f-f1e6-4e08-af80-abd54765f66b',
			name: 'Kanban',
			skillSetId: 'a9b8c7d6-e5f4-3210-9876-543210fedcba',
		},
		{
			id: '4c5751ff-178e-4209-8318-9d3e977c01db',
			name: 'Agile Methodologies',
			skillSetId: 'a9b8c7d6-e5f4-3210-9876-543210fedcba',
		},
		{
			id: 'ee33138d-36fd-4b72-9a14-e150b71366f6',
			name: 'Waterfall',
			skillSetId: 'a9b8c7d6-e5f4-3210-9876-543210fedcba',
		},
		{
			id: 'c6a1201c-2131-4764-83a9-e8fbe808a8f2',
			name: 'Project Planning',
			skillSetId: 'a9b8c7d6-e5f4-3210-9876-543210fedcba',
		},
		{
			id: '3870b83a-ca81-4f02-a60c-b4ac1deb3dc9',
			name: 'Risk Management',
			skillSetId: 'a9b8c7d6-e5f4-3210-9876-543210fedcba',
		},
		{
			id: '45d307f5-5fbc-4ebd-9899-1b4a328a51a8',
			name: 'Resource Management',
			skillSetId: 'a9b8c7d6-e5f4-3210-9876-543210fedcba',
		},
		{
			id: '77863c72-6a54-4cfd-9b05-009820cd2e86',
			name: 'Stakeholder Management',
			skillSetId: 'a9b8c7d6-e5f4-3210-9876-543210fedcba',
		},
		{
			id: '1eeac700-76ed-4374-8762-71413da46714',
			name: 'Budget Management',
			skillSetId: 'a9b8c7d6-e5f4-3210-9876-543210fedcba',
		},
		{
			id: '90276f8e-eef0-4744-b3b3-e7f8c14a0447',
			name: 'Team Leadership',
			skillSetId: 'a9b8c7d6-e5f4-3210-9876-543210fedcba',
		},
		{
			id: '7a836b4e-8b8a-470c-a89f-57cdd8fa855b',
			name: 'Communication',
			skillSetId: 'a9b8c7d6-e5f4-3210-9876-543210fedcba',
		},
		{
			id: '49a380aa-0918-41c2-ae47-384a71700d72',
			name: 'Jira',
			skillSetId: 'a9b8c7d6-e5f4-3210-9876-543210fedcba',
		},
		{
			id: 'e3ad8285-ad75-4ae4-ad88-c306accd9950',
			name: 'Confluence',
			skillSetId: 'a9b8c7d6-e5f4-3210-9876-543210fedcba',
		},
		{
			id: 'ee8bcc4b-30c8-452c-b1ba-2b78434a31d5',
			name: 'Microsoft Project',
			skillSetId: 'a9b8c7d6-e5f4-3210-9876-543210fedcba',
		},
		{
			id: '3a662665-aa57-449b-9c03-a18e2a1d4f2a',
			name: 'Slack',
			skillSetId: 'a9b8c7d6-e5f4-3210-9876-543210fedcba',
		},

		// BA Skills (skillSetId: 3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890)
		{
			id: '9213e713-1a32-458c-a683-e2a7c621c0df',
			name: 'Requirements Analysis',
			skillSetId: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890',
		},
		{
			id: 'f56c5b44-a1c5-4f87-9daa-8c3e14ae3ecd',
			name: 'Business Process Modeling',
			skillSetId: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890',
		},
		{
			id: '536d1e78-70d8-4d8f-ba45-8b0822292666',
			name: 'Data Analysis',
			skillSetId: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890',
		},
		{
			id: 'd08d11a2-c241-42d6-9556-2eda428178b9',
			name: 'Stakeholder Analysis',
			skillSetId: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890',
		},
		{
			id: '0f490918-26c3-4377-9888-8fa0356a6166',
			name: 'Use Case Development',
			skillSetId: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890',
		},
		{
			id: '2bb691a9-77b7-4058-b35b-289ee6a2d62a',
			name: 'User Story Writing',
			skillSetId: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890',
		},
		{
			id: '6b128e1d-6e8b-4532-a790-648c90f801ab',
			name: 'SQL',
			skillSetId: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890',
		},
		{
			id: '52c068f2-5c66-4907-ac51-fa7ca991d5a1',
			name: 'Excel',
			skillSetId: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890',
		},
		{
			id: '4e1e5b29-6141-44d3-bdb0-8b81e9d8bbcf',
			name: 'Power BI',
			skillSetId: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890',
		},
		{
			id: 'fc77c985-dd14-4330-9df6-d7f71ba823e5',
			name: 'Tableau',
			skillSetId: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890',
		},
		{
			id: '36903e85-ab70-47ef-800a-52ca29d39187',
			name: 'BPMN',
			skillSetId: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890',
		},
		{
			id: '6c183b2a-dd86-43a7-9e63-60abf8536beb',
			name: 'UML',
			skillSetId: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890',
		},
		{
			id: '31ec9d1a-dfd4-44a2-bae1-67ffae12f7ed',
			name: 'Wireframing',
			skillSetId: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890',
		},
		{
			id: 'd61fea54-fe94-4675-924c-58497953917e',
			name: 'Gap Analysis',
			skillSetId: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890',
		},
		{
			id: 'f2ebfdeb-0b38-42d3-beaf-dfd96ea7b2c9',
			name: 'Documentation',
			skillSetId: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890',
		},

		// UXUI Skills (skillSetId: 8f9e0d1c-2b3a-4958-6776-5544332211aa)
		{
			id: '65c9e14b-ba01-4153-a755-a25faa06ca76',
			name: 'User Research',
			skillSetId: '8f9e0d1c-2b3a-4958-6776-5544332211aa',
		},
		{
			id: '9ec14c45-9502-4578-9526-ad384177a7ba',
			name: 'Wireframing',
			skillSetId: '8f9e0d1c-2b3a-4958-6776-5544332211aa',
		},
		{
			id: '3e3091eb-39e6-4aeb-a60f-28f65ee7c41f',
			name: 'Prototyping',
			skillSetId: '8f9e0d1c-2b3a-4958-6776-5544332211aa',
		},
		{
			id: '37a62c51-cbf8-46bb-b5e4-ae20e9b84726',
			name: 'Figma',
			skillSetId: '8f9e0d1c-2b3a-4958-6776-5544332211aa',
		},
		{
			id: '0968f397-eef3-4b86-8ec3-403f408af26e',
			name: 'Adobe XD',
			skillSetId: '8f9e0d1c-2b3a-4958-6776-5544332211aa',
		},
		{
			id: '405ae151-2c08-47f7-bf7d-0faf2fc8eac6',
			name: 'Sketch',
			skillSetId: '8f9e0d1c-2b3a-4958-6776-5544332211aa',
		},
		{
			id: '7d082ee5-5848-4ad3-80a9-5289027cbf2a',
			name: 'Photoshop',
			skillSetId: '8f9e0d1c-2b3a-4958-6776-5544332211aa',
		},
		{
			id: '69f03fb2-e27a-4abe-a2f4-57f4f2a78053',
			name: 'Illustrator',
			skillSetId: '8f9e0d1c-2b3a-4958-6776-5544332211aa',
		},
		{
			id: '2c717a85-7c8f-4978-bb5e-646eb080048e',
			name: 'InVision',
			skillSetId: '8f9e0d1c-2b3a-4958-6776-5544332211aa',
		},
		{
			id: 'e638db9d-6b53-473b-95f8-dedb206d58a4',
			name: 'User Testing',
			skillSetId: '8f9e0d1c-2b3a-4958-6776-5544332211aa',
		},
		{
			id: '530d42f4-06db-428d-ab8e-ca1ca6f14338',
			name: 'Usability Testing',
			skillSetId: '8f9e0d1c-2b3a-4958-6776-5544332211aa',
		},
		{
			id: '5e4ed19f-8303-44b4-887a-86f70f3ccdc3',
			name: 'A/B Testing',
			skillSetId: '8f9e0d1c-2b3a-4958-6776-5544332211aa',
		},
		{
			id: '1060deb6-0b75-45e3-b8d1-63ee66814f53',
			name: 'Design Systems',
			skillSetId: '8f9e0d1c-2b3a-4958-6776-5544332211aa',
		},
		{
			id: 'acb4e95f-5559-45a1-b41c-65575d436118',
			name: 'Accessibility',
			skillSetId: '8f9e0d1c-2b3a-4958-6776-5544332211aa',
		},
		{
			id: '64d13d42-f54d-4ff6-be5c-ff14cf88d2f4',
			name: 'Information Architecture',
			skillSetId: '8f9e0d1c-2b3a-4958-6776-5544332211aa',
		},

		// Data Scientist Skills (skillSetId: 1a2b3c4d-5e6f-7890-abcd-ef1234567890)
		{
			id: '6694777e-bca3-42e3-9a03-cd463f641067',
			name: 'Python',
			skillSetId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
		},
		{
			id: '8c69ae36-ddf4-4952-86f3-4162c51cbe26',
			name: 'R',
			skillSetId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
		},
		{
			id: '019e98ea-f861-4da5-b2f2-c15662e65ffd',
			name: 'SQL',
			skillSetId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
		},
		{
			id: 'a0cc09a7-23d7-48ec-bed1-0c5a778a233d',
			name: 'Pandas',
			skillSetId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
		},
		{
			id: '2e906dbd-0a6c-4fe7-80ad-41774be39b95',
			name: 'NumPy',
			skillSetId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
		},
		{
			id: '99a7f188-51d9-4e18-b4ec-4f3dfe1433bd',
			name: 'Matplotlib',
			skillSetId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
		},
		{
			id: '1d969918-5cb9-4dbb-928d-1eb8651f8251',
			name: 'Seaborn',
			skillSetId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
		},
		{
			id: 'd6c2a8fe-d314-416c-b92e-ed5106a7a0fb',
			name: 'Jupyter Notebook',
			skillSetId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
		},
		{
			id: '6dbde4d9-3611-4bd3-a3d2-b32a1c34462c',
			name: 'Scikit-learn',
			skillSetId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
		},
		{
			id: 'd4c1d8de-43c1-458e-a7c0-cc2ec39e90b0',
			name: 'TensorFlow',
			skillSetId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
		},
		{
			id: 'a9c98054-6bdb-4694-8389-29673068ef37',
			name: 'PyTorch',
			skillSetId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
		},
		{
			id: '7b828c3a-78a7-42d5-91f2-eb62bbc66136',
			name: 'Statistical Analysis',
			skillSetId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
		},
		{
			id: '8d0d53df-7245-43aa-b04f-5b2b425ad0de',
			name: 'Machine Learning',
			skillSetId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
		},
		{
			id: 'a05e7e7d-49af-4b46-afb6-0156404a9203',
			name: 'Data Visualization',
			skillSetId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
		},
		{
			id: 'a521ebc3-5d42-4f04-9b7d-bd484ac47958',
			name: 'Data Mining',
			skillSetId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
		},

		// ML Engineer Skills (skillSetId: 4d5e6f7a-8b9c-0123-4567-890abcdef123)
		{
			id: 'c6e47020-ecb0-4f10-bd71-9b9b2ff39285',
			name: 'MLOps',
			skillSetId: '4d5e6f7a-8b9c-0123-4567-890abcdef123',
		},
		{
			id: '5c355453-caa8-4087-8d88-336dbae02460',
			name: 'Model Deployment',
			skillSetId: '4d5e6f7a-8b9c-0123-4567-890abcdef123',
		},
		{
			id: '3b40e7d3-e49f-4b49-8f62-454cedf8b03f',
			name: 'Model Monitoring',
			skillSetId: '4d5e6f7a-8b9c-0123-4567-890abcdef123',
		},
		{
			id: 'c3788270-3dc4-4431-9961-d551c921a253',
			name: 'Feature Engineering',
			skillSetId: '4d5e6f7a-8b9c-0123-4567-890abcdef123',
		},
		{
			id: '4dc16d74-fce5-4b6f-900c-3668a8569d41',
			name: 'Hyperparameter Tuning',
			skillSetId: '4d5e6f7a-8b9c-0123-4567-890abcdef123',
		},
		{
			id: '92b4445d-afc6-4ea2-ac27-f3ae39db392d',
			name: 'Model Optimization',
			skillSetId: '4d5e6f7a-8b9c-0123-4567-890abcdef123',
		},
		{
			id: '32dfdb43-24f9-4c60-a2bd-db63deb635cd',
			name: 'A/B Testing',
			skillSetId: '4d5e6f7a-8b9c-0123-4567-890abcdef123',
		},
		{
			id: '387137ed-efe1-41d1-b82a-f3793fa90b79',
			name: 'Docker',
			skillSetId: '4d5e6f7a-8b9c-0123-4567-890abcdef123',
		},
		{
			id: 'f8c1b512-a7c8-4c5a-b512-d3a98281acc6',
			name: 'Kubernetes',
			skillSetId: '4d5e6f7a-8b9c-0123-4567-890abcdef123',
		},
		{
			id: 'c4c25ff4-266b-4d1f-87d4-22eaf377430b',
			name: 'CI/CD for ML',
			skillSetId: '4d5e6f7a-8b9c-0123-4567-890abcdef123',
		},
		{
			id: '399fc643-cb43-4ae7-8631-4f368660578b',
			name: 'Apache Airflow',
			skillSetId: '4d5e6f7a-8b9c-0123-4567-890abcdef123',
		},
		{
			id: '12266148-3f9e-467f-9194-9600734be6b6',
			name: 'MLflow',
			skillSetId: '4d5e6f7a-8b9c-0123-4567-890abcdef123',
		},
		{
			id: 'ca92b2bf-34e0-48c9-adc1-f0e522633699',
			name: 'Kubeflow',
			skillSetId: '4d5e6f7a-8b9c-0123-4567-890abcdef123',
		},
		{
			id: '245816e3-0ec9-4bff-88cc-e419ef0e2845',
			name: 'Model Versioning',
			skillSetId: '4d5e6f7a-8b9c-0123-4567-890abcdef123',
		},
		{
			id: '02b293f0-60ac-45ae-aac1-b49fb1d2be81',
			name: 'Cloud ML Platforms',
			skillSetId: '4d5e6f7a-8b9c-0123-4567-890abcdef123',
		},

		// Data Engineer Skills (skillSetId: 7a8b9c0d-1e2f-3456-7890-abcdef123456)
		{
			id: '61609d95-0ee1-4deb-beca-bd552d2740f4',
			name: 'Apache Spark',
			skillSetId: '7a8b9c0d-1e2f-3456-7890-abcdef123456',
		},
		{
			id: '5e079601-5a59-4e8e-9399-b133d058ae2f',
			name: 'Apache Kafka',
			skillSetId: '7a8b9c0d-1e2f-3456-7890-abcdef123456',
		},
		{
			id: 'b2940629-1c35-4a92-962e-69ff81722d54',
			name: 'Apache Airflow',
			skillSetId: '7a8b9c0d-1e2f-3456-7890-abcdef123456',
		},
		{
			id: '95c91d80-c0a9-4248-abed-9fa4534ad419',
			name: 'Hadoop',
			skillSetId: '7a8b9c0d-1e2f-3456-7890-abcdef123456',
		},
		{
			id: '6ee85fb0-54f3-4ce3-b1d6-0e844ba6ecbf',
			name: 'ETL Pipelines',
			skillSetId: '7a8b9c0d-1e2f-3456-7890-abcdef123456',
		},
		{
			id: 'b1065389-934b-4cad-949e-4abf973dca09',
			name: 'Data Warehousing',
			skillSetId: '7a8b9c0d-1e2f-3456-7890-abcdef123456',
		},
		{
			id: 'b58bee17-673d-42c3-bdcc-bf96995134cc',
			name: 'Data Lake',
			skillSetId: '7a8b9c0d-1e2f-3456-7890-abcdef123456',
		},
		{
			id: 'c84be939-54f4-4b20-8b2b-26436304deb2',
			name: 'NoSQL Databases',
			skillSetId: '7a8b9c0d-1e2f-3456-7890-abcdef123456',
		},
		{
			id: '03fbd7e5-094f-459a-91ff-ed928cf2830f',
			name: 'Stream Processing',
			skillSetId: '7a8b9c0d-1e2f-3456-7890-abcdef123456',
		},
		{
			id: 'ee5376c7-ec79-49fa-9bb1-27dd2498f02b',
			name: 'Batch Processing',
			skillSetId: '7a8b9c0d-1e2f-3456-7890-abcdef123456',
		},
		{
			id: '9e867f05-6014-4284-b8ab-6e8ca29bb0a1',
			name: 'AWS Data Services',
			skillSetId: '7a8b9c0d-1e2f-3456-7890-abcdef123456',
		},
		{
			id: '236f7a7d-329b-4622-8149-5f7346afda53',
			name: 'Azure Data Services',
			skillSetId: '7a8b9c0d-1e2f-3456-7890-abcdef123456',
		},
		{
			id: '343a7bda-0eed-4bff-9043-0608bf3bfa08',
			name: 'Google Cloud Data',
			skillSetId: '7a8b9c0d-1e2f-3456-7890-abcdef123456',
		},
		{
			id: 'c7d5b7da-25e2-455c-bd9c-bfb0daf1efdc',
			name: 'Data Quality',
			skillSetId: '7a8b9c0d-1e2f-3456-7890-abcdef123456',
		},
		{
			id: '4d9e94f0-cd6b-41fe-8d89-a8698c91d019',
			name: 'Data Governance',
			skillSetId: '7a8b9c0d-1e2f-3456-7890-abcdef123456',
		},

		// AI Engineer Skills (skillSetId: 0d1e2f3a-4b5c-6789-0123-456789abcdef)
		{
			id: 'fb7775fd-da79-4b66-9a2b-bc1ca049461a',
			name: 'Deep Learning',
			skillSetId: '0d1e2f3a-4b5c-6789-0123-456789abcdef',
		},
		{
			id: 'b7eef71b-0189-4f45-9f97-08798de3e047',
			name: 'Computer Vision',
			skillSetId: '0d1e2f3a-4b5c-6789-0123-456789abcdef',
		},
		{
			id: 'ee65f549-6826-49e7-8381-29146afee6e1',
			name: 'Natural Language Processing',
			skillSetId: '0d1e2f3a-4b5c-6789-0123-456789abcdef',
		},
		{
			id: '9eb37af1-2469-4750-ae5f-d05241c4560e',
			name: 'OpenCV',
			skillSetId: '0d1e2f3a-4b5c-6789-0123-456789abcdef',
		},
		{
			id: '33ac7e0c-f99d-4a91-9fa7-db04da08eedd',
			name: 'NLTK',
			skillSetId: '0d1e2f3a-4b5c-6789-0123-456789abcdef',
		},
		{
			id: '745853ad-3914-4f59-a787-4aa241038133',
			name: 'spaCy',
			skillSetId: '0d1e2f3a-4b5c-6789-0123-456789abcdef',
		},
		{
			id: '9329f5be-4cda-4100-a110-0dbf67eb9563',
			name: 'Transformers',
			skillSetId: '0d1e2f3a-4b5c-6789-0123-456789abcdef',
		},
		{
			id: '5e3f12ff-eb54-4a87-ba4d-cc8f728be2b1',
			name: 'BERT',
			skillSetId: '0d1e2f3a-4b5c-6789-0123-456789abcdef',
		},
		{
			id: '44d32b66-1e7c-4ec8-acc2-8f50161e69b8',
			name: 'GPT',
			skillSetId: '0d1e2f3a-4b5c-6789-0123-456789abcdef',
		},
		{
			id: 'dfd7f8cb-7b29-4a15-bb4c-71558d96839c',
			name: 'Reinforcement Learning',
			skillSetId: '0d1e2f3a-4b5c-6789-0123-456789abcdef',
		},
		{
			id: '745c6198-4df0-4a03-9f40-3c87f0703159',
			name: 'Generative AI',
			skillSetId: '0d1e2f3a-4b5c-6789-0123-456789abcdef',
		},
		{
			id: 'c7ab5de9-3378-4b73-a862-c6b445a13ac7',
			name: 'AI Model Training',
			skillSetId: '0d1e2f3a-4b5c-6789-0123-456789abcdef',
		},
		{
			id: '94e8e13d-5e12-4f6e-9fea-f8da7796b11d',
			name: 'Neural Networks',
			skillSetId: '0d1e2f3a-4b5c-6789-0123-456789abcdef',
		},
		{
			id: 'd767e8da-058a-4eee-ba4a-cedf3805b89a',
			name: 'CNN',
			skillSetId: '0d1e2f3a-4b5c-6789-0123-456789abcdef',
		},
		{
			id: '40da0567-f624-4301-878b-156a28b6d1d4',
			name: 'RNN',
			skillSetId: '0d1e2f3a-4b5c-6789-0123-456789abcdef',
		},

		// AI PM Skills (skillSetId: 3a4b5c6d-7e8f-9012-3456-789abcdef012)
		{
			id: 'dd91f5bc-0093-478d-af0d-aa0aab3a3f80',
			name: 'AI Product Strategy',
			skillSetId: '3a4b5c6d-7e8f-9012-3456-789abcdef012',
		},
		{
			id: 'c0780c17-4c58-4864-aded-3676a6c2f962',
			name: 'AI Ethics',
			skillSetId: '3a4b5c6d-7e8f-9012-3456-789abcdef012',
		},
		{
			id: '8493e31c-814d-4bd4-aadb-3416e3d6a66b',
			name: 'Data Strategy',
			skillSetId: '3a4b5c6d-7e8f-9012-3456-789abcdef012',
		},
		{
			id: '3741770c-6b2b-4027-8a2d-bf3edfae90e6',
			name: 'ML Model Evaluation',
			skillSetId: '3a4b5c6d-7e8f-9012-3456-789abcdef012',
		},
		{
			id: 'feb3c988-a16c-4d47-a304-6b4412dfc87a',
			name: 'AI ROI Analysis',
			skillSetId: '3a4b5c6d-7e8f-9012-3456-789abcdef012',
		},
		{
			id: '1fea03fd-b3cd-475b-b6db-e9c08fc6eac3',
			name: 'Technical Documentation',
			skillSetId: '3a4b5c6d-7e8f-9012-3456-789abcdef012',
		},
		{
			id: '12c81d4c-a714-4154-b8d5-708ce2c3a784',
			name: 'Cross-functional Collaboration',
			skillSetId: '3a4b5c6d-7e8f-9012-3456-789abcdef012',
		},
		{
			id: 'b69dc0b7-2c18-4498-b8bc-351ee17bebac',
			name: 'AI Compliance',
			skillSetId: '3a4b5c6d-7e8f-9012-3456-789abcdef012',
		},
		{
			id: '3348542e-bfc2-4b9f-9bfa-58cb9afce43d',
			name: 'AI Roadmapping',
			skillSetId: '3a4b5c6d-7e8f-9012-3456-789abcdef012',
		},
		{
			id: '5a9cf21b-31cf-4d02-ac4b-363c5ac91654',
			name: 'Stakeholder Management',
			skillSetId: '3a4b5c6d-7e8f-9012-3456-789abcdef012',
		},

		// AI Ethicist Skills (skillSetId: 6d7e8f9a-0b1c-2345-6789-abcdef012345)
		{
			id: '54386bcb-d1be-48ef-ad8d-d62414463aa6',
			name: 'AI Ethics Frameworks',
			skillSetId: '6d7e8f9a-0b1c-2345-6789-abcdef012345',
		},
		{
			id: 'b0fb8efa-c1e0-4208-88a6-90967eb918d3',
			name: 'Bias Detection',
			skillSetId: '6d7e8f9a-0b1c-2345-6789-abcdef012345',
		},
		{
			id: '8dd8e670-99c3-464f-a936-88b4531d9076',
			name: 'Fairness in AI',
			skillSetId: '6d7e8f9a-0b1c-2345-6789-abcdef012345',
		},
		{
			id: 'd2bd05c4-a6e1-4ba1-82b6-2399d79951ba',
			name: 'AI Governance',
			skillSetId: '6d7e8f9a-0b1c-2345-6789-abcdef012345',
		},
		{
			id: 'd83925e9-22b2-4c28-833a-45e993eb620b',
			name: 'Privacy Protection',
			skillSetId: '6d7e8f9a-0b1c-2345-6789-abcdef012345',
		},
		{
			id: '84a2d7c5-4bfd-417f-b63c-c282964bb6b1',
			name: 'Responsible AI',
			skillSetId: '6d7e8f9a-0b1c-2345-6789-abcdef012345',
		},
		{
			id: '9fdc29f4-5398-4f66-96ef-a104790ec165',
			name: 'AI Transparency',
			skillSetId: '6d7e8f9a-0b1c-2345-6789-abcdef012345',
		},
		{
			id: 'bbeeeb27-2bb0-4711-a471-b70cd1489814',
			name: 'Algorithmic Accountability',
			skillSetId: '6d7e8f9a-0b1c-2345-6789-abcdef012345',
		},
		{
			id: '36decdc9-5e26-4bb5-bb4b-ed62ff01711f',
			name: 'Ethics Impact Assessment',
			skillSetId: '6d7e8f9a-0b1c-2345-6789-abcdef012345',
		},
		{
			id: '7b80bfbf-b534-4911-a555-32fd8317099d',
			name: 'Legal Compliance',
			skillSetId: '6d7e8f9a-0b1c-2345-6789-abcdef012345',
		},

		// Prompt Engineer Skills (skillSetId: 9a0b1c2d-3e4f-5678-9012-345678901234)
		{
			id: '1842fc63-707a-4483-bc4c-f776de6524c1',
			name: 'Prompt Design',
			skillSetId: '9a0b1c2d-3e4f-5678-9012-345678901234',
		},
		{
			id: 'e5304146-28a9-470c-915f-22021dd9a8c0',
			name: 'LLM Optimization',
			skillSetId: '9a0b1c2d-3e4f-5678-9012-345678901234',
		},
		{
			id: 'a992ca1c-7747-40c1-aa28-283134a1183d',
			name: 'Chain-of-Thought',
			skillSetId: '9a0b1c2d-3e4f-5678-9012-345678901234',
		},
		{
			id: 'e662ffb3-bd52-4459-8e91-02d25ad4b58b',
			name: 'Few-shot Learning',
			skillSetId: '9a0b1c2d-3e4f-5678-9012-345678901234',
		},
		{
			id: '9abb0b31-76e8-4686-ac31-a4e634d8e6a4',
			name: 'Zero-shot Learning',
			skillSetId: '9a0b1c2d-3e4f-5678-9012-345678901234',
		},
		{
			id: '24e838e1-d6c0-4a0c-aae0-78d4a00c3f12',
			name: 'OpenAI API',
			skillSetId: '9a0b1c2d-3e4f-5678-9012-345678901234',
		},
		{
			id: '9dd030f9-307f-4632-8b7f-c3b3a52d11ab',
			name: 'LangChain',
			skillSetId: '9a0b1c2d-3e4f-5678-9012-345678901234',
		},
		{
			id: '879feb87-5f5e-4a64-9578-c15865798c33',
			name: 'AI Safety',
			skillSetId: '9a0b1c2d-3e4f-5678-9012-345678901234',
		},
		{
			id: '24ea91b2-d72b-4889-bc94-af259423e8b6',
			name: 'Model Fine-tuning',
			skillSetId: '9a0b1c2d-3e4f-5678-9012-345678901234',
		},
		{
			id: '0c3b8ab4-d84b-4f8d-ae53-71bb46bb81a8',
			name: 'Conversational AI',
			skillSetId: '9a0b1c2d-3e4f-5678-9012-345678901234',
		},

		// Model Validator Skills (skillSetId: c2d3e4f5-6a7b-8901-2345-678901234567)
		{
			id: '16e31167-5266-455e-8f76-34e54ba86d2f',
			name: 'Model Testing',
			skillSetId: 'c2d3e4f5-6a7b-8901-2345-678901234567',
		},
		{
			id: 'ccc29370-854c-413e-b0bf-eb40bd0c644f',
			name: 'Performance Metrics',
			skillSetId: 'c2d3e4f5-6a7b-8901-2345-678901234567',
		},
		{
			id: 'fbf5c3e4-a0d7-4db6-b322-89bb821fce7b',
			name: 'Cross-validation',
			skillSetId: 'c2d3e4f5-6a7b-8901-2345-678901234567',
		},
		{
			id: '2da43483-7dfc-4297-b45c-5bab6ba1bfaf',
			name: 'Statistical Testing',
			skillSetId: 'c2d3e4f5-6a7b-8901-2345-678901234567',
		},
		{
			id: '33a714bc-b22a-4a89-9b37-5279622a80f9',
			name: 'A/B Testing',
			skillSetId: 'c2d3e4f5-6a7b-8901-2345-678901234567',
		},
		{
			id: '76207d05-aa4a-4c9b-bae4-1945b4495e5a',
			name: 'Data Quality Assessment',
			skillSetId: 'c2d3e4f5-6a7b-8901-2345-678901234567',
		},
		{
			id: 'c04d5d12-aa6f-46a4-9008-4f13d8de7b9a',
			name: 'Model Interpretability',
			skillSetId: 'c2d3e4f5-6a7b-8901-2345-678901234567',
		},
		{
			id: '9c536643-1dd7-44c6-997b-1a843f05b015',
			name: 'Edge Case Testing',
			skillSetId: 'c2d3e4f5-6a7b-8901-2345-678901234567',
		},
		{
			id: '9e68abbe-07ab-4b47-846f-9b29c63f87e2',
			name: 'Regression Testing',
			skillSetId: 'c2d3e4f5-6a7b-8901-2345-678901234567',
		},
		{
			id: '0aa38012-8951-4540-92bd-3d82d2fd5753',
			name: 'Model Documentation',
			skillSetId: 'c2d3e4f5-6a7b-8901-2345-678901234567',
		},

		// UX for AI Skills (skillSetId: f5a6b7c8-9d0e-1234-5678-901234567890)
		{
			id: 'f47727d6-30f7-4a33-a828-7a258f44df9d',
			name: 'AI Interface Design',
			skillSetId: 'f5a6b7c8-9d0e-1234-5678-901234567890',
		},
		{
			id: '435e46d4-cd43-4342-8e5d-4bbacab3547b',
			name: 'Conversational UI',
			skillSetId: 'f5a6b7c8-9d0e-1234-5678-901234567890',
		},
		{
			id: '12a0c6e6-bc7e-44ed-9405-9e7091b9f4a5',
			name: 'AI Explainability Design',
			skillSetId: 'f5a6b7c8-9d0e-1234-5678-901234567890',
		},
		{
			id: '693ef131-f726-4674-b732-c0fff78da832',
			name: 'Human-AI Interaction',
			skillSetId: 'f5a6b7c8-9d0e-1234-5678-901234567890',
		},
		{
			id: 'a314d4ec-9b9b-4476-a15f-2fee94705145',
			name: 'AI Trust Design',
			skillSetId: 'f5a6b7c8-9d0e-1234-5678-901234567890',
		},
		{
			id: '8d4b3110-86f5-4ced-8c62-aa55aef3e664',
			name: 'Voice UI Design',
			skillSetId: 'f5a6b7c8-9d0e-1234-5678-901234567890',
		},
		{
			id: '62ba8834-044b-4308-8337-94d8b54043c7',
			name: 'Chatbot Design',
			skillSetId: 'f5a6b7c8-9d0e-1234-5678-901234567890',
		},
		{
			id: '0c9cca81-7623-4daf-adef-a078333c446c',
			name: 'AI Feedback Systems',
			skillSetId: 'f5a6b7c8-9d0e-1234-5678-901234567890',
		},
		{
			id: 'b572126e-265c-4a58-861d-9b82a85a8153',
			name: 'Ethical Design',
			skillSetId: 'f5a6b7c8-9d0e-1234-5678-901234567890',
		},
		{
			id: '6589190a-dad2-4b15-8663-dc76b1bc0dc4',
			name: 'AI User Research',
			skillSetId: 'f5a6b7c8-9d0e-1234-5678-901234567890',
		},
	];

	await prisma.$transaction(
		skills.map((skill) =>
			prisma.skill.upsert({
				where: { id: skill.id },
				update: { name: skill.name, skillSetId: skill.skillSetId },
				create: skill,
			}),
		),
	);

	console.log('🛠️ Skills seeded successfully');
};

async function main() {
	try {
		await prisma.$connect();

		await seedAdmin();
		await seedMajor();
		await seedResponsibility();
		await seedSkillSets();
		await seedSkills();
	} catch (error) {
		console.error('Seed failed:', error);

		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

void main();
