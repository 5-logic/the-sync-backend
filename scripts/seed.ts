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
			id: 'fullstack-001',
			name: 'MEAN Stack',
			skillSetId: '9e8d7c6b-5a49-3827-1605-94837261058f',
		},
		{
			id: 'fullstack-002',
			name: 'MERN Stack',
			skillSetId: '9e8d7c6b-5a49-3827-1605-94837261058f',
		},
		{
			id: 'fullstack-003',
			name: 'LAMP Stack',
			skillSetId: '9e8d7c6b-5a49-3827-1605-94837261058f',
		},
		{
			id: 'fullstack-004',
			name: 'T3 Stack',
			skillSetId: '9e8d7c6b-5a49-3827-1605-94837261058f',
		},
		{
			id: 'fullstack-005',
			name: 'JAMstack',
			skillSetId: '9e8d7c6b-5a49-3827-1605-94837261058f',
		},
		{
			id: 'fullstack-006',
			name: 'Serverless',
			skillSetId: '9e8d7c6b-5a49-3827-1605-94837261058f',
		},
		{
			id: 'fullstack-007',
			name: 'API Integration',
			skillSetId: '9e8d7c6b-5a49-3827-1605-94837261058f',
		},
		{
			id: 'fullstack-008',
			name: 'Database Design',
			skillSetId: '9e8d7c6b-5a49-3827-1605-94837261058f',
		},
		{
			id: 'fullstack-009',
			name: 'Authentication & Authorization',
			skillSetId: '9e8d7c6b-5a49-3827-1605-94837261058f',
		},
		{
			id: 'fullstack-010',
			name: 'State Management',
			skillSetId: '9e8d7c6b-5a49-3827-1605-94837261058f',
		},

		// DevOps Skills (skillSetId: c4b3a291-8e7d-6c5b-4a39-28172605948e)
		{
			id: 'devops-001',
			name: 'Docker',
			skillSetId: 'c4b3a291-8e7d-6c5b-4a39-28172605948e',
		},
		{
			id: 'devops-002',
			name: 'Kubernetes',
			skillSetId: 'c4b3a291-8e7d-6c5b-4a39-28172605948e',
		},
		{
			id: 'devops-003',
			name: 'AWS',
			skillSetId: 'c4b3a291-8e7d-6c5b-4a39-28172605948e',
		},
		{
			id: 'devops-004',
			name: 'Azure',
			skillSetId: 'c4b3a291-8e7d-6c5b-4a39-28172605948e',
		},
		{
			id: 'devops-005',
			name: 'Google Cloud Platform',
			skillSetId: 'c4b3a291-8e7d-6c5b-4a39-28172605948e',
		},
		{
			id: 'devops-006',
			name: 'Jenkins',
			skillSetId: 'c4b3a291-8e7d-6c5b-4a39-28172605948e',
		},
		{
			id: 'devops-007',
			name: 'GitHub Actions',
			skillSetId: 'c4b3a291-8e7d-6c5b-4a39-28172605948e',
		},
		{
			id: 'devops-008',
			name: 'GitLab CI/CD',
			skillSetId: 'c4b3a291-8e7d-6c5b-4a39-28172605948e',
		},
		{
			id: 'devops-009',
			name: 'Terraform',
			skillSetId: 'c4b3a291-8e7d-6c5b-4a39-28172605948e',
		},
		{
			id: 'devops-010',
			name: 'Ansible',
			skillSetId: 'c4b3a291-8e7d-6c5b-4a39-28172605948e',
		},
		{
			id: 'devops-011',
			name: 'Prometheus',
			skillSetId: 'c4b3a291-8e7d-6c5b-4a39-28172605948e',
		},
		{
			id: 'devops-012',
			name: 'Grafana',
			skillSetId: 'c4b3a291-8e7d-6c5b-4a39-28172605948e',
		},
		{
			id: 'devops-013',
			name: 'ELK Stack',
			skillSetId: 'c4b3a291-8e7d-6c5b-4a39-28172605948e',
		},
		{
			id: 'devops-014',
			name: 'Nginx',
			skillSetId: 'c4b3a291-8e7d-6c5b-4a39-28172605948e',
		},
		{
			id: 'devops-015',
			name: 'Apache',
			skillSetId: 'c4b3a291-8e7d-6c5b-4a39-28172605948e',
		},

		// QA Skills (skillSetId: f1e2d3c4-b5a6-9786-5432-1098765abcde)
		{
			id: 'qa-001',
			name: 'Manual Testing',
			skillSetId: 'f1e2d3c4-b5a6-9786-5432-1098765abcde',
		},
		{
			id: 'qa-002',
			name: 'Automated Testing',
			skillSetId: 'f1e2d3c4-b5a6-9786-5432-1098765abcde',
		},
		{
			id: 'qa-003',
			name: 'Selenium',
			skillSetId: 'f1e2d3c4-b5a6-9786-5432-1098765abcde',
		},
		{
			id: 'qa-004',
			name: 'Cypress',
			skillSetId: 'f1e2d3c4-b5a6-9786-5432-1098765abcde',
		},
		{
			id: 'qa-005',
			name: 'Jest',
			skillSetId: 'f1e2d3c4-b5a6-9786-5432-1098765abcde',
		},
		{
			id: 'qa-006',
			name: 'Playwright',
			skillSetId: 'f1e2d3c4-b5a6-9786-5432-1098765abcde',
		},
		{
			id: 'qa-007',
			name: 'Postman',
			skillSetId: 'f1e2d3c4-b5a6-9786-5432-1098765abcde',
		},
		{
			id: 'qa-008',
			name: 'API Testing',
			skillSetId: 'f1e2d3c4-b5a6-9786-5432-1098765abcde',
		},
		{
			id: 'qa-009',
			name: 'Performance Testing',
			skillSetId: 'f1e2d3c4-b5a6-9786-5432-1098765abcde',
		},
		{
			id: 'qa-010',
			name: 'Security Testing',
			skillSetId: 'f1e2d3c4-b5a6-9786-5432-1098765abcde',
		},
		{
			id: 'qa-011',
			name: 'Load Testing',
			skillSetId: 'f1e2d3c4-b5a6-9786-5432-1098765abcde',
		},
		{
			id: 'qa-012',
			name: 'Test Planning',
			skillSetId: 'f1e2d3c4-b5a6-9786-5432-1098765abcde',
		},
		{
			id: 'qa-013',
			name: 'Bug Tracking',
			skillSetId: 'f1e2d3c4-b5a6-9786-5432-1098765abcde',
		},
		{
			id: 'qa-014',
			name: 'Test Case Design',
			skillSetId: 'f1e2d3c4-b5a6-9786-5432-1098765abcde',
		},
		{
			id: 'qa-015',
			name: 'Mobile Testing',
			skillSetId: 'f1e2d3c4-b5a6-9786-5432-1098765abcde',
		},

		// Architect Skills (skillSetId: 6d5c4b3a-2918-7e6f-5d4c-3b2a19087654)
		{
			id: 'architect-001',
			name: 'System Design',
			skillSetId: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654',
		},
		{
			id: 'architect-002',
			name: 'Software Architecture',
			skillSetId: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654',
		},
		{
			id: 'architect-003',
			name: 'Design Patterns',
			skillSetId: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654',
		},
		{
			id: 'architect-004',
			name: 'Clean Architecture',
			skillSetId: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654',
		},
		{
			id: 'architect-005',
			name: 'Domain-Driven Design',
			skillSetId: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654',
		},
		{
			id: 'architect-006',
			name: 'Event-Driven Architecture',
			skillSetId: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654',
		},
		{
			id: 'architect-007',
			name: 'Scalability',
			skillSetId: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654',
		},
		{
			id: 'architect-008',
			name: 'Performance Optimization',
			skillSetId: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654',
		},
		{
			id: 'architect-009',
			name: 'Security Architecture',
			skillSetId: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654',
		},
		{
			id: 'architect-010',
			name: 'Database Architecture',
			skillSetId: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654',
		},
		{
			id: 'architect-011',
			name: 'Cloud Architecture',
			skillSetId: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654',
		},
		{
			id: 'architect-012',
			name: 'Technical Documentation',
			skillSetId: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654',
		},
		{
			id: 'architect-013',
			name: 'Code Review',
			skillSetId: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654',
		},
		{
			id: 'architect-014',
			name: 'Technology Evaluation',
			skillSetId: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654',
		},
		{
			id: 'architect-015',
			name: 'Technical Leadership',
			skillSetId: '6d5c4b3a-2918-7e6f-5d4c-3b2a19087654',
		},

		// PM Skills (skillSetId: a9b8c7d6-e5f4-3210-9876-543210fedcba)
		{
			id: 'pm-001',
			name: 'Scrum',
			skillSetId: 'a9b8c7d6-e5f4-3210-9876-543210fedcba',
		},
		{
			id: 'pm-002',
			name: 'Kanban',
			skillSetId: 'a9b8c7d6-e5f4-3210-9876-543210fedcba',
		},
		{
			id: 'pm-003',
			name: 'Agile Methodologies',
			skillSetId: 'a9b8c7d6-e5f4-3210-9876-543210fedcba',
		},
		{
			id: 'pm-004',
			name: 'Waterfall',
			skillSetId: 'a9b8c7d6-e5f4-3210-9876-543210fedcba',
		},
		{
			id: 'pm-005',
			name: 'Project Planning',
			skillSetId: 'a9b8c7d6-e5f4-3210-9876-543210fedcba',
		},
		{
			id: 'pm-006',
			name: 'Risk Management',
			skillSetId: 'a9b8c7d6-e5f4-3210-9876-543210fedcba',
		},
		{
			id: 'pm-007',
			name: 'Resource Management',
			skillSetId: 'a9b8c7d6-e5f4-3210-9876-543210fedcba',
		},
		{
			id: 'pm-008',
			name: 'Stakeholder Management',
			skillSetId: 'a9b8c7d6-e5f4-3210-9876-543210fedcba',
		},
		{
			id: 'pm-009',
			name: 'Budget Management',
			skillSetId: 'a9b8c7d6-e5f4-3210-9876-543210fedcba',
		},
		{
			id: 'pm-010',
			name: 'Team Leadership',
			skillSetId: 'a9b8c7d6-e5f4-3210-9876-543210fedcba',
		},
		{
			id: 'pm-011',
			name: 'Communication',
			skillSetId: 'a9b8c7d6-e5f4-3210-9876-543210fedcba',
		},
		{
			id: 'pm-012',
			name: 'Jira',
			skillSetId: 'a9b8c7d6-e5f4-3210-9876-543210fedcba',
		},
		{
			id: 'pm-013',
			name: 'Confluence',
			skillSetId: 'a9b8c7d6-e5f4-3210-9876-543210fedcba',
		},
		{
			id: 'pm-014',
			name: 'Microsoft Project',
			skillSetId: 'a9b8c7d6-e5f4-3210-9876-543210fedcba',
		},
		{
			id: 'pm-015',
			name: 'Slack',
			skillSetId: 'a9b8c7d6-e5f4-3210-9876-543210fedcba',
		},

		// BA Skills (skillSetId: 3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890)
		{
			id: 'ba-001',
			name: 'Requirements Analysis',
			skillSetId: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890',
		},
		{
			id: 'ba-002',
			name: 'Business Process Modeling',
			skillSetId: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890',
		},
		{
			id: 'ba-003',
			name: 'Data Analysis',
			skillSetId: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890',
		},
		{
			id: 'ba-004',
			name: 'Stakeholder Analysis',
			skillSetId: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890',
		},
		{
			id: 'ba-005',
			name: 'Use Case Development',
			skillSetId: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890',
		},
		{
			id: 'ba-006',
			name: 'User Story Writing',
			skillSetId: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890',
		},
		{
			id: 'ba-007',
			name: 'SQL',
			skillSetId: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890',
		},
		{
			id: 'ba-008',
			name: 'Excel',
			skillSetId: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890',
		},
		{
			id: 'ba-009',
			name: 'Power BI',
			skillSetId: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890',
		},
		{
			id: 'ba-010',
			name: 'Tableau',
			skillSetId: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890',
		},
		{
			id: 'ba-011',
			name: 'BPMN',
			skillSetId: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890',
		},
		{
			id: 'ba-012',
			name: 'UML',
			skillSetId: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890',
		},
		{
			id: 'ba-013',
			name: 'Wireframing',
			skillSetId: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890',
		},
		{
			id: 'ba-014',
			name: 'Gap Analysis',
			skillSetId: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890',
		},
		{
			id: 'ba-015',
			name: 'Documentation',
			skillSetId: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7890',
		},

		// UXUI Skills (skillSetId: 8f9e0d1c-2b3a-4958-6776-5544332211aa)
		{
			id: 'uxui-001',
			name: 'User Research',
			skillSetId: '8f9e0d1c-2b3a-4958-6776-5544332211aa',
		},
		{
			id: 'uxui-002',
			name: 'Wireframing',
			skillSetId: '8f9e0d1c-2b3a-4958-6776-5544332211aa',
		},
		{
			id: 'uxui-003',
			name: 'Prototyping',
			skillSetId: '8f9e0d1c-2b3a-4958-6776-5544332211aa',
		},
		{
			id: 'uxui-004',
			name: 'Figma',
			skillSetId: '8f9e0d1c-2b3a-4958-6776-5544332211aa',
		},
		{
			id: 'uxui-005',
			name: 'Adobe XD',
			skillSetId: '8f9e0d1c-2b3a-4958-6776-5544332211aa',
		},
		{
			id: 'uxui-006',
			name: 'Sketch',
			skillSetId: '8f9e0d1c-2b3a-4958-6776-5544332211aa',
		},
		{
			id: 'uxui-007',
			name: 'Photoshop',
			skillSetId: '8f9e0d1c-2b3a-4958-6776-5544332211aa',
		},
		{
			id: 'uxui-008',
			name: 'Illustrator',
			skillSetId: '8f9e0d1c-2b3a-4958-6776-5544332211aa',
		},
		{
			id: 'uxui-009',
			name: 'InVision',
			skillSetId: '8f9e0d1c-2b3a-4958-6776-5544332211aa',
		},
		{
			id: 'uxui-010',
			name: 'User Testing',
			skillSetId: '8f9e0d1c-2b3a-4958-6776-5544332211aa',
		},
		{
			id: 'uxui-011',
			name: 'Usability Testing',
			skillSetId: '8f9e0d1c-2b3a-4958-6776-5544332211aa',
		},
		{
			id: 'uxui-012',
			name: 'A/B Testing',
			skillSetId: '8f9e0d1c-2b3a-4958-6776-5544332211aa',
		},
		{
			id: 'uxui-013',
			name: 'Design Systems',
			skillSetId: '8f9e0d1c-2b3a-4958-6776-5544332211aa',
		},
		{
			id: 'uxui-014',
			name: 'Accessibility',
			skillSetId: '8f9e0d1c-2b3a-4958-6776-5544332211aa',
		},
		{
			id: 'uxui-015',
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
