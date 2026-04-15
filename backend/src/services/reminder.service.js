import { query } from '../config/db.js';
import { forbidden, notFound } from '../utils/errors.js';
import { insertActivity, insertAuditLog } from './audit.service.js';
import { sendNotification } from '../utils/push.js';

function assertBusinessAccess(auth, businessId) {
  if (auth.role === 'admin') {
    return;
  }
  if (!auth.allowedBusinessIds?.includes(businessId)) {
    throw forbidden('You do not have access to this business');
  }
}

export async function listReminders({ status = 'pending' }, auth) {
  const businessId = auth.activeBusinessId;
  assertBusinessAccess(auth, businessId);

  const values = [businessId];
  let where = 'where r.business_id = $1';
  if (status !== 'all') {
    values.push(status);
    where += ` and r.status = $${values.length}`;
  }

  const { rows } = await query(
    `
    select r.id, r.affiliate_id as "affiliateId", r.business_id as "businessId", r.title, r.due_date as "dueDate",
           r.priority, r.status, r.created_at as "createdAt", r.completed_at as "completedAt",
           r.assigned_to as "assignedTo",
           a.name as "affiliateName", a.product as "affiliateProduct",
           u.name as "assignedToName", u.email as "assignedToEmail"
    from reminders r
    join affiliates a on a.id = r.affiliate_id
    left join app_users u on u.id = r.assigned_to
    ${where}
    order by r.due_date asc
    `,
    values,
  );

  return { data: rows };
}

export async function createReminder(payload, auth) {
  const businessId = auth.activeBusinessId;
  assertBusinessAccess(auth, businessId);

  const { rows: affRows } = await query('select id, business_id as "businessId", name from affiliates where id = $1', [payload.affiliateId]);
  const affiliate = affRows[0];
  if (!affiliate) {
    throw notFound('Affiliate not found');
  }

  if (affiliate.businessId !== businessId) {
    throw forbidden('Affiliate does not belong to active business');
  }

  // Validate assignedTo user is active (if provided)
  if (payload.assignedTo) {
    const { rows: empRows } = await query(
      `select u.id
       from app_users u
       where u.id = $1 and u.is_active = true`,
      [payload.assignedTo],
    );
    if (!empRows.length) {
      throw forbidden('Assigned employee is invalid or inactive');
    }
  }

  const { rows } = await query(
    `
    insert into reminders (affiliate_id, business_id, title, due_date, priority, status, created_by, assigned_to)
    values ($1, $2, $3, $4, $5, 'pending', $6, $7)
    returning id, affiliate_id as "affiliateId", business_id as "businessId", title,
              due_date as "dueDate", priority, status, created_at as "createdAt", completed_at as "completedAt",
              assigned_to as "assignedTo"
    `,
    [payload.affiliateId, businessId, payload.title, payload.dueDate, payload.priority || 'medium', auth.sub, payload.assignedTo || null],
  );

  const reminder = rows[0];

  await insertAuditLog({
    actorUserId: auth.sub,
    businessId,
    entityType: 'reminder',
    entityId: reminder.id,
    action: 'create',
    afterJson: reminder,
  });

  await insertActivity({
    actorUserId: auth.sub,
    businessId,
    type: 'reminder_created',
    message: `Follow-up scheduled: "${reminder.title}" for ${affiliate.name}${payload.assignedTo ? ' (assigned to employee)' : ''}`,
    metadata: { reminderId: reminder.id, assignedTo: payload.assignedTo || null },
  });

  // Send push notification to the assigned employee
  if (payload.assignedTo) {
    try {
      const { rows: subs } = await query(
        'select subscription_json from push_subscriptions where user_id = $1',
        [payload.assignedTo],
      );

      const dueFormatted = new Date(reminder.dueDate).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      });

      const notifPayload = {
        title: 'New Follow-up Assigned',
        body: `"${reminder.title}" for ${affiliate.name}. Due: ${dueFormatted}.`,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        image: '/icons.svg',
        tag: `followup-${reminder.id}`,
        renotify: true,
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 300],
        actions: [
          { action: 'open-reminder', title: 'Open Reminders' },
          { action: 'open-affiliate', title: 'Open Affiliate' },
        ],
        data: {
          url: '/app/reminders',
          affiliateUrl: `/app/affiliates/${affiliate.id}`,
          reminderId: reminder.id,
        },
      };

      for (const sub of subs) {
        await sendNotification(sub.subscription_json, notifPayload);
      }
    } catch (pushErr) {
      // Non-blocking — log but don't fail the request
      console.error('Push notification failed:', pushErr.message);
    }
  }

  return { reminder };
}

export async function completeReminder(id, auth) {
  const { rows } = await query(
    `
    select id, affiliate_id as "affiliateId", business_id as "businessId", title, due_date as "dueDate",
           priority, status, created_at as "createdAt", completed_at as "completedAt", assigned_to as "assignedTo"
    from reminders where id = $1
    `,
    [id],
  );

  const reminder = rows[0];
  if (!reminder) {
    throw notFound('Reminder not found');
  }

  assertBusinessAccess(auth, reminder.businessId);
  if (auth.role !== 'admin' && reminder.businessId !== auth.activeBusinessId) {
    throw forbidden('Access denied for this reminder');
  }
  if (auth.role !== 'admin' && reminder.assignedTo && reminder.assignedTo !== auth.sub) {
    throw forbidden('Only assigned employee or admin can complete this reminder');
  }

  const { rows: updatedRows } = await query(
    `
    update reminders
    set status = 'completed', completed_at = now()
    where id = $1
    returning id, affiliate_id as "affiliateId", business_id as "businessId", title,
              due_date as "dueDate", priority, status, created_at as "createdAt", completed_at as "completedAt",
              assigned_to as "assignedTo"
    `,
    [id],
  );

  const updated = updatedRows[0];

  await insertAuditLog({
    actorUserId: auth.sub,
    businessId: updated.businessId,
    entityType: 'reminder',
    entityId: updated.id,
    action: 'complete',
    beforeJson: reminder,
    afterJson: updated,
  });
  await insertActivity({
    actorUserId: auth.sub,
    businessId: updated.businessId,
    type: 'reminder_completed',
    message: `Reminder completed: ${updated.title}`,
    metadata: { reminderId: updated.id },
  });

  return { reminder: updated };
}
