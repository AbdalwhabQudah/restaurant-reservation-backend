const { validationResult } = require("express-validator");
const pool = require("../config/db");
// =====================================================
// GET ALL MENU CATEGORIES
// GET /api/menu/categories
// =====================================================

async function getCategories(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name
      FROM menu_categories
      ORDER BY id
    `);

    res.status(200).json({
      count: result.rows.length,
      categories: result.rows,
    });
  } catch (error) {
    next(error);
  }
}

// =====================================================
// GET ALL MENU ITEMS
// GET /api/menu
// =====================================================

async function getMenuItems(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT
        mi.id,
        mi.name,
        mi.description,
        mi.price,
        mi.image_url,
        mi.is_available,
        mc.id AS category_id,
        mc.name AS category
      FROM menu_items mi
      JOIN menu_categories mc
        ON mi.category_id = mc.id
      ORDER BY mc.name, mi.name
    `);

    const menuItems = result.rows.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: Number(item.price),
      imageUrl: item.image_url,
      isAvailable: item.is_available,
      categoryId: item.category_id,
      category: item.category,
    }));

    res.status(200).json({
      count: menuItems.length,
      menuItems,
    });
  } catch (error) {
    next(error);
  }
}

// =====================================================
// GET ONE MENU ITEM
// GET /api/menu/:id
// =====================================================

async function getMenuItemById(req, res, next) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        mi.id,
        mi.name,
        mi.description,
        mi.price,
        mi.image_url,
        mi.is_available,
        mc.id AS category_id,
        mc.name AS category
      FROM menu_items mi
      JOIN menu_categories mc
        ON mi.category_id = mc.id
      WHERE mi.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Menu item not found",
      });
    }

    const item = result.rows[0];

    res.status(200).json({
      menuItem: {
        id: item.id,
        name: item.name,
        description: item.description,
        price: Number(item.price),
        imageUrl: item.image_url,
        isAvailable: item.is_available,
        categoryId: item.category_id,
        category: item.category,
      },
    });
  } catch (error) {
    next(error);
  }
}

// =====================================================
// CREATE MENU ITEM - ADMIN ONLY
// POST /api/menu
// =====================================================

async function createMenuItem(req, res, next) {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const {
      categoryId,
      name,
      description,
      price,
      imageUrl,
      isAvailable = true,
    } = req.body;

    // Check category
    const categoryResult = await pool.query(
      `
      SELECT id
      FROM menu_categories
      WHERE id = $1
      `,
      [categoryId]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(400).json({
        message: "Invalid menu category",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO menu_items (
        category_id,
        name,
        description,
        price,
        image_url,
        is_available
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        categoryId,
        name.trim(),
        description.trim(),
        price,
        imageUrl || null,
        isAvailable,
      ]
    );

    res.status(201).json({
      message: "Menu item created successfully",
      menuItem: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message:
          "A menu item with this name already exists in this category",
      });
    }

    next(error);
  }
}

// =====================================================
// UPDATE MENU ITEM - ADMIN ONLY
// PUT /api/menu/:id
// =====================================================

async function updateMenuItem(req, res, next) {
  try {
    const { id } = req.params;

    const existingResult = await pool.query(
      `
      SELECT *
      FROM menu_items
      WHERE id = $1
      `,
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        message: "Menu item not found",
      });
    }

    const existing = existingResult.rows[0];

    const categoryId =
      req.body.categoryId ?? existing.category_id;

    const name =
      req.body.name ?? existing.name;

    const description =
      req.body.description ?? existing.description;

    const price =
      req.body.price ?? existing.price;

    const imageUrl =
      req.body.imageUrl !== undefined
        ? req.body.imageUrl
        : existing.image_url;

    const isAvailable =
      req.body.isAvailable !== undefined
        ? req.body.isAvailable
        : existing.is_available;

    const categoryResult = await pool.query(
      `
      SELECT id
      FROM menu_categories
      WHERE id = $1
      `,
      [categoryId]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(400).json({
        message: "Invalid menu category",
      });
    }

    const result = await pool.query(
      `
      UPDATE menu_items
      SET
        category_id = $1,
        name = $2,
        description = $3,
        price = $4,
        image_url = $5,
        is_available = $6
      WHERE id = $7
      RETURNING *
      `,
      [
        categoryId,
        String(name).trim(),
        String(description).trim(),
        price,
        imageUrl || null,
        isAvailable,
        id,
      ]
    );

    res.status(200).json({
      message: "Menu item updated successfully",
      menuItem: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message:
          "A menu item with this name already exists in this category",
      });
    }

    next(error);
  }
}

// =====================================================
// DELETE MENU ITEM - ADMIN ONLY
// DELETE /api/menu/:id
// =====================================================

async function deleteMenuItem(req, res, next) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM menu_items
      WHERE id = $1
      RETURNING id, name
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Menu item not found",
      });
    }

    res.status(200).json({
      message: "Menu item deleted successfully",
      deletedItem: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCategories,
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};