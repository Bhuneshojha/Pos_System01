const { pool } = require('../lib/db');
const { verifyAuth } = require('../lib/auth');
const { requireManager } = require('../lib/roles');

export default async function handler(req, res) {
  try {
    // 1. Authentication
    const user = verifyAuth(req);
    requireManager(user);
    
    // URL: /api/jobs?id=123
    const jobId = req.query.id;

    switch (req.method) {
      case 'GET':
        if (jobId) {
          const resSingle = await pool.query('SELECT * FROM jobs WHERE job_id = $1', [jobId]);
          if (resSingle.rows.length === 0) return res.status(404).json({ error: 'Job not found' });
          return res.json(resSingle.rows[0]);
        }
        const resAll = await pool.query('SELECT * FROM jobs ORDER BY job_title ASC');
        return res.json(resAll.rows);

      case 'POST':
        const { job_title, min_salary, max_salary } = req.body;
        if (!job_title) return res.status(400).json({ error: 'Job title is required' });
        
        const ins = await pool.query(
          'INSERT INTO jobs (job_title, min_salary, max_salary) VALUES ($1, $2, $3) RETURNING *',
          [job_title, min_salary || null, max_salary || null]
        );
        return res.status(201).json(ins.rows[0]);

      case 'PUT':
        const up = await pool.query(
          'UPDATE jobs SET job_title=$1, min_salary=$2, max_salary=$3 WHERE job_id=$4 RETURNING *',
          [req.body.job_title, req.body.min_salary, req.body.max_salary, jobId]
        );
        return up.rows.length ? res.json(up.rows[0]) : res.status(404).json({ error: 'Job not found' });

      case 'DELETE':
        const del = await pool.query('DELETE FROM jobs WHERE job_id=$1 RETURNING *', [jobId]);
        return del.rows.length ? res.json({ message: 'Deleted' }) : res.status(404).json({ error: 'Job not found' });

      default:
        return res.status(405).end();
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}