import { Router } from 'express';
import { authenticate, requireBusiness, authorizeRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  affiliateValidation,
  create,
  exportCsv,
  getById,
  getList,
  importCsv,
  importJson,
  moveStatus,
  update,
  remove,
} from '../controllers/affiliate.controller.js';

const router = Router();

router.use(authenticate, requireBusiness);

router.get('/', validate(affiliateValidation.listSchema), getList);
router.get('/export/csv', authorizeRole('admin', 'staff'), exportCsv);
router.post('/import/csv', authorizeRole('admin', 'staff'), validate(affiliateValidation.importSchema), importCsv);
router.post('/import/json', authorizeRole('admin', 'staff'), validate(affiliateValidation.importJsonSchema), importJson);
router.get('/:id', validate(affiliateValidation.idParamSchema), getById);
router.post('/', validate(affiliateValidation.createSchema), create);
router.patch('/:id', validate(affiliateValidation.updateSchema), update);
router.post('/:id/status', validate(affiliateValidation.statusSchema), moveStatus);
router.delete('/:id', authorizeRole('admin'), validate(affiliateValidation.idParamSchema), remove);

export default router;
