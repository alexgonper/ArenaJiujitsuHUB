const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n' + '='.repeat(60));
console.log('🥋  ARENA MATRIX - Backend Setup');
console.log('='.repeat(60) + '\n');

console.log('This script will help you configure your backend.\n');

// Questions
const questions = [
    {
        key: 'PORT',
        question: 'Server port (default: 5000): ',
        default: '5000'
    },
    {
        key: 'MONGODB_URI',
        question: 'MongoDB URI (default: mongodb://localhost:27017/arena-matrix): ',
        default: 'mongodb://localhost:27017/arena-matrix'
    },
    {
        key: 'CORS_ORIGIN',
        question: 'CORS origins (comma-separated, default: http://localhost:3000): ',
        default: 'http://localhost:3000'
    }
];

let config = {};
let currentQuestion = 0;

function askQuestion() {
    if (currentQuestion >= questions.length) {
        createEnvFile();
        return;
    }

    const q = questions[currentQuestion];
    rl.question(q.question, (answer) => {
        config[q.key] = answer.trim() || q.default;
        currentQuestion++;
        askQuestion();
    });
}

function createEnvFile() {
    console.log('\n📝 Creating .env file...\n');

    const envContent = `# Arena Matrix Backend Configuration
# Generated on ${new Date().toISOString()}

# Server Configuration
PORT=${config.PORT}
NODE_ENV=development

# Database Configuration
MONGODB_URI=${config.MONGODB_URI}

# API Configuration
API_PREFIX=/api/v1

# Security
CORS_ORIGIN=${config.CORS_ORIGIN}
JWT_SECRET=${generateRandomString(32)}

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Optional: Gemini AI Integration
GEMINI_API_KEY=

# Optional: Email Service
EMAIL_SERVICE=
EMAIL_USER=
EMAIL_PASSWORD=
`;

    const envPath = path.join(__dirname, '..', '.env');
    fs.writeFileSync(envPath, envContent);

    console.log('✅ .env file created successfully!\n');
    console.log('📋 Configuration Summary:');
    console.log(`   Port: ${config.PORT}`);
    console.log(`   Database: ${config.MONGODB_URI}`);
    console.log(`   CORS: ${config.CORS_ORIGIN}\n`);

    console.log('📚 Next Steps:\n');
    console.log('1. Install dependencies:');
    console.log('   npm install\n');
    console.log('2. Make sure MongoDB is running:');
    console.log('   brew services start mongodb-community');
    console.log('   OR use MongoDB Atlas cloud\n');
    console.log('3. Seed the database:');
    console.log('   npm run seed\n');
    console.log('4. Start the server:');
    console.log('   npm run dev (development)');
    console.log('   npm start (production)\n');

    console.log('='.repeat(60));
    console.log('🎉 Setup complete! Happy coding!');
    console.log('='.repeat(60) + '\n');

    rl.close();
}

function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Start the setup
askQuestion();
