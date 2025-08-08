import { Pinecone } from '@pinecone-database/pinecone';

/**
 * Script to clear all data from Pinecone index
 * This script will delete all vectors from all namespaces in the Pinecone index
 */
async function clearPineconeData() {
	console.log('🔄 Starting Pinecone data clearing process...');

	// Validate environment variables
	if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
		console.error('❌ Missing required environment variables:');
		console.error('   - PINECONE_API_KEY');
		console.error('   - PINECONE_INDEX_NAME');
		process.exit(1);
	}

	try {
		// Initialize Pinecone client
		const pinecone = new Pinecone({
			apiKey: process.env.PINECONE_API_KEY,
		});

		const indexName = process.env.PINECONE_INDEX_NAME;
		console.log(`📋 Using Pinecone index: ${indexName}`);

		// Get the index
		const index = pinecone.index(indexName);

		// Define known namespaces based on the codebase
		const namespaces = [
			'pinecone-thesis-namespace', // From PineconeThesisProcessor.NAMESPACE
		];

		console.log(`🗂️  Found ${namespaces.length} namespace(s) to clear`);

		// Clear each namespace
		for (const namespace of namespaces) {
			console.log(`🧹 Clearing namespace: ${namespace}`);

			try {
				// Delete all vectors in the namespace
				await index.namespace(namespace).deleteAll();
				console.log(`✅ Successfully cleared namespace: ${namespace}`);
			} catch (error) {
				console.error(`❌ Failed to clear namespace ${namespace}:`, error);
				// Continue with other namespaces even if one fails
			}
		}

		// Also clear the default namespace (if any data exists there)
		console.log('🧹 Clearing default namespace...');
		try {
			await index.deleteAll();
			console.log('✅ Successfully cleared default namespace');
		} catch (error) {
			console.error('❌ Failed to clear default namespace:', error);
		}

		console.log('🎉 Pinecone data clearing process completed!');
		console.log('📊 Summary:');
		console.log(`   - Index: ${indexName}`);
		console.log(
			`   - Namespaces processed: ${namespaces.length + 1} (including default)`,
		);
	} catch (error) {
		console.error('❌ Failed to clear Pinecone data:', error);
		process.exit(1);
	}
}

// Run the script
clearPineconeData()
	.then(() => {
		console.log('🏁 Script execution completed successfully');
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 Script execution failed:', error);
		process.exit(1);
	});
