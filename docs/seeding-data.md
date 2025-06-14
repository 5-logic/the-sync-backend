# 🌱 Seeding Data Guide

> Complete guide for seeding initial data into TheSync database.

## 📑 Table of Contents

- [Overview](#-overview)
- [Prerequisites](#-prerequisites)
- [Available Seed Data](#-available-seed-data)
- [Running the Seed Script](#-running-the-seed-script)
- [Seed Data Details](#-seed-data-details)
- [Troubleshooting](#-troubleshooting)
- [Custom Seeding](#-custom-seeding)

## 🔍 Overview

The seeding process populates your database with essential initial data required for the application to function properly. This includes:

- Default admin account
- Academic majors
- Responsibility roles
- Skill sets and skills

## ✅ Prerequisites

Before running the seed script, ensure you have:

1. **Database Setup**: PostgreSQL database running and configured
2. **Environment Variables**: Properly configured `.env` file (see [Environment Setup Guide](./environment-setup.md))
3. **Prisma Migration**: Database schema up to date

```bash
# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:dev
```

## 📊 Available Seed Data

The seed script includes the following data categories:

### 👤 Admin Account

- **Username**: `admin`
- **Password**: `FPTUniversity@2025`
- **Purpose**: Default administrator access

### 🎓 Academic Majors

- **Software Engineering** (Code: SE)
- **Artificial Intelligence** (Code: AI)

### 📋 Responsibilities (18 roles)

#### Software Engineering Roles:

- Backend, Frontend, Fullstack
- DevOps, QA, Architect
- PM, BA, UXUI

#### AI Roles:

- Data Scientist, ML Engineer, Data Engineer
- AI Engineer, AI PM, AI Ethicist
- Prompt Engineer, Model Validator, UX for AI

### 📦 Skill Sets (18 categories)

Each responsibility has a corresponding skill set containing relevant technical skills.

### 🛠️ Skills (300+ skills)

Comprehensive list of technical skills organized by skill sets:

- **Backend**: Node.js, Express.js, NestJS, Python, Django, FastAPI, Java, Spring Boot, etc.
- **Frontend**: HTML, CSS, JavaScript, TypeScript, React, Vue.js, Angular, Next.js, etc.
- **DevOps**: Docker, Kubernetes, AWS, Azure, Jenkins, GitHub Actions, Terraform, etc.
- **AI/ML**: TensorFlow, PyTorch, Scikit-learn, OpenCV, NLTK, Transformers, etc.
- **And many more...**

## 🚀 Running the Seed Script

### Basic Usage

```bash
# Run the complete seed process
pnpm seed
```

### Expected Output

```bash
👤 Admin seeded successfully
🎓 Major seeded successfully
📋 Responsibilities seeded successfully
📦 Skill sets seeded successfully
🛠️ Skills seeded successfully
```

### Verification

After seeding, you can verify the data using Prisma Studio:

```bash
pnpm prisma:studio
```

Or check specific tables:

```bash
# Check admin account
pnpm prisma:studio
# Navigate to 'admins' table

# Check majors
# Navigate to 'majors' table

# Check skills count
# Navigate to 'skills' table - should show 300+ records
```

## 📋 Seed Data Details

### Admin Credentials

```typescript
Username: admin
Password: FPTUniversity@2025
```

⚠️ **Security Note**: Change the default admin password in production!

### Skill Set Structure

Each skill set contains 10-20 relevant skills:

| Skill Set   | Sample Skills                                             |
| ----------- | --------------------------------------------------------- |
| Backend     | Node.js, Express.js, NestJS, Python, Django, PostgreSQL   |
| Frontend    | React, Vue.js, Angular, TypeScript, Tailwind CSS, Next.js |
| DevOps      | Docker, Kubernetes, AWS, Jenkins, Terraform, Ansible      |
| AI Engineer | TensorFlow, PyTorch, OpenCV, NLTK, Computer Vision, NLP   |

### Data Relationships

```
Major
├── Students (belongs to major)

Responsibility
├── Student Expected Responsibilities
├── Group Expected Responsibilities

Skill Set
├── Skills (multiple skills per skill set)
    ├── Student Skills (with proficiency levels)
    ├── Group Required Skills
    └── Thesis Required Skills
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Error

```bash
Error: Cannot find module '@/utils/hash.util'
```

**Solution**: Ensure you're running from the project root directory and all dependencies are installed.

#### 2. Migration Required

```bash
Error: Database schema is not up to date
```

**Solution**: Run migrations first:

```bash
pnpm prisma:dev
```

#### 3. Duplicate Entry Error

```bash
Error: Unique constraint failed
```

**Solution**: The seed script uses `upsert` operations, so this shouldn't occur. If it does, check for manual data entry conflicts.

#### 4. Permission Error

```bash
Error: Database connection refused
```

**Solution**: Verify your database is running and `.env` configuration is correct.

### Debug Mode

To see detailed logs during seeding:

```bash
# Set debug environment
DEBUG=prisma:* pnpm seed
```

## 🔨 Custom Seeding

### Adding New Data

To add new seed data, modify `scripts/seed.ts`:

```typescript
const seedCustomData = async () => {
	const customData = [{ name: 'Custom Item', value: 'Custom Value' }];

	await prisma.customModel.createMany({
		data: customData,
		skipDuplicates: true,
	});

	console.log('🎯 Custom data seeded successfully');
};

// Add to main function
async function main() {
	// ...existing seeds...
	await seedCustomData();
}
```

### Selective Seeding

To run only specific seed functions:

```typescript
async function main() {
  try {
    await prisma.$connect();

    // Comment out unwanted seeds
    await seedAdmin();
    // await seedMajor();
    // await seedResponsibility();
    await seedSkillSets();
    await seedSkills();
  }
  // ...
}
```

### Production Considerations

For production environments:

1. **Backup**: Always backup before seeding production data
2. **Environment**: Use production-safe passwords and data
3. **Selective**: Only seed essential data, not test data
4. **Monitoring**: Monitor the seeding process for large datasets

```bash
# Production-safe seeding
NODE_ENV=production pnpm seed
```

## 📝 Next Steps

After successful seeding:

1. **Test Login**: Try logging in with the admin account
2. **API Testing**: Test APIs that depend on seeded data
3. **Data Verification**: Verify relationships and constraints
4. **Documentation**: Update team on available test data

## 🔗 Related Documentation

- [Environment Setup Guide](./environment-setup.md)
- [Database Schema Documentation](../prisma/schema.prisma)
- [API Documentation](http://localhost:4000/swagger) (when server is running)

---

**Need Help?** If you encounter issues not covered in this guide, please check the main [README](../README.md) or contact the development team.
