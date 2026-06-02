import bcrypt from 'bcryptjs';
console.log('compare $2b$:', bcrypt.compareSync('password_real', '$2b$10$j3uty7CrEY38qR7v6f7GJucJg8y9izORfVMcuEMxPCtwdjciJB2YC'));
console.log('hashSync:', bcrypt.hashSync('password_real', 10));
