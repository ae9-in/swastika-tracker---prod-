import { pool, query } from '../config/db.js';
import { STATUS_ORDER } from '../constants/domain.js';
import { badRequest, forbidden, notFound } from '../utils/errors.js';
import { insertActivity, insertAuditLog } from './audit.service.js';

function assertBusinessAccess(auth, businessId) {
  if (auth.role === 'admin') {
    return;
  }

  if (!auth.allowedBusinessIds?.includes(businessId)) {
    throw forbidden('You do not have access to this business');
  }
}

function normalizePagination(page, pageSize) {
  const p = Number(page) || 1;
  const size = Number(pageSize) || 10;
  return {
    page: p > 0 ? p : 1,
    pageSize: size > 0 && size <= 100 ? size : 10,
  };
}

export async function listAffiliates(params, auth) {
  const { search = '', status = 'All' } = params;
  const { page, pageSize } = normalizePagination(params.page, params.pageSize);
  const businessId = auth.activeBusinessId;
  assertBusinessAccess(auth, businessId);

  const values = [businessId];
  const where = ['business_id = $1'];

  if (status !== 'All') {
    values.push(status);
    where.push(`status = $${values.length}`);
  }

  if (search.trim()) {
    values.push(`%${search.trim().toLowerCase()}%`);
    where.push(`(lower(name) like $${values.length} or lower(product) like $${values.length} or phone1 like $${values.length})`);
  }

  const countSql = `select count(*)::int as total from affiliates where ${where.join(' and ')}`;
  const { rows: countRows } = await query(countSql, values);
  const total = countRows[0].total;

  values.push(pageSize);
  values.push((page - 1) * pageSize);

  const dataSql = `
    select id, business_id as "businessId", name, product, address, phone1, phone2, description,
           status, created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"
    from affiliates
    where ${where.join(' and ')}
    order by updated_at desc
    limit $${values.length - 1} offset $${values.length}
  `;
  const { rows } = await query(dataSql, values);

  return {
    data: rows,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getAffiliateById(id, auth) {
  const { rows } = await query(
    `
    select id, business_id as "businessId", name, product, address, phone1, phone2, description,
           status, created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"
    from affiliates where id = $1
    `,
    [id],
  );

  const affiliate = rows[0];
  if (!affiliate) {
    throw notFound('Affiliate not found');
  }

  assertBusinessAccess(auth, affiliate.businessId);
  if (auth.role !== 'admin' && affiliate.businessId !== auth.activeBusinessId) {
    throw forbidden('Access denied for this affiliate');
  }

  const { rows: history } = await query(
    `
    select id, affiliate_id as "affiliateId", from_status as "fromStatus", to_status as "toStatus",
           remark, changed_by as "changedBy", changed_at as "changedAt"
    from affiliate_status_history
    where affiliate_id = $1
    order by changed_at desc
    `,
    [id],
  );

  return { affiliate, history };
}

export async function createAffiliate(payload, auth) {
  const businessId = auth.activeBusinessId;
  assertBusinessAccess(auth, businessId);

  const { rows } = await query(
    `
    insert into affiliates (business_id, name, product, address, phone1, phone2, description, status, created_by)
    values ($1, $2, $3, $4, $5, $6, $7, coalesce($8, 'Contacted'), $9)
    returning id, business_id as "businessId", name, product, address, phone1, phone2, description,
              status, created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"
    `,
    [businessId, payload.name, payload.product, payload.address, payload.phone1, payload.phone2, payload.description, payload.status, auth.sub],
  );

  const affiliate = rows[0];
  await insertAuditLog({
    actorUserId: auth.sub,
    businessId,
    entityType: 'affiliate',
    entityId: affiliate.id,
    action: 'create',
    afterJson: affiliate,
  });
  await insertActivity({
    actorUserId: auth.sub,
    businessId,
    type: 'affiliate_created',
    message: `${affiliate.name} created.`,
    metadata: { affiliateId: affiliate.id },
  });

  return { affiliate };
}

export async function updateAffiliate(id, payload, auth) {
  const existing = await getAffiliateById(id, auth);

  const affiliate = existing.affiliate;
  const update = {
    name: payload.name ?? affiliate.name,
    product: payload.product ?? affiliate.product,
    address: payload.address ?? affiliate.address,
    phone1: payload.phone1 ?? affiliate.phone1,
    phone2: payload.phone2 ?? affiliate.phone2,
    description: payload.description ?? affiliate.description,
    status: payload.status ?? affiliate.status,
  };

  const { rows } = await query(
    `
    update affiliates
    set name = $2, product = $3, address = $4, phone1 = $5, phone2 = $6, description = $7, status = $8, updated_at = now()
    where id = $1
    returning id, business_id as "businessId", name, product, address, phone1, phone2, description,
              status, created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"
    `,
    [id, update.name, update.product, update.address, update.phone1, update.phone2, update.description, update.status],
  );

  const updated = rows[0];
  await insertAuditLog({
    actorUserId: auth.sub,
    businessId: updated.businessId,
    entityType: 'affiliate',
    entityId: updated.id,
    action: 'update',
    beforeJson: affiliate,
    afterJson: updated,
  });
  await insertActivity({
    actorUserId: auth.sub,
    businessId: updated.businessId,
    type: 'affiliate_updated',
    message: `${updated.name} updated.`,
    metadata: { affiliateId: updated.id },
  });

  return { affiliate: updated };
}

export async function transitionStatus(id, payload, auth) {
  const existing = await getAffiliateById(id, auth);
  const affiliate = existing.affiliate;

  const currentIndex = STATUS_ORDER.indexOf(affiliate.status);
  const nextIndex = STATUS_ORDER.indexOf(payload.newStatus);

  if (nextIndex < 0) {
    throw badRequest('Invalid status selected');
  }
  if (nextIndex <= currentIndex) {
    throw badRequest('Status can only move forward in sequence');
  }

  const { rows } = await query(
    `
    update affiliates
    set status = $2, updated_at = now()
    where id = $1
    returning id, business_id as "businessId", name, product, address, phone1, phone2, description,
              status, created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"
    `,
    [id, payload.newStatus],
  );

  const updated = rows[0];

  await query(
    `
    insert into affiliate_status_history (affiliate_id, from_status, to_status, remark, changed_by)
    values ($1, $2, $3, $4, $5)
    `,
    [id, affiliate.status, payload.newStatus, payload.remark || null, auth.sub],
  );

  await insertAuditLog({
    actorUserId: auth.sub,
    businessId: updated.businessId,
    entityType: 'affiliate',
    entityId: updated.id,
    action: 'status_transition',
    beforeJson: { status: affiliate.status },
    afterJson: { status: updated.status, remark: payload.remark || null },
  });
  await insertActivity({
    actorUserId: auth.sub,
    businessId: updated.businessId,
    type: 'status_changed',
    message: `${updated.name}: ${affiliate.status} -> ${updated.status}`,
    metadata: { affiliateId: updated.id },
  });

  return { affiliate: updated };
}

export async function exportAffiliatesCsv(auth) {
  const { data } = await listAffiliates({ page: 1, pageSize: 10000, status: 'All', search: '' }, auth);
  const header = 'name,product,address,phone1,phone2,description,status';
  const lines = data.map((row) => `${row.name},${row.product},${row.address},${row.phone1},${row.phone2},${row.description},${row.status}`);
  return [header, ...lines].join('\n');
}

export async function importAffiliatesCsv(csvText, auth) {
  const businessId = auth.activeBusinessId;
  assertBusinessAccess(auth, businessId);

  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw badRequest('CSV must include at least one data row');
  }

  const client = await pool.connect();
  let inserted = 0;
  const errors = [];

  try {
    await client.query('begin');

    for (let i = 1; i < lines.length; i += 1) {
      const line = lines[i];
      // Regex that splits on commas but ignores commas inside double quotes
      const cells = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
      const parsed = cells.map(c => c.replace(/^"|"$/g, '').trim());

      const [name, product, address, phone1, phone2, description, status] = parsed;

      if (!name || !product || !address || !phone1) {
        errors.push({ row: i + 1, message: 'Missing required fields (Name, Product, Address, or Phone1)' });
        continue;
      }

      const safeStatus = STATUS_ORDER.includes(status) ? status : 'Contacted';

      try {
        await client.query(
          `
          insert into affiliates (business_id, name, product, address, phone1, phone2, description, status, created_by)
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `,
          [businessId, name, product, address, phone1, phone2 || '', description || '', safeStatus, auth.sub],
        );
        inserted += 1;
      } catch (err) {
        errors.push({ row: i + 1, message: err.message });
      }
    }

    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }

  await insertActivity({
    actorUserId: auth.sub,
    businessId,
    type: 'affiliate_imported',
    message: `${inserted} affiliate rows imported via CSV. ${errors.length} failed.`,
    metadata: { inserted, errorCount: errors.length },
  });

  return { inserted, errorCount: errors.length, errors: errors.slice(0, 50) }; // Cap error list
}

export async function importAffiliatesJson(data, auth) {
  const businessId = auth.activeBusinessId;
  assertBusinessAccess(auth, businessId);

  if (!Array.isArray(data) || data.length === 0) {
    throw badRequest('Import data must be a non-empty array');
  }

  const client = await pool.connect();
  let inserted = 0;
  const errors = [];

  try {
    await client.query('begin');

    for (let index = 0; index < data.length; index++) {
      const row = data[index];
      const { name, product, address, phone1, phone2, description, status } = row;

      if (!name || !product || !address || !phone1) {
        errors.push({ row: index + 1, message: 'Missing required fields' });
        continue;
      }

      const safeStatus = STATUS_ORDER.includes(status) ? status : 'Contacted';

      try {
        await client.query(
          `
          insert into affiliates (business_id, name, product, address, phone1, phone2, description, status, created_by)
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `,
          [
            businessId,
            name,
            product,
            address,
            phone1,
            phone2 || '',
            description || '',
            safeStatus,
            auth.sub,
          ],
        );
        inserted += 1;
      } catch (err) {
        errors.push({ row: index + 1, message: err.message });
      }
    }

    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }

  await insertActivity({
    actorUserId: auth.sub,
    businessId,
    type: 'affiliate_imported',
    message: `${inserted} affiliate rows imported via JSON/Excel. ${errors.length} failed.`,
    metadata: { inserted, errorCount: errors.length },
  });

  return { inserted, errorCount: errors.length, errors: errors.slice(0, 50) };
}

export async function deleteAffiliate(id, auth) {
  if (auth.role !== 'admin') {
    throw forbidden('Only admins can delete affiliates');
  }

  const existing = await getAffiliateById(id, auth);

  await query('delete from affiliates where id = $1', [id]);

  await insertAuditLog({
    actorUserId: auth.sub,
    businessId: existing.affiliate.businessId,
    entityType: 'affiliate',
    entityId: id,
    action: 'delete',
    beforeJson: existing.affiliate,
  });

  await insertActivity({
    actorUserId: auth.sub,
    businessId: existing.affiliate.businessId,
    type: 'affiliate_deleted',
    message: `Affiliate "${existing.affiliate.name}" was permanently deleted by Admin.`,
    metadata: { affiliateId: id },
  });

  return { success: true };
}
