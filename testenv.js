require('dotenv').config({ path: 'C:/Users/zidan/custom/path/.env' });

console.log('MONGO_URI:', process.env.MONGO_URI);
console.log('SESSION_SECRET:', process.env.SESSION_SECRET);
