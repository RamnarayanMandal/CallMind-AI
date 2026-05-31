const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://ramnarayan:Ram1234@cluster0.hk4ehir.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/ai-voice-agent';

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Update all organizations to use Vobiz with the provided credentials
    const result = await db.collection('organizations').updateMany(
      {},
      {
        $set: {
          telephonyProviderName: 'vobiz',
          telephonyAccountId: 'MA_OUHW1CN9',
          telephonyAuthToken: 'Qq0wglDvseS3TYNDGuNvEl6O7ZX5Z6W1e0CzTPYbgnTNnyAuxN39WqgXGf0WEwtT',
          telephonyPhoneNumber: '+911171366938'
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} organizations.`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
