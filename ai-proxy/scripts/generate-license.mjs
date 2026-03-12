import crypto from 'node:crypto';

const prefix = process.argv[2] || 'DF';
const key = [
  prefix,
  crypto.randomBytes(4).toString('hex').toUpperCase(),
  crypto.randomBytes(4).toString('hex').toUpperCase(),
  crypto.randomBytes(4).toString('hex').toUpperCase()
].join('-');

console.log(key);
