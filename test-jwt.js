const jwt = require('jsonwebtoken');

// Your JWT secret
const JWT_SECRET = 'b5f3bb01dd3f8101244ab0d524d5dac38fdc6ca0d46e99a82a2d822c57982965e748b7e0f922b5ea6ec723e1fd964959b94972e9c697d446a5a34073655d3dce';

// Test data
const testData = {
    userId: 'test123',
    email: 'test@example.com'
};

// Test signing a token
const token = jwt.sign(testData, JWT_SECRET);
console.log('Generated Token:', token);

// Test verifying the token
try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token verified successfully!');
    console.log('Decoded data:', decoded);
} catch (error) {
    console.error('Token verification failed:', error);
} 