/**
 * Validation middleware helpers
 * Pure functions that validate request body & return error maps
 */

/**
 * Validate create-lead request body
 * @param {Object} body req.body
 * @returns {Object} empty {} if valid, else { field: 'message' }
 */
export function validateLeadBody(body = {}) {
  const { customer_name, mobile, email, pickup_city, destination_city, service_type } = body;
  const errors = {};

  if (!customer_name?.trim()) {
    errors.customer_name = 'Customer name is required';
  }

  if (!mobile?.trim()) {
    errors.mobile = 'Mobile number is required';
  } else if (!/^[0-9]{10}$/.test(String(mobile).replace(/\D/g, ''))) {
    errors.mobile = 'Enter a valid 10-digit mobile number';
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address';
  }

  if (!pickup_city?.trim()) {
    errors.pickup_city = 'Pickup city is required';
  }

  if (!destination_city?.trim()) {
    errors.destination_city = 'Destination city is required';
  }

  if (!service_type?.trim()) {
    errors.service_type = 'Service type is required';
  }

  return errors;
}

/**
 * Express middleware wrapper — sends 400 on invalid
 * Falls through (next()) on valid
 */
export function validateLead(req, res, next) {
  const errors = validateLeadBody(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }
  next();
}

/**
 * Valid status enum for PATCH /status
 */
export const VALID_LEAD_STATUSES = ['Pending', 'Verified', 'Fake', 'Duplicate', 'Re-attempt'];