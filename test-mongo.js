
const mongoose = require('mongoose');

// Manually setting URI to ensure it's not an env var issue (copy-pasting from user)
// Using try-catch to print detailed error
const uri = "mongodb+srv://ujjwalp0802_db_user:iP6fR34ZShVGytBB@ujjwalp.aqjbxbg.mongodb.net/finpath?appName=UjjwalP";

console.log("Attempting to connect to:", uri.replace(/:([^@]+)@/, ":****@"));

mongoose.connect(uri)
    .then(() => {
        console.log("✅ Successfully connected to MongoDB!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ Connection failed:");
        console.error(err);
        process.exit(1);
    });
