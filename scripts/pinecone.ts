import { Pinecone } from '@pinecone-database/pinecone';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Script for managing Pinecone data operations
// Note: Export function saves vector IDs and metadata in format: [{ "id": "...", "metadata": { ... } }]
//       Import function supports both old and new formats and uses upsertRecords (no vector values needed)
// Usage:
// - pnpm pinecone: Interactive menu to choose operations
// - pnpm pinecone export: Export vector IDs and metadata from Pinecone to JSON file
// - pnpm pinecone import: Import data from JSON file to Pinecone using upsertRecords method
// - pnpm pinecone clear: Clear all data from Pinecone namespace

const NAMESPACE = 'pinecone-thesis-namespace';
const DATA_FILE = path.join(__dirname, 'pinecone_data.json');

// Initialize Pinecone client
const initializePinecone = (): Pinecone => {
	const apiKey = process.env.PINECONE_API_KEY;

	if (!apiKey) {
		console.error('❌ PINECONE_API_KEY environment variable is required');
		process.exit(1);
	}

	return new Pinecone({
		apiKey: apiKey,
	});
};

// Get Pinecone index
const getIndex = (pinecone: Pinecone) => {
	const indexName = process.env.PINECONE_INDEX_NAME;

	if (!indexName) {
		console.error('❌ PINECONE_INDEX_NAME environment variable is required');
		process.exit(1);
	}

	return pinecone.index(indexName);
};

// Export data from Pinecone to JSON file
const exportData = async (): Promise<void> => {
	try {
		console.log('🚀 Starting Pinecone data export...');

		const pinecone = initializePinecone();
		const index = getIndex(pinecone);

		console.log(`📥 Fetching data from namespace: ${NAMESPACE}`);

		// Get index stats to determine if there are any vectors
		const statsResponse = await index.describeIndexStats();

		if (
			!statsResponse.namespaces ||
			!statsResponse.namespaces[NAMESPACE] ||
			statsResponse.namespaces[NAMESPACE].recordCount === 0
		) {
			console.log('⚠️  No data found in Pinecone namespace');
			const emptyData = {
				vectors: [],
				namespace: NAMESPACE,
				exportedAt: new Date().toISOString(),
			};

			fs.writeFileSync(DATA_FILE, JSON.stringify(emptyData, null, 2));
			console.log(`✅ Empty data file created: ${DATA_FILE}`);
			return;
		}

		// Get index dimension from stats
		const dimension = statsResponse.dimension || 1024;
		console.log(`📊 Using index dimension: ${dimension}`);

		// Get all vector IDs by querying with a dummy vector
		const queryResponse = await index.namespace(NAMESPACE).query({
			vector: new Array(dimension).fill(0), // Use actual index dimension
			topK: 10000, // Maximum number of results
			includeMetadata: true,
			includeValues: false, // Don't include vector values to save bandwidth
		});

		if (!queryResponse.matches || queryResponse.matches.length === 0) {
			console.log('⚠️  No data found in Pinecone namespace');
			const emptyData = {
				vectors: [],
				namespace: NAMESPACE,
				exportedAt: new Date().toISOString(),
			};

			fs.writeFileSync(DATA_FILE, JSON.stringify(emptyData, null, 2));
			console.log(`✅ Empty data file created: ${DATA_FILE}`);
			return;
		}

		// Convert matches to new export format (id + metadata structure)
		const vectors = queryResponse.matches.map((match) => ({
			id: match.id,
			metadata: match.metadata || {},
		}));

		const data = {
			vectors,
			namespace: NAMESPACE,
			exportedAt: new Date().toISOString(),
		};

		// Save to JSON file
		fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

		console.log(
			`✅ Successfully exported ${vectors.length} vectors to ${DATA_FILE}`,
		);
	} catch (error) {
		console.error('❌ Error exporting data:', error);
		process.exit(1);
	}
};

// Import data from JSON file to Pinecone
const importData = async (): Promise<void> => {
	try {
		console.log('🚀 Starting Pinecone data import...');

		// Check if data file exists
		if (!fs.existsSync(DATA_FILE)) {
			console.error(`❌ Data file not found: ${DATA_FILE}`);
			console.error('Please run export first or ensure the file exists');
			process.exit(1);
		}

		// Read data from JSON file
		const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
		let data: any;

		try {
			data = JSON.parse(fileContent);
		} catch {
			console.error('❌ Invalid JSON format in data file');
			process.exit(1);
		}

		if (!data.vectors || !Array.isArray(data.vectors)) {
			console.error('❌ Invalid data format: vectors array not found');
			process.exit(1);
		}

		console.log(`📤 Found ${data.vectors.length} vectors to import`);

		if (data.vectors.length === 0) {
			console.log('⚠️  No vectors to import');
			return;
		}

		const pinecone = initializePinecone();
		const index = getIndex(pinecone);

		// Prepare records for import using upsertRecords (similar to thesis processor)
		const records = data.vectors.map((vector: any) => {
			// Handle both old format (with metadata property) and new format (flattened)
			let metadata: Record<string, any>;

			if (vector.metadata) {
				// Old format: { id: "...", metadata: { ... } }
				metadata = vector.metadata;
			} else {
				// New format: { id: "...", prop1: "...", prop2: "..." }
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { id, ...rest } = vector;
				metadata = rest;
			}

			// Create record in the format expected by upsertRecords
			const record = {
				_id: vector.id,
				...metadata,
			};

			return record;
		});

		console.log(
			'📦 Sample record structure:',
			JSON.stringify(records[0], null, 2),
		);

		// Import records in batches using upsertRecords (same approach as thesis processor)
		const batchSize = 100;
		const batches: any[][] = [];

		for (let i = 0; i < records.length; i += batchSize) {
			batches.push(records.slice(i, i + batchSize));
		}

		console.log(`📦 Importing in ${batches.length} batches...`);

		for (let i = 0; i < batches.length; i++) {
			const batch = batches[i];
			console.log(
				`⏳ Processing batch ${i + 1}/${batches.length} (${batch.length} records)`,
			);

			// Use upsertRecords similar to thesis processor
			await index.namespace(NAMESPACE).upsertRecords(batch);
		}

		console.log(
			`✅ Successfully imported ${records.length} records to Pinecone`,
		);
		console.log(
			'💡 Records imported using upsertRecords method (no vector values needed)',
		);
	} catch (error) {
		console.error('❌ Error importing data:', error);
		process.exit(1);
	}
};

// Clear all data from Pinecone namespace
const clearData = async (): Promise<void> => {
	try {
		console.log('🚀 Starting Pinecone data clearing...');

		const pinecone = initializePinecone();
		const index = getIndex(pinecone);

		console.log(`🗑️  Clearing all data from namespace: ${NAMESPACE}`);

		// Delete all vectors in the namespace
		await index.namespace(NAMESPACE).deleteAll();

		console.log('✅ Successfully cleared all data from Pinecone namespace');
	} catch (error) {
		console.error('❌ Error clearing data:', error);
		process.exit(1);
	}
};

// Main function
const main = async (): Promise<void> => {
	const command = process.argv[2];

	// If no command is provided, show interactive menu
	if (!command) {
		await showInteractiveMenu();
		return;
	}

	// Handle direct command line arguments
	switch (command.toLowerCase()) {
		case 'export':
			await exportData();
			break;
		case 'import':
			await importData();
			break;
		case 'clear':
			await clearData();
			break;
		default:
			console.error(`❌ Unknown command: ${command}`);
			console.log('Available commands: export, import, clear');
			console.log('Or run without arguments for interactive menu');
			process.exit(1);
	}
};

// Interactive menu function
const showInteractiveMenu = async (): Promise<void> => {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	const showMenu = () => {
		console.log('\n🔧 Pinecone Data Management Tool');
		console.log('================================');
		console.log('1. Export vector IDs and metadata from Pinecone to JSON file');
		console.log('   Format: [{ "id": "...", "metadata": { ... } }]');
		console.log(
			'2. Import data from JSON file to Pinecone using upsertRecords',
		);
		console.log('   Supports both old and new formats:');
		console.log('   - Old: [{ "id": "...", "metadata": { ... } }]');
		console.log('   - New: [{ "id": "...", "prop1": "...", "prop2": "..." }]');
		console.log('3. Clear all data from Pinecone namespace');
		console.log('4. Exit');
		console.log('================================');
		console.log('Note: Uses upsertRecords method (no vector values needed)');
	};

	const askQuestion = (question: string): Promise<string> => {
		return new Promise((resolve) => {
			rl.question(question, (answer) => {
				resolve(answer.trim());
			});
		});
	};

	const processChoice = async (choice: string): Promise<boolean> => {
		switch (choice) {
			case '1':
				console.log('\n🚀 Starting export process...');
				rl.close();
				await exportData();
				return false; // Exit menu
			case '2':
				console.log('\n🚀 Starting import process...');
				rl.close();
				await importData();
				return false; // Exit menu
			case '3': {
				console.log('\n🚀 Starting clear process...');
				const confirm = await askQuestion(
					'⚠️  Are you sure you want to clear all data? This action cannot be undone. (y/N): ',
				);
				if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
					rl.close();
					await clearData();
				} else {
					console.log('❌ Clear operation cancelled.');
				}
				return false; // Exit menu
			}
			case '4':
				console.log('👋 Goodbye!');
				rl.close();
				return false; // Exit menu
			default:
				console.log('❌ Invalid choice. Please select 1, 2, 3, or 4.');
				return true; // Continue menu
		}
	};

	// Main menu loop
	let continueMenu = true;
	while (continueMenu) {
		showMenu();
		const choice = await askQuestion('Please select an option (1-4): ');
		continueMenu = await processChoice(choice);
	}
};

// Run the script
main().catch((error) => {
	console.error('❌ Unexpected error:', error);
	process.exit(1);
});
