import { query } from '../config/db.js';

export async function insertAuditLog({ actorUserId, businessId, entityType, entityId, action, beforeJson, afterJson }) {
  await query(
    `
    insert into audit_logs (actor_user_id, business_id, entity_type, entity_id, action, before_json, after_json)
    values ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)
    `,
    [
      actorUserId,
      businessId,
      entityType,
      String(entityId),
      action,
      beforeJson ? JSON.stringify(beforeJson) : null,
      afterJson ? JSON.stringify(afterJson) : null,
    ],
  );
}

export async function insertActivity({ actorUserId, businessId, type, message, metadata }) {
  await query(
    `
    insert into activities (business_id, actor_user_id, type, message, metadata)
    values ($1, $2, $3, $4, $5::jsonb)
    `,
    [businessId, actorUserId, type, message, metadata ? JSON.stringify(metadata) : null],
  );
}
