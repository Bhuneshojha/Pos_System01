const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// routes
app.use('/brands', require('./routes/brands'));
app.use('/products', require('./routes/products'));
app.use('/categories', require('./routes/categories'));
app.use('/suppliers', require('./routes/suppliers'));
app.use('/employees', require('./routes/employees'));
app.use('/departments', require('./routes/departments'));
app.use('/customers', require('./routes/customers'));

app.get('/', (req, res) => {
  res.json({ message: "POS API running" });
});

app.listen(3030, () => {
  console.log('Server running on port 3030');
});