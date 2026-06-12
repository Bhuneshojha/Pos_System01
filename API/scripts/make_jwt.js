#!/usr/bin/env node
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'please-change-me';

const argv = require('minimist')(process.argv.slice(2));
const userId = argv.user_id || argv.u || 1;
const storeId = argv.store_id || argv.s || 1;
const username = argv.username || argv.name || 'dev';
const expiresIn = argv.exp || '7d';

const payload = {
  user_id: Number(userId),
  store_id: Number(storeId),
  username,
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn });
console.log(token);
