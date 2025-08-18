import * as fs from 'fs';
import * as path from 'path';
import * as pug from 'pug';

// Sample data for rendering templates
const sampleData = {
	// Common user data
	fullName: 'John Doe',
	email: 'john.doe@example.com',

	// OTP related
	otpCode: '123456',

	// Account related
	password: 'TempPassword123',
	username: 'john.doe',

	// Group related
	groupName: 'AI Research Team',
	oldLeaderName: 'Jane Smith',
	newLeaderName: 'John Doe',
	memberName: 'Alice Johnson',
	actionType: 'added', // or 'removed'

	// Request related
	requesterName: 'Bob Wilson',
	requestType: 'Join Request',
	status: 'approved', // or 'rejected'
	requestDetails: 'Request to join AI Research Team',

	// Thesis related
	thesisTitle: 'Advanced Machine Learning Applications in Healthcare',
	lecturerName: 'Dr. Michael Brown',
	reviewerName: 'Prof. Sarah Davis',

	// Semester related
	semesterName: 'Fall 2025',
	semesterStatus: 'ongoing', // or 'picking', 'preparing'

	// Supervision related
	supervisionDate: '2025-08-25',
	supervisionTime: '10:00 AM',
	supervisionLocation: 'Room 301, Building A',

	// Enrollment related
	enrollmentStatus: 'accepted', // or 'rejected'
	enrollmentReason: 'All requirements met successfully',

	// Alert related
	alertType: 'insufficient_thesis',
	alertMessage: 'There are not enough thesis topics available for students',
	count: 15,

	// Review related
	reviewTitle: 'Midterm Review',
	reviewFeedback:
		'Good progress on the implementation. Please focus more on testing.',

	// Application related
	applicationStatus: 'approved',
	applicationComments:
		'Your thesis proposal has been approved. Please proceed with the research.',

	// Assignment related
	assignmentType: 'thesis',
	assignmentDetails:
		'You have been assigned to work on AI applications in healthcare',
};

const templatesDir = path.join(__dirname, '../src/queue/email/templates');
const outputDir = path.join(__dirname, '../rendered-templates');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true });
}

function renderTemplate(templatePath: string, data: any): string {
	try {
		return pug.renderFile(templatePath, data);
	} catch (error) {
		console.error(`Error rendering ${templatePath}:`, error);
		return `<html><body><h1>Error rendering template</h1><p>${error}</p></body></html>`;
	}
}

function renderAllTemplates() {
	const templateFiles = fs
		.readdirSync(templatesDir)
		.filter(
			(file) => file.endsWith('.pug') && !file.startsWith('email-layout'),
		);

	console.log(`Found ${templateFiles.length} template files to render:`);

	templateFiles.forEach((templateFile) => {
		console.log(`Rendering ${templateFile}...`);

		const templatePath = path.join(templatesDir, templateFile);
		const outputFileName = templateFile.replace('.pug', '.html');
		const outputPath = path.join(outputDir, outputFileName);

		// Customize data based on template type
		const templateData = { ...sampleData };

		// Add specific data based on template name
		if (templateFile.includes('otp')) {
			templateData.otpCode = '654321';
		} else if (templateFile.includes('lecturer-account')) {
			templateData.fullName = 'Dr. Michael Brown';
			templateData.email = 'michael.brown@university.edu';
		} else if (templateFile.includes('student-account')) {
			templateData.fullName = 'Alice Johnson';
			templateData.email = 'alice.johnson@student.edu';
		} else if (templateFile.includes('group-deletion')) {
			templateData.groupName = 'Data Science Team';
		} else if (templateFile.includes('enrollment-result')) {
			templateData.enrollmentStatus =
				Math.random() > 0.5 ? 'accepted' : 'rejected';
		}

		const html = renderTemplate(templatePath, templateData);
		fs.writeFileSync(outputPath, html);

		console.log(`✅ Rendered: ${outputFileName}`);
	});

	console.log(`\n🎉 All templates rendered successfully!`);
	console.log(`📁 Output directory: ${outputDir}`);
}

// Create an HTML overview file that links to all rendered templates
function createOverviewFile() {
	const templateFiles = fs
		.readdirSync(templatesDir)
		.filter(
			(file) => file.endsWith('.pug') && !file.startsWith('email-layout'),
		);

	const overviewHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TheSync Email Templates Overview</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .template-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        .template-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .template-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 20px rgba(0,0,0,0.15);
        }
        .template-name {
            font-size: 1.2em;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        .template-description {
            color: #666;
            margin-bottom: 15px;
            font-size: 0.9em;
        }
        .view-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
            transition: opacity 0.2s;
        }
        .view-btn:hover {
            opacity: 0.9;
        }
        .info {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📧 TheSync Email Templates</h1>
        <p>Preview of all email templates rendered with sample data</p>
    </div>
    
    <div class="info">
        <strong>ℹ️ Note:</strong> All templates are rendered with sample data for preview purposes. 
        In production, these templates will be populated with real data from the application.
    </div>
    
    <div class="template-grid">
        ${templateFiles
					.map((file) => {
						const htmlFile = file.replace('.pug', '.html');
						const templateName = file
							.replace('.pug', '')
							.replace(/-/g, ' ')
							.replace(/\b\w/g, (l) => l.toUpperCase());

						// Add descriptions for each template
						const descriptions = {
							'Send Otp':
								'One-time password for account verification and password reset',
							'Send Reset Password': 'Password reset confirmation email',
							'Send Student Account':
								'Welcome email with login credentials for new students',
							'Send Lecturer Account':
								'Welcome email with login credentials for new lecturers',
							'Send Group Deletion Notification':
								'Notification when a group is deleted',
							'Send Group Leader Change Notification':
								'Notification when group leadership changes',
							'Send Group Member Change Notification':
								'Notification when members are added/removed from group',
							'Send Invite Request Notification':
								'Notification for group invitation requests',
							'Send Join Request Notification':
								'Notification for group join requests',
							'Send Request Status Update':
								'Update on request approval/rejection status',
							'Send Enrollment Result Notification':
								'Results of enrollment applications',
							'Send Thesis Application Notification':
								'Thesis application status updates',
							'Send Thesis Assignment Notification':
								'Notification of thesis topic assignment',
							'Send Thesis Status Change': 'Updates on thesis progress status',
							'Send Review Completed Notification':
								'Notification when reviews are completed',
							'Send Reviewer Assignment Notification':
								'Assignment of review responsibilities',
							'Send Supervision Notification':
								'Scheduling of supervision meetings',
							'Send Semester Ongoing Notification':
								'Semester start notifications',
							'Send Semester Picking Notification':
								'Group formation period notifications',
							'Send Semester Preparing Notification':
								'Semester preparation notifications',
							'Send Moderator Insufficient Thesis Alert':
								'Alert for insufficient thesis topics',
							'Send Moderator Ungrouped Students Alert':
								'Alert for students without groups',
							'Send Moderator Unpicked Groups Alert':
								'Alert for groups without thesis topics',
						};

						return `
            <div class="template-card">
                <div class="template-name">${templateName}</div>
                <div class="template-description">${
									descriptions[templateName] ||
									'Email template for system notifications'
								}</div>
                <a href="${htmlFile}" class="view-btn" target="_blank">View Template</a>
            </div>
          `;
					})
					.join('')}
    </div>
    
    <div style="text-align: center; margin-top: 40px; color: #666;">
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p>Total templates: ${templateFiles.length}</p>
    </div>
</body>
</html>
  `;

	const overviewPath = path.join(outputDir, 'index.html');
	fs.writeFileSync(overviewPath, overviewHtml);

	console.log(`📋 Overview file created: index.html`);
	console.log(`🌐 Open ${overviewPath} in your browser to view all templates`);
}

// Main execution
console.log('🚀 Starting Pug template rendering...\n');

renderAllTemplates();
createOverviewFile();

console.log('\n✨ Rendering complete!');
console.log(
	`📖 Open the overview file to browse all templates: ${path.join(outputDir, 'index.html')}`,
);
