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

	console.log('Admin seeded successfully');
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

	console.log('Major seeded successfully');
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

	console.log('Responsibilities seeded successfully');
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

	console.log('Skill sets seeded successfully');
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
			id: 'ds-001',
			name: 'Python',
			skillSetId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
		},
		{
			id: 'ds-002',
			name: 'R',
			skillSetId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
		},
		{
			id: 'ds-003',
			name: 'SQL',
			skillSetId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
		},
		{
			id: 'ds-004',
			name: 'Pandas',
			skillSetId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
		},
		{
			id: 'ds-005',
			name: 'NumPy',
			skillSetId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
		},
		{
			id: 'ds-006',
			name: 'Matplotlib',
			skillSetId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
		},
		{
			id: 'ds-007',
			name: 'Seaborn',
			skillSetId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
		},
		{
			id: 'ds-008',
			name: 'Jupyter Notebook',
			skillSetId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
		},
		{
			id: 'ds-009',
			name: 'Scikit-learn',
			skillSetId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
		},
		{
			id: 'ds-010',
			name: 'TensorFlow',
			skillSetId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
		},
		{
			id: 'ds-011',
			name: 'PyTorch',
			skillSetId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
		},
		{
			id: 'ds-012',
			name: 'Statistical Analysis',
			skillSetId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
		},
		{
			id: 'ds-013',
			name: 'Machine Learning',
			skillSetId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
		},
		{
			id: 'ds-014',
			name: 'Data Visualization',
			skillSetId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
		},
		{
			id: 'ds-015',
			name: 'Data Mining',
			skillSetId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
		},

		// ML Engineer Skills (skillSetId: 4d5e6f7a-8b9c-0123-4567-890abcdef123)
		{
			id: 'ml-001',
			name: 'MLOps',
			skillSetId: '4d5e6f7a-8b9c-0123-4567-890abcdef123',
		},
		{
			id: 'ml-002',
			name: 'Model Deployment',
			skillSetId: '4d5e6f7a-8b9c-0123-4567-890abcdef123',
		},
		{
			id: 'ml-003',
			name: 'Model Monitoring',
			skillSetId: '4d5e6f7a-8b9c-0123-4567-890abcdef123',
		},
		{
			id: 'ml-004',
			name: 'Feature Engineering',
			skillSetId: '4d5e6f7a-8b9c-0123-4567-890abcdef123',
		},
		{
			id: 'ml-005',
			name: 'Hyperparameter Tuning',
			skillSetId: '4d5e6f7a-8b9c-0123-4567-890abcdef123',
		},
		{
			id: 'ml-006',
			name: 'Model Optimization',
			skillSetId: '4d5e6f7a-8b9c-0123-4567-890abcdef123',
		},
		{
			id: 'ml-007',
			name: 'A/B Testing',
			skillSetId: '4d5e6f7a-8b9c-0123-4567-890abcdef123',
		},
		{
			id: 'ml-008',
			name: 'Docker',
			skillSetId: '4d5e6f7a-8b9c-0123-4567-890abcdef123',
		},
		{
			id: 'ml-009',
			name: 'Kubernetes',
			skillSetId: '4d5e6f7a-8b9c-0123-4567-890abcdef123',
		},
		{
			id: 'ml-010',
			name: 'CI/CD for ML',
			skillSetId: '4d5e6f7a-8b9c-0123-4567-890abcdef123',
		},
		{
			id: 'ml-011',
			name: 'Apache Airflow',
			skillSetId: '4d5e6f7a-8b9c-0123-4567-890abcdef123',
		},
		{
			id: 'ml-012',
			name: 'MLflow',
			skillSetId: '4d5e6f7a-8b9c-0123-4567-890abcdef123',
		},
		{
			id: 'ml-013',
			name: 'Kubeflow',
			skillSetId: '4d5e6f7a-8b9c-0123-4567-890abcdef123',
		},
		{
			id: 'ml-014',
			name: 'Model Versioning',
			skillSetId: '4d5e6f7a-8b9c-0123-4567-890abcdef123',
		},
		{
			id: 'ml-015',
			name: 'Cloud ML Platforms',
			skillSetId: '4d5e6f7a-8b9c-0123-4567-890abcdef123',
		},

		// Data Engineer Skills (skillSetId: 7a8b9c0d-1e2f-3456-7890-abcdef123456)
		{
			id: 'de-001',
			name: 'Apache Spark',
			skillSetId: '7a8b9c0d-1e2f-3456-7890-abcdef123456',
		},
		{
			id: 'de-002',
			name: 'Apache Kafka',
			skillSetId: '7a8b9c0d-1e2f-3456-7890-abcdef123456',
		},
		{
			id: 'de-003',
			name: 'Apache Airflow',
			skillSetId: '7a8b9c0d-1e2f-3456-7890-abcdef123456',
		},
		{
			id: 'de-004',
			name: 'Hadoop',
			skillSetId: '7a8b9c0d-1e2f-3456-7890-abcdef123456',
		},
		{
			id: 'de-005',
			name: 'ETL Pipelines',
			skillSetId: '7a8b9c0d-1e2f-3456-7890-abcdef123456',
		},
		{
			id: 'de-006',
			name: 'Data Warehousing',
			skillSetId: '7a8b9c0d-1e2f-3456-7890-abcdef123456',
		},
		{
			id: 'de-007',
			name: 'Data Lake',
			skillSetId: '7a8b9c0d-1e2f-3456-7890-abcdef123456',
		},
		{
			id: 'de-008',
			name: 'NoSQL Databases',
			skillSetId: '7a8b9c0d-1e2f-3456-7890-abcdef123456',
		},
		{
			id: 'de-009',
			name: 'Stream Processing',
			skillSetId: '7a8b9c0d-1e2f-3456-7890-abcdef123456',
		},
		{
			id: 'de-010',
			name: 'Batch Processing',
			skillSetId: '7a8b9c0d-1e2f-3456-7890-abcdef123456',
		},
		{
			id: 'de-011',
			name: 'AWS Data Services',
			skillSetId: '7a8b9c0d-1e2f-3456-7890-abcdef123456',
		},
		{
			id: 'de-012',
			name: 'Azure Data Services',
			skillSetId: '7a8b9c0d-1e2f-3456-7890-abcdef123456',
		},
		{
			id: 'de-013',
			name: 'Google Cloud Data',
			skillSetId: '7a8b9c0d-1e2f-3456-7890-abcdef123456',
		},
		{
			id: 'de-014',
			name: 'Data Quality',
			skillSetId: '7a8b9c0d-1e2f-3456-7890-abcdef123456',
		},
		{
			id: 'de-015',
			name: 'Data Governance',
			skillSetId: '7a8b9c0d-1e2f-3456-7890-abcdef123456',
		},

		// AI Engineer Skills (skillSetId: 0d1e2f3a-4b5c-6789-0123-456789abcdef)
		{
			id: 'ai-001',
			name: 'Deep Learning',
			skillSetId: '0d1e2f3a-4b5c-6789-0123-456789abcdef',
		},
		{
			id: 'ai-002',
			name: 'Computer Vision',
			skillSetId: '0d1e2f3a-4b5c-6789-0123-456789abcdef',
		},
		{
			id: 'ai-003',
			name: 'Natural Language Processing',
			skillSetId: '0d1e2f3a-4b5c-6789-0123-456789abcdef',
		},
		{
			id: 'ai-004',
			name: 'OpenCV',
			skillSetId: '0d1e2f3a-4b5c-6789-0123-456789abcdef',
		},
		{
			id: 'ai-005',
			name: 'NLTK',
			skillSetId: '0d1e2f3a-4b5c-6789-0123-456789abcdef',
		},
		{
			id: 'ai-006',
			name: 'spaCy',
			skillSetId: '0d1e2f3a-4b5c-6789-0123-456789abcdef',
		},
		{
			id: 'ai-007',
			name: 'Transformers',
			skillSetId: '0d1e2f3a-4b5c-6789-0123-456789abcdef',
		},
		{
			id: 'ai-008',
			name: 'BERT',
			skillSetId: '0d1e2f3a-4b5c-6789-0123-456789abcdef',
		},
		{
			id: 'ai-009',
			name: 'GPT',
			skillSetId: '0d1e2f3a-4b5c-6789-0123-456789abcdef',
		},
		{
			id: 'ai-010',
			name: 'Reinforcement Learning',
			skillSetId: '0d1e2f3a-4b5c-6789-0123-456789abcdef',
		},
		{
			id: 'ai-011',
			name: 'Generative AI',
			skillSetId: '0d1e2f3a-4b5c-6789-0123-456789abcdef',
		},
		{
			id: 'ai-012',
			name: 'AI Model Training',
			skillSetId: '0d1e2f3a-4b5c-6789-0123-456789abcdef',
		},
		{
			id: 'ai-013',
			name: 'Neural Networks',
			skillSetId: '0d1e2f3a-4b5c-6789-0123-456789abcdef',
		},
		{
			id: 'ai-014',
			name: 'CNN',
			skillSetId: '0d1e2f3a-4b5c-6789-0123-456789abcdef',
		},
		{
			id: 'ai-015',
			name: 'RNN',
			skillSetId: '0d1e2f3a-4b5c-6789-0123-456789abcdef',
		},

		// AI PM Skills (skillSetId: 3a4b5c6d-7e8f-9012-3456-789abcdef012)
		{
			id: 'aipm-001',
			name: 'AI Product Strategy',
			skillSetId: '3a4b5c6d-7e8f-9012-3456-789abcdef012',
		},
		{
			id: 'aipm-002',
			name: 'AI Ethics',
			skillSetId: '3a4b5c6d-7e8f-9012-3456-789abcdef012',
		},
		{
			id: 'aipm-003',
			name: 'Data Strategy',
			skillSetId: '3a4b5c6d-7e8f-9012-3456-789abcdef012',
		},
		{
			id: 'aipm-004',
			name: 'ML Model Evaluation',
			skillSetId: '3a4b5c6d-7e8f-9012-3456-789abcdef012',
		},
		{
			id: 'aipm-005',
			name: 'AI ROI Analysis',
			skillSetId: '3a4b5c6d-7e8f-9012-3456-789abcdef012',
		},
		{
			id: 'aipm-006',
			name: 'Technical Documentation',
			skillSetId: '3a4b5c6d-7e8f-9012-3456-789abcdef012',
		},
		{
			id: 'aipm-007',
			name: 'Cross-functional Collaboration',
			skillSetId: '3a4b5c6d-7e8f-9012-3456-789abcdef012',
		},
		{
			id: 'aipm-008',
			name: 'AI Compliance',
			skillSetId: '3a4b5c6d-7e8f-9012-3456-789abcdef012',
		},
		{
			id: 'aipm-009',
			name: 'AI Roadmapping',
			skillSetId: '3a4b5c6d-7e8f-9012-3456-789abcdef012',
		},
		{
			id: 'aipm-010',
			name: 'Stakeholder Management',
			skillSetId: '3a4b5c6d-7e8f-9012-3456-789abcdef012',
		},

		// AI Ethicist Skills (skillSetId: 6d7e8f9a-0b1c-2345-6789-abcdef012345)
		{
			id: 'ethics-001',
			name: 'AI Ethics Frameworks',
			skillSetId: '6d7e8f9a-0b1c-2345-6789-abcdef012345',
		},
		{
			id: 'ethics-002',
			name: 'Bias Detection',
			skillSetId: '6d7e8f9a-0b1c-2345-6789-abcdef012345',
		},
		{
			id: 'ethics-003',
			name: 'Fairness in AI',
			skillSetId: '6d7e8f9a-0b1c-2345-6789-abcdef012345',
		},
		{
			id: 'ethics-004',
			name: 'AI Governance',
			skillSetId: '6d7e8f9a-0b1c-2345-6789-abcdef012345',
		},
		{
			id: 'ethics-005',
			name: 'Privacy Protection',
			skillSetId: '6d7e8f9a-0b1c-2345-6789-abcdef012345',
		},
		{
			id: 'ethics-006',
			name: 'Responsible AI',
			skillSetId: '6d7e8f9a-0b1c-2345-6789-abcdef012345',
		},
		{
			id: 'ethics-007',
			name: 'AI Transparency',
			skillSetId: '6d7e8f9a-0b1c-2345-6789-abcdef012345',
		},
		{
			id: 'ethics-008',
			name: 'Algorithmic Accountability',
			skillSetId: '6d7e8f9a-0b1c-2345-6789-abcdef012345',
		},
		{
			id: 'ethics-009',
			name: 'Ethics Impact Assessment',
			skillSetId: '6d7e8f9a-0b1c-2345-6789-abcdef012345',
		},
		{
			id: 'ethics-010',
			name: 'Legal Compliance',
			skillSetId: '6d7e8f9a-0b1c-2345-6789-abcdef012345',
		},

		// Prompt Engineer Skills (skillSetId: 9a0b1c2d-3e4f-5678-9012-345678901234)
		{
			id: 'prompt-001',
			name: 'Prompt Design',
			skillSetId: '9a0b1c2d-3e4f-5678-9012-345678901234',
		},
		{
			id: 'prompt-002',
			name: 'LLM Optimization',
			skillSetId: '9a0b1c2d-3e4f-5678-9012-345678901234',
		},
		{
			id: 'prompt-003',
			name: 'Chain-of-Thought',
			skillSetId: '9a0b1c2d-3e4f-5678-9012-345678901234',
		},
		{
			id: 'prompt-004',
			name: 'Few-shot Learning',
			skillSetId: '9a0b1c2d-3e4f-5678-9012-345678901234',
		},
		{
			id: 'prompt-005',
			name: 'Zero-shot Learning',
			skillSetId: '9a0b1c2d-3e4f-5678-9012-345678901234',
		},
		{
			id: 'prompt-006',
			name: 'OpenAI API',
			skillSetId: '9a0b1c2d-3e4f-5678-9012-345678901234',
		},
		{
			id: 'prompt-007',
			name: 'LangChain',
			skillSetId: '9a0b1c2d-3e4f-5678-9012-345678901234',
		},
		{
			id: 'prompt-008',
			name: 'AI Safety',
			skillSetId: '9a0b1c2d-3e4f-5678-9012-345678901234',
		},
		{
			id: 'prompt-009',
			name: 'Model Fine-tuning',
			skillSetId: '9a0b1c2d-3e4f-5678-9012-345678901234',
		},
		{
			id: 'prompt-010',
			name: 'Conversational AI',
			skillSetId: '9a0b1c2d-3e4f-5678-9012-345678901234',
		},

		// Model Validator Skills (skillSetId: c2d3e4f5-6a7b-8901-2345-678901234567)
		{
			id: 'validator-001',
			name: 'Model Testing',
			skillSetId: 'c2d3e4f5-6a7b-8901-2345-678901234567',
		},
		{
			id: 'validator-002',
			name: 'Performance Metrics',
			skillSetId: 'c2d3e4f5-6a7b-8901-2345-678901234567',
		},
		{
			id: 'validator-003',
			name: 'Cross-validation',
			skillSetId: 'c2d3e4f5-6a7b-8901-2345-678901234567',
		},
		{
			id: 'validator-004',
			name: 'Statistical Testing',
			skillSetId: 'c2d3e4f5-6a7b-8901-2345-678901234567',
		},
		{
			id: 'validator-005',
			name: 'A/B Testing',
			skillSetId: 'c2d3e4f5-6a7b-8901-2345-678901234567',
		},
		{
			id: 'validator-006',
			name: 'Data Quality Assessment',
			skillSetId: 'c2d3e4f5-6a7b-8901-2345-678901234567',
		},
		{
			id: 'validator-007',
			name: 'Model Interpretability',
			skillSetId: 'c2d3e4f5-6a7b-8901-2345-678901234567',
		},
		{
			id: 'validator-008',
			name: 'Edge Case Testing',
			skillSetId: 'c2d3e4f5-6a7b-8901-2345-678901234567',
		},
		{
			id: 'validator-009',
			name: 'Regression Testing',
			skillSetId: 'c2d3e4f5-6a7b-8901-2345-678901234567',
		},
		{
			id: 'validator-010',
			name: 'Model Documentation',
			skillSetId: 'c2d3e4f5-6a7b-8901-2345-678901234567',
		},

		// UX for AI Skills (skillSetId: f5a6b7c8-9d0e-1234-5678-901234567890)
		{
			id: 'uxai-001',
			name: 'AI Interface Design',
			skillSetId: 'f5a6b7c8-9d0e-1234-5678-901234567890',
		},
		{
			id: 'uxai-002',
			name: 'Conversational UI',
			skillSetId: 'f5a6b7c8-9d0e-1234-5678-901234567890',
		},
		{
			id: 'uxai-003',
			name: 'AI Explainability Design',
			skillSetId: 'f5a6b7c8-9d0e-1234-5678-901234567890',
		},
		{
			id: 'uxai-004',
			name: 'Human-AI Interaction',
			skillSetId: 'f5a6b7c8-9d0e-1234-5678-901234567890',
		},
		{
			id: 'uxai-005',
			name: 'AI Trust Design',
			skillSetId: 'f5a6b7c8-9d0e-1234-5678-901234567890',
		},
		{
			id: 'uxai-006',
			name: 'Voice UI Design',
			skillSetId: 'f5a6b7c8-9d0e-1234-5678-901234567890',
		},
		{
			id: 'uxai-007',
			name: 'Chatbot Design',
			skillSetId: 'f5a6b7c8-9d0e-1234-5678-901234567890',
		},
		{
			id: 'uxai-008',
			name: 'AI Feedback Systems',
			skillSetId: 'f5a6b7c8-9d0e-1234-5678-901234567890',
		},
		{
			id: 'uxai-009',
			name: 'Ethical Design',
			skillSetId: 'f5a6b7c8-9d0e-1234-5678-901234567890',
		},
		{
			id: 'uxai-010',
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

	console.log('Skills seeded successfully');
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
