const pool = require("../config/db");

async function getDashboard(req, res, next) {
  try {
    const [
      bookingResult,
      customerResult,
      tableResult,
      recentResult,
    ] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) FILTER (
            WHERE reservation_date = CURRENT_DATE
          )::integer AS today_bookings,

          COUNT(*) FILTER (
            WHERE status = 'Pending'
          )::integer AS pending_bookings

        FROM reservations
      `),

      pool.query(`
        SELECT
          COUNT(*)::integer AS customers
        FROM users
        WHERE role = 'customer'
      `),

      pool.query(`
        SELECT
          COUNT(*)::integer AS tables
        FROM restaurant_tables
        WHERE is_active = TRUE
      `),

      pool.query(`
        SELECT
          r.id,
          u.full_name AS customer_name,
          rt.table_number,

          TO_CHAR(
            r.reservation_date,
            'YYYY-MM-DD'
          ) AS reservation_date,

          TO_CHAR(
            r.reservation_time,
            'HH24:MI'
          ) AS reservation_time,

          r.guest_count,
          r.status

        FROM reservations r

        JOIN users u
          ON r.user_id = u.id

        JOIN restaurant_tables rt
          ON r.table_id = rt.id

        ORDER BY
          r.reservation_date DESC,
          r.reservation_time DESC

        LIMIT 10
      `),
    ]);

    res.status(200).json({
      stats: {
        todayBookings:
          bookingResult.rows[0].today_bookings,

        pendingBookings:
          bookingResult.rows[0].pending_bookings,

        customers:
          customerResult.rows[0].customers,

        tables:
          tableResult.rows[0].tables,
      },

      recentReservations:
        recentResult.rows,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboard,
};