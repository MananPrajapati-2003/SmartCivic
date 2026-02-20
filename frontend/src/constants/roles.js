/**
 * User roles used across the SmartCivic Platform
 * Keep these values in sync with backend roles
 */

export const USER_ROLES = Object.freeze({
  ADMIN: "admin",
  CITIZEN: "citizen",
  AUTHORITY: "authority",
  NGO: "ngo",
});

/**
 * Roles allowed during public registration
 * (Admin should NEVER be self-registered)
 */
export const REGISTER_ROLES = [
  {
    label: "Citizen",
    value: USER_ROLES.CITIZEN,
    description: "Report civic issues and track their resolution",
  },
  {
    label: "Authority",
    value: USER_ROLES.AUTHORITY,
    description: "Manage and resolve reported civic issues",
  },
  {
    label: "NGO / CSR",
    value: USER_ROLES.NGO,
    description: "Support communities and collaborate on civic initiatives",
  },
];

/**
 * Role-based redirect after login
 * Used once authentication succeeds
 */
export const ROLE_REDIRECTS = {
  [USER_ROLES.ADMIN]: "/admin/dashboard",
  [USER_ROLES.CITIZEN]: "/citizen/dashboard",
  [USER_ROLES.AUTHORITY]: "/authority/dashboard",
  [USER_ROLES.NGO]: "/ngo/dashboard",
};

/**
 * Human-readable role labels (UI display)
 */
export const ROLE_LABELS = {
  [USER_ROLES.ADMIN]: "Admin",
  [USER_ROLES.CITIZEN]: "Citizen",
  [USER_ROLES.AUTHORITY]: "Authority",
  [USER_ROLES.NGO]: "NGO / CSR",
};
