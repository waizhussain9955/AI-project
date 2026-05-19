// ============================================================
// ResQ AI — Emergency Routes
// ============================================================

import { Router, Request, Response } from 'express';
import { body, query, param } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { analyzeEmergency } from '../services/aiAnalysis.service';
import { emitIncidentUpdate, emitEmergencyAlert } from '../realtime/socketManager';
import { io } from '../server';
import { logger } from '../utils/logger';
import { getMockIncidents } from '../data/mockData';
import { store } from '../data/simpleStore';

const router = Router();
const prisma = new PrismaClient();

// ── GET /emergency/incidents — List active incidents ──────────
router.get('/incidents', async (req: Request, res: Response) => {
  try {
    const { status, district, type, limit = '20', page = '1' } = req.query;
    
    // Get from store + merge with static mock for rich demo
    const storeIncidents = store.getIncidents({ status, district, type });
    const mockIncidents = getMockIncidents({
      status: status as string,
      district: district as string,
      type: type as string,
    });

    const combined = [...storeIncidents, ...mockIncidents];

    res.json({
      success: true,
      data: combined,
      meta: {
        total: combined.length,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      },
    });
  } catch (err) {
    logger.error('Error fetching incidents:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch incidents' });
  }
});

// ── GET /emergency/incidents/:id ──────────────────────────────
router.get('/incidents/:id', param('id').notEmpty(), validate, async (req, res) => {
  try {
    const { id } = req.params;
    const incident = store.getIncidentById(id) || getMockIncidents({}).find(i => i.id === id);
    
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }
    
    res.json({ success: true, data: incident });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch incident' });
  }
});

// ── POST /emergency/reports — Create new emergency report ─────
router.post(
  '/reports',
  [
    body('description').notEmpty().withMessage('Description required'),
    body('latitude').isFloat().withMessage('Valid latitude required'),
    body('longitude').isFloat().withMessage('Valid longitude required'),
    body('district').notEmpty().withMessage('District required'),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const { description, type, latitude, longitude, district, mediaUrls, isAnonymous } = req.body;
      const reportId = `RPT-${Date.now()}`;

      // Create report in store
      const report = {
        id: reportId,
        description,
        type: type || 'UNKNOWN',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        district,
        status: 'ANALYZING',
        createdAt: new Date().toISOString(),
        mediaUrls: mediaUrls || [],
        isAnonymous: isAnonymous || false,
      };

      store.addReport(report);

      // Trigger AI analysis async
      analyzeEmergency({
        description,
        type,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        district,
        mediaUrls,
        reportId,
      }).then(result => {
        // Emit realtime update when analysis completes
        emitIncidentUpdate(io, {
          ...result,
          type: 'analysis_complete',
        });

        // If high severity, emit emergency alert
        if (['CRITICAL', 'CATASTROPHIC'].includes(result.severity)) {
          emitEmergencyAlert(io, {
            title: `🚨 ${result.severity} Emergency in ${district}`,
            message: `${result.detectedType} detected. ${result.recommendations[0]}`,
            severity: result.severity,
            district,
            location: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
          });
        }
      }).catch(err => {
        logger.error('AI analysis error:', err);
        store.updateReportStatus(reportId, 'FAILED');
      });

      res.status(201).json({
        success: true,
        message: 'Emergency report created. AI analysis initiated.',
        data: { reportId, status: 'ANALYZING', estimatedAnalysisTime: '30 seconds' },
      });
    } catch (err) {
      logger.error('Error creating report:', err);
      res.status(500).json({ success: false, message: 'Failed to create emergency report' });
    }
  }
);

// ── GET /emergency/stats — Dashboard statistics ───────────────
router.get('/stats', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      activeIncidents: 23,
      resolvedToday: 47,
      deployedUnits: 156,
      affectedCitizens: 124500,
      avgResponseTime: 8.4,
      aiAccuracy: 94.2,
      alertsIssued: 312,
      onlineResponders: 89,
      byDistrict: [
        { name: 'Lyari', incidents: 8, severity: 'HIGH' },
        { name: 'Orangi', incidents: 5, severity: 'CRITICAL' },
        { name: 'Saddar', incidents: 4, severity: 'MODERATE' },
        { name: 'Korangi', incidents: 3, severity: 'HIGH' },
        { name: 'Gulshan', incidents: 2, severity: 'LOW' },
        { name: 'DHA', incidents: 1, severity: 'LOW' },
      ],
      byType: [
        { type: 'FLOOD', count: 8 },
        { type: 'FIRE', count: 6 },
        { type: 'ROAD_ACCIDENT', count: 5 },
        { type: 'MEDICAL_EMERGENCY', count: 4 },
      ],
    },
  });
});

export default router;
