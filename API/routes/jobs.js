const express = require('express');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');
const storeMiddleware = require('../middleware/store');
const { requireManager } = require('../middleware/roles');

const router = express.Router();

router.use(authMiddleware.verifyToken);
router.use(storeMiddleware.setStore);
router.use(requireManager());

// GET all jobs
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM jobs ORDER BY job_title ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create job
router.post('/', async (req, res) => {
  try {
    const { job_title, min_salary, max_salary } = req.body;

    if (!job_title) {
      return res.status(400).json({ error: 'Job title is required' });
    }

    const result = await pool.query(
      `INSERT INTO jobs (job_title, min_salary, max_salary)
       VALUES ($1, $2, $3) RETURNING *`,
      [job_title, min_salary || null, max_salary || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET job by ID
router.get('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const result = await pool.query(
      'SELECT * FROM jobs WHERE job_id = $1',
      [jobId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update job
router.put('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { job_title, min_salary, max_salary } = req.body;

    const result = await pool.query(
      `UPDATE jobs SET job_title = $1, min_salary = $2, max_salary = $3
       WHERE job_id = $4 RETURNING *`,
      [job_title, min_salary, max_salary, jobId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE job
router.delete('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const result = await pool.query(
      'DELETE FROM jobs WHERE job_id = $1 RETURNING *',
      [jobId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
