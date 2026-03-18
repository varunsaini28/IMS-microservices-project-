import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as featureController from '../controllers/featureToggleController.js';
import * as settingController from '../controllers/settingController.js';
import * as formSchemaController from '../controllers/formSchemaController.js';
import * as workflowController from '../controllers/workflowController.js';
import * as permissionController from '../controllers/permissionController.js';

const router = express.Router();

router.use(authenticate);

// ─── Feature Toggles ───────────────────────────────────────
router.get('/features',              featureController.getFeatureToggles);
router.get('/features/:name',        featureController.getFeatureToggle);
router.post('/features',             requireRole('admin'), featureController.createFeatureToggle);
router.put('/features/:name',        requireRole('admin'), featureController.updateFeatureToggle);
router.delete('/features/:name',     requireRole('admin'), featureController.deleteFeatureToggle);

// ─── Settings ──────────────────────────────────────────────
router.get('/settings',              settingController.getSettings);
router.get('/settings/:key',         settingController.getSetting);
router.post('/settings',             requireRole('admin'), settingController.createSetting);
router.put('/settings/:key',         requireRole('admin'), settingController.updateSetting);
router.delete('/settings/:key',      requireRole('admin'), settingController.deleteSetting);

// ─── Form Schemas ──────────────────────────────────────────
router.get('/schemas',               formSchemaController.getFormSchemas);
router.get('/schemas/:formType',     formSchemaController.getFormSchema);
router.post('/schemas',              requireRole('admin'), formSchemaController.createFormSchema);
router.put('/schemas/:formType',     requireRole('admin'), formSchemaController.updateFormSchema);
router.delete('/schemas/:formType',  requireRole('admin'), formSchemaController.deleteFormSchema);

// ─── Workflow Rules ────────────────────────────────────────
router.get('/workflows',             workflowController.getWorkflowRules);
router.get('/workflows/:entity',     workflowController.getWorkflowRulesByEntity);
router.post('/workflows',            requireRole('admin'), workflowController.createWorkflowRule);
router.put('/workflows/:id',         requireRole('admin'), workflowController.updateWorkflowRule);
router.delete('/workflows/:id',      requireRole('admin'), workflowController.deleteWorkflowRule);

// ─── Permissions ───────────────────────────────────────────
router.get('/permissions',                       permissionController.getPermissions);
router.get('/permissions/:role/:resource',       permissionController.getPermission);
router.post('/permissions',                      requireRole('admin'), permissionController.createPermission);
router.put('/permissions/:role/:resource',       requireRole('admin'), permissionController.updatePermission);
router.delete('/permissions/:role/:resource',    requireRole('admin'), permissionController.deletePermission);

export default router;