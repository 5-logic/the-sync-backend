import { Gender, PrismaClient, SemesterStatus } from '../generated/prisma';
import { CONSTANTS } from '../src/configs/constant.config';
import { hash } from '../src/utils/hash.util';

const prisma = new PrismaClient();

const seedAdmins = async () => {
	const admins = [
		'admin',
		'hardingadonis',
		'bakaqc',
		'htnghia1423',
		'siddle1512',
		'yuhtnguyen',
	];

	const hashPassword = await hash('FPTUniversity@2025');

	const operations = admins.map((u) =>
		prisma.admin.upsert({
			where: { username: u },
			update: {},
			create: { username: u, password: hashPassword },
		}),
	);

	await prisma.$transaction(operations);

	console.log('👤 Admin seeded successfully');
};

const seedMajors = async () => {
	const majors = [
		{
			id: '476723ef-1eb2-4a00-944c-1bef7054c44a',
			name: 'Software Engineering',
			code: 'SE',
		},
		{
			id: '45395511-36c9-43f1-83ac-9ae65f708dbc',
			name: 'Artificial Intelligence',
			code: 'AI',
		},
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

const seedResponsibilities = async () => {
	const responsibilities = [
		// Software Engineering
		{ id: 'a485b1a7-6ce5-4a64-b087-11ef57772897', name: 'Backend' },
		{ id: 'f06a27c3-5ed5-405f-9bd8-469da9992aeb', name: 'Frontend' },
		{ id: 'eb0e7575-63c4-43af-8a36-5385e00d5d86', name: 'DevOps' },
		{ id: '058a6080-6269-47bf-a34a-02634a5f101f', name: 'BA' },
		{ id: '6746805b-f082-47e0-b670-0e9cc8048292', name: 'AI' },
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

const seedLectuers = async () => {
	const lecturers = [
		{
			id: '11e9f2f2-6054-45dc-a1cb-e798ca82a878',
			fullName: 'Lê Minh Vương - Lecturer',
			email: 'hardingadonis@gmail.com',
			gender: Gender.Male,
			phoneNumber: '0367834567',
		},
		{
			id: 'd9962353-8ce7-4317-ba1f-0bc736453a20',
			fullName: 'Đinh Quốc Chương - Lecturer',
			email: 'quocchuong3k@gmail.com',
			gender: Gender.Male,
			phoneNumber: '0343567890',
		},
		{
			id: '9e82e70a-7d96-4847-af9b-1717422d7237',
			fullName: 'Nguyễn Thị Thuý - Lecturer',
			email: 'nguyenthithuy1022003@gmail.com',
			gender: Gender.Female,
			phoneNumber: '0374567123',
		},
		{
			id: '8d0e3690-ebac-4970-8bf7-e306670e99d8',
			fullName: 'Hứa Đức Bình - Lecturer',
			email: 'binhbobinhbo22@gmail.com',
			gender: Gender.Male,
			phoneNumber: '0381234567',
		},
		{
			id: 'be5a6ec4-c988-4e9e-adfb-9d252b5fd8d5',
			fullName: 'Hồ Trọng Nghĩa - Lecturer',
			email: 'htn10a2@gmail.com',
			gender: Gender.Male,
			phoneNumber: '0365678123',
		},
	];

	await prisma.$transaction(
		async (tx) => {
			for (const lecturer of lecturers) {
				await tx.user.upsert({
					where: { id: lecturer.id },
					update: {},
					create: {
						id: lecturer.id,
						fullName: lecturer.fullName,
						email: lecturer.email,
						password: await hash('FPTUniversity@2025'),
						gender: lecturer.gender,
						phoneNumber: lecturer.phoneNumber,
					},
				});

				await tx.lecturer.upsert({
					where: { userId: lecturer.id },
					update: {},
					create: { userId: lecturer.id },
				});
			}
		},
		{ timeout: CONSTANTS.TIMEOUT },
	);

	console.log('👨‍🏫 Lecturers seeded successfully');
};

const seedSemesters = async () => {
	await prisma.semester.upsert({
		where: { id: '6969801d-77b6-48a3-b398-228971c80f40' },
		update: {},
		create: {
			id: '6969801d-77b6-48a3-b398-228971c80f40',
			name: 'Summer 2025',
			code: 'SU25',
			status: SemesterStatus.Preparing,
		},
	});

	console.log('📅 Semester seeded successfully');
};

const seedStudents = async () => {
	const students = [
		// Existing students
		{
			id: '94116d81-8602-4bca-90f9-9f2092194427',
			fullName: 'Lê Minh Vương - Student',
			email: 'vuonglmqe170148@fpt.edu.vn',
			gender: Gender.Male,
			phoneNumber: '0367891234',
			studentCode: 'QE170148',
			majorId: '476723ef-1eb2-4a00-944c-1bef7054c44a',
		},
		{
			id: '7f0c713f-54e5-4823-a889-82d34335faf9',
			fullName: 'Đinh Quốc Chương - Student',
			email: 'chuongdqqe170097@fpt.edu.vn',
			gender: Gender.Male,
			phoneNumber: '0342567890',
			studentCode: 'QE170097',
			majorId: '476723ef-1eb2-4a00-944c-1bef7054c44a',
		},
		{
			id: '00cf05b8-2d30-4707-a339-191e3cf4f054',
			fullName: 'Nguyễn Thị Thuý - Student',
			email: 'thuyntqe170033@fpt.edu.vn',
			gender: Gender.Female,
			phoneNumber: '0373456789',
			studentCode: 'QE170033',
			majorId: '476723ef-1eb2-4a00-944c-1bef7054c44a',
		},
		{
			id: 'f0426864-60e3-449f-a280-bf6fba84df73',
			fullName: 'Hứa Đức Bình - Student',
			email: 'binhhdqe170217@fpt.edu.vn',
			gender: Gender.Male,
			phoneNumber: '0384567890',
			studentCode: 'QE170217',
			majorId: '476723ef-1eb2-4a00-944c-1bef7054c44a',
		},
		{
			id: '0c1ba461-751a-4369-a035-e94a1c07a1ce',
			fullName: 'Hồ Trọng Nghĩa - Student',
			email: 'nghiahtqe170173@fpt.edu.vn',
			gender: Gender.Male,
			phoneNumber: '0365678901',
			studentCode: 'QE170173',
			majorId: '476723ef-1eb2-4a00-944c-1bef7054c44a',
		},
		// New students - AI Major
		{
			id: 'da9c0a28-23e9-4f56-bbc2-435be3e3a6b9',
			fullName: 'Võ Ngọc Bảo Hân - Student',
			email: 'bakaqc.dev@gmail.com',
			gender: Gender.Female,
			phoneNumber: '0367123456',
			studentCode: 'QE170224',
			majorId: '45395511-36c9-43f1-83ac-9ae65f708dbc',
		},
		{
			id: 'a195481d-fd23-4788-bf9e-ce9d9dd5cc25',
			fullName: 'Phạm Hoàng Gia Tiên - Student',
			email: 'thesync.team001@gmail.com',
			gender: Gender.Male,
			phoneNumber: '0342345678',
			studentCode: 'QE170223',
			majorId: '45395511-36c9-43f1-83ac-9ae65f708dbc',
		},
		{
			id: 'cbe9cf90-6e4f-44d3-85df-e1802155b53f',
			fullName: 'Trần Hoài Ngọc Linh - Student',
			email: 'brainbox.platform@gmail.com',
			gender: Gender.Female,
			phoneNumber: '0373567890',
			studentCode: 'QE170222',
			majorId: '45395511-36c9-43f1-83ac-9ae65f708dbc',
		},
		{
			id: 'e039c081-5597-4ee4-9765-35c65af04d3f',
			fullName: 'Nguyễn Văn Tính - Student',
			email: 'evora.17c@gmail.com',
			gender: Gender.Male,
			phoneNumber: '0384789012',
			studentCode: 'QE170321',
			majorId: '45395511-36c9-43f1-83ac-9ae65f708dbc',
		},
		{
			id: '1ec74aa9-7af4-4bbc-851f-a9cbacbd2d97',
			fullName: 'Đào Văn Tấn - Student',
			email: 'quocchuong2609@gmail.com',
			gender: Gender.Male,
			phoneNumber: '0368901234',
			studentCode: 'QE170111',
			majorId: '45395511-36c9-43f1-83ac-9ae65f708dbc',
		},
		// New students - SE Major
		{
			id: '61f19625-ca32-4bee-b04c-58f6dd72710f',
			fullName: 'Lê Minh Thịnh - Student',
			email: 'nghiaht1423@gmail.com',
			gender: Gender.Male,
			phoneNumber: '0343456789',
			studentCode: 'QE170568',
			majorId: '476723ef-1eb2-4a00-944c-1bef7054c44a',
		},
		{
			id: '8655bbb2-562d-4565-b5da-76676954ca89',
			fullName: 'Trần Minh Nguyệt - Student',
			email: 'thunderstorm3846@gmail.com',
			gender: Gender.Female,
			phoneNumber: '0374567890',
			studentCode: 'QE170845',
			majorId: '476723ef-1eb2-4a00-944c-1bef7054c44a',
		},
		{
			id: '8ec9135f-75e3-4e82-9448-caf5ec67bd97',
			fullName: 'Đào Minh Nghĩa - Student',
			email: 'hotrongnghia745@gmail.com',
			gender: Gender.Male,
			phoneNumber: '0385678901',
			studentCode: 'QE170973',
			majorId: '476723ef-1eb2-4a00-944c-1bef7054c44a',
		},
		{
			id: 'bf74f327-1aba-4181-b227-9403c834d800',
			fullName: 'Dương Minh Hoàng - Student',
			email: 'htn11a2@gmail.com',
			gender: Gender.Male,
			phoneNumber: '0366789012',
			studentCode: 'QE170549',
			majorId: '476723ef-1eb2-4a00-944c-1bef7054c44a',
		},
		{
			id: '82480571-2758-4def-90ab-f65e87c99913',
			fullName: 'Trần Thanh Hùng - Student',
			email: 'tranthanhhung3846@gmail.com',
			gender: Gender.Male,
			phoneNumber: '0347890123',
			studentCode: 'QE170008',
			majorId: '476723ef-1eb2-4a00-944c-1bef7054c44a',
		},
		{
			id: '77f2d469-229d-4d68-ae41-000307320a38',
			fullName: 'Ngô Thanh Nhung - Student',
			email: 'htnfptqn@gmail.com',
			gender: Gender.Female,
			phoneNumber: '0378901234',
			studentCode: 'QE170335',
			majorId: '476723ef-1eb2-4a00-944c-1bef7054c44a',
		},
		{
			id: '2cdf58e3-53d4-4cd6-b035-fd51c7e02d4c',
			fullName: 'Trần Đức Lễ - Student',
			email: 'htnghia12a2@gmail.com',
			gender: Gender.Male,
			phoneNumber: '0389012345',
			studentCode: 'QE170875',
			majorId: '476723ef-1eb2-4a00-944c-1bef7054c44a',
		},
	];

	await prisma.$transaction(
		async (tx) => {
			// Get all responsibilities once for efficiency
			const allResponsibilities = await tx.responsibility.findMany({
				select: { id: true },
			});

			for (const student of students) {
				await tx.user.upsert({
					where: { id: student.id },
					update: {},
					create: {
						id: student.id,
						fullName: student.fullName,
						email: student.email,
						password: await hash('FPTUniversity@2025'),
						gender: student.gender,
						phoneNumber: student.phoneNumber,
					},
				});

				await tx.student.upsert({
					where: { userId: student.id },
					update: {},
					create: {
						userId: student.id,
						studentCode: student.studentCode,
						majorId: student.majorId,
					},
				});

				await tx.enrollment.upsert({
					where: {
						studentId_semesterId: {
							studentId: student.id,
							semesterId: '6969801d-77b6-48a3-b398-228971c80f40',
						},
					},
					update: {},
					create: {
						studentId: student.id,
						semesterId: '6969801d-77b6-48a3-b398-228971c80f40',
					},
				});

				// Create associations with all responsibilities
				if (allResponsibilities.length > 0) {
					// Delete existing responsibility associations first
					await tx.studentResponsibility.deleteMany({
						where: { studentId: student.id },
					});

					// Create new associations with all responsibilities
					await tx.studentResponsibility.createMany({
						data: allResponsibilities.map((responsibility) => ({
							studentId: student.id,
							responsibilityId: responsibility.id,
							level: Math.floor(Math.random() * 6),
						})),
					});

					console.log(
						`✅ Created ${allResponsibilities.length} responsibility associations for student ${student.studentCode}`,
					);
				}
			}
		},
		{ timeout: CONSTANTS.TIMEOUT },
	);

	console.log('👩‍🎓 Students seeded successfully');
};

async function main() {
	try {
		await prisma.$connect();

		await seedAdmins();
		await seedMajors();
		await seedResponsibilities();
		await seedLectuers();
		await seedSemesters();
		await seedStudents();
	} catch (error) {
		console.error('Seed failed:', error);

		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

void main();
