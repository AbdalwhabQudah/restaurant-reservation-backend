const pool = require("../config/db");

// ============================================
// GET ALL TABLES
// GET /api/tables
// ============================================

async function getTables(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT
        id,
        table_number,
        capacity,
        location,
        is_active
      FROM restaurant_tables
      ORDER BY table_number
    `);

    const tables = result.rows.map((table) => ({
      id: table.id,
      tableNumber: table.table_number,
      capacity: table.capacity,
      location: table.location,
      isActive: table.is_active,
    }));

    res.status(200).json({
      count: tables.length,
      tables,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// GET ONE TABLE
// GET /api/tables/:id
// ============================================

async function getTableById(req, res, next) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        id,
        table_number,
        capacity,
        location,
        is_active
      FROM restaurant_tables
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Restaurant table not found",
      });
    }

    const table = result.rows[0];

    res.status(200).json({
      table: {
        id: table.id,
        tableNumber: table.table_number,
        capacity: table.capacity,
        location: table.location,
        isActive: table.is_active,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// CREATE TABLE - ADMIN ONLY
// POST /api/tables
// ============================================

async function createTable(req, res, next) {
  try {
    const {
      tableNumber,
      capacity,
      location,
      isActive = true,
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO restaurant_tables (
        table_number,
        capacity,
        location,
        is_active
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        tableNumber,
        capacity,
        location,
        isActive,
      ]
    );

    const table = result.rows[0];

    res.status(201).json({
      message: "Restaurant table created successfully",

      table: {
        id: table.id,
        tableNumber: table.table_number,
        capacity: table.capacity,
        location: table.location,
        isActive: table.is_active,
      },
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "Table number already exists",
      });
    }

    next(error);
  }
}

// ============================================
// UPDATE TABLE - ADMIN ONLY
// PUT /api/tables/:id
// ============================================

async function updateTable(req, res, next) {
  try {
    const { id } = req.params;

    const existingResult = await pool.query(
      `
      SELECT *
      FROM restaurant_tables
      WHERE id = $1
      `,
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        message: "Restaurant table not found",
      });
    }

    const existing = existingResult.rows[0];

    const tableNumber =
      req.body.tableNumber ?? existing.table_number;

    const capacity =
      req.body.capacity ?? existing.capacity;

    const location =
      req.body.location ?? existing.location;

    const isActive =
      req.body.isActive !== undefined
        ? req.body.isActive
        : existing.is_active;

    const result = await pool.query(
      `
      UPDATE restaurant_tables
      SET
        table_number = $1,
        capacity = $2,
        location = $3,
        is_active = $4
      WHERE id = $5
      RETURNING *
      `,
      [
        tableNumber,
        capacity,
        location,
        isActive,
        id,
      ]
    );

    const table = result.rows[0];

    res.status(200).json({
      message: "Restaurant table updated successfully",

      table: {
        id: table.id,
        tableNumber: table.table_number,
        capacity: table.capacity,
        location: table.location,
        isActive: table.is_active,
      },
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "Table number already exists",
      });
    }

    next(error);
  }
}

// ============================================
// DELETE TABLE - ADMIN ONLY
// DELETE /api/tables/:id
// ============================================

async function deleteTable(req, res, next) {
  try {
    const { id } = req.params;

    const reservationCheck = await pool.query(
      `
      SELECT id
      FROM reservations
      WHERE table_id = $1
      LIMIT 1
      `,
      [id]
    );

    if (reservationCheck.rows.length > 0) {
      return res.status(409).json({
        message:
          "Cannot delete this table because it has reservation history. Set it as inactive instead.",
      });
    }

    const result = await pool.query(
      `
      DELETE FROM restaurant_tables
      WHERE id = $1
      RETURNING id, table_number
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Restaurant table not found",
      });
    }

    res.status(200).json({
      message: "Restaurant table deleted successfully",
      deletedTable: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable,
};