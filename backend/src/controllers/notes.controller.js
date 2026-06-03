'use strict';
const db = require('../config/db');
const AppError = require('../utils/AppError');

/**
 * GET /api/notes/:applicantId
 * Fetch all notes for an applicant — visible to all authenticated users.
 */
exports.getNotes = async (req, res, next) => {
  try {
    const { applicantId } = req.params;

    const [notes] = await db.query(
      `SELECT n.id, n.note_text, n.created_at,
              u.username, u.email, u.role
       FROM applicant_notes n
       LEFT JOIN users u ON n.user_id = u.id
       WHERE n.applicant_id = ?
       ORDER BY n.created_at DESC`,
      [applicantId]
    );

    res.status(200).json({
      status: 'success',
      results: notes.length,
      data: { notes }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/notes/:applicantId
 * Add a new compliance note to an applicant profile.
 */
exports.addNote = async (req, res, next) => {
  try {
    const { applicantId } = req.params;
    const { note_text } = req.body;

    if (!note_text || note_text.trim() === '') {
      return next(new AppError('Note text cannot be empty.', 400));
    }

    // Verify applicant exists
    const [applicants] = await db.query(
      'SELECT id FROM applicants WHERE id = ?',
      [applicantId]
    );
    if (!applicants.length) {
      return next(new AppError('No applicant found with that ID.', 404));
    }

    const [result] = await db.query(
      'INSERT INTO applicant_notes (applicant_id, user_id, note_text) VALUES (?, ?, ?)',
      [applicantId, req.user.id, note_text.trim()]
    );

    const [newNote] = await db.query(
      `SELECT n.id, n.note_text, n.created_at,
              u.username, u.email, u.role
       FROM applicant_notes n
       LEFT JOIN users u ON n.user_id = u.id
       WHERE n.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      status: 'success',
      data: { note: newNote[0] }
    });
  } catch (error) {
    next(error);
  }
};
