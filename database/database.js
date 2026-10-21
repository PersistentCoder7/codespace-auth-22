const mongoose = require('mongoose');

const MONGODB_URL = process.env.MONGODB_URL;

exports.connect = () => {
    mongoose.connect(MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true

    })
    .then()
    .catch(error => {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    });
}