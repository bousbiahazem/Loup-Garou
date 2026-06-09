import { ROLE_CATALOG, translateRole } from "../data/roles.js";

export function listRoles(request, response) {
  const language = request.query.lang || "en";
  response.json({ roles: ROLE_CATALOG.map((role) => translateRole(role, language)) });
}
