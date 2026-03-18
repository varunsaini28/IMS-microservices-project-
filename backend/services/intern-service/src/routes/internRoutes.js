import express from 'express';
import { authenticate } from '../middleware/auth.js';

import { getMyProfile, createProfile, updateProfile } from '../controllers/internController.js';
import { getMyDocuments, getDocumentById, createDocument, updateDocument, deleteDocument } from '../controllers/documentController.js';
import { getMySkills, createSkill, updateSkill, deleteSkill } from '../controllers/skillController.js';
import { getMyEvaluations, getEvaluationById, createEvaluation, updateEvaluation, deleteEvaluation } from '../controllers/evaluationController.js';
import { getMyCertificates, getCertificateById, createCertificate, updateCertificate, deleteCertificate } from '../controllers/certificateController.js';

const router = express.Router();

router.use(authenticate);

// ─── Profile ───────────────────────────────────────────────
router.get('/profile',          getMyProfile);
router.post('/profile',         createProfile);
router.put('/profile',          updateProfile);

// ─── Documents ─────────────────────────────────────────────
router.get('/documents',        getMyDocuments);
router.get('/documents/:id',    getDocumentById);
router.post('/documents',       createDocument);
router.put('/documents/:id',    updateDocument);
router.delete('/documents/:id', deleteDocument);

// ─── Skills ────────────────────────────────────────────────
router.get('/skills',           getMySkills);
router.post('/skills',          createSkill);
router.put('/skills/:id',       updateSkill);
router.delete('/skills/:id',    deleteSkill);

// ─── Evaluations ───────────────────────────────────────────
router.get('/evaluations',      getMyEvaluations);
router.get('/evaluations/:id',  getEvaluationById);
router.post('/evaluations',     createEvaluation);
router.put('/evaluations/:id',  updateEvaluation);
router.delete('/evaluations/:id', deleteEvaluation);

// ─── Certificates ──────────────────────────────────────────
router.get('/certificates',       getMyCertificates);
router.get('/certificates/:id',   getCertificateById);
router.post('/certificates',      createCertificate);
router.put('/certificates/:id',   updateCertificate);
router.delete('/certificates/:id', deleteCertificate);

export default router;