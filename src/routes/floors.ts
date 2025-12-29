import { Router, Request, Response } from 'express';
import Building from '../models/Building';
import { upload, uploadToCloudinary } from '../middleware/upload';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Get floor by ID (Public) - searches across all buildings
router.get('/:floorId', async (req: Request, res: Response): Promise<void> => {
    try {
        const building = await Building.findOne({ 'floors.id': req.params.floorId });

        if (!building) {
            res.status(404).json({ message: 'Floor not found' });
            return;
        }

        const floor = building.floors.find(f => f.id === req.params.floorId);

        if (!floor) {
            res.status(404).json({ message: 'Floor not found' });
            return;
        }

        res.json({
            ...(floor as any).toObject(),
            buildingId: building.id,
            buildingName: building.name
        });
    } catch (error) {
        console.error('Get floor error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload floor map
router.post('/:floorId/upload-map', authMiddleware, upload.single('map'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded. Ensure the form-data field name is "map".' });
            return;
        }

        console.log('File received:', req.file.originalname, req.file.size, 'bytes');
        console.log('Uploading to Cloudinary...');

        // Upload to Cloudinary and get public URL
        const mapUrl = await uploadToCloudinary(req.file);

        console.log('Cloudinary URL:', mapUrl);

        // Use findOneAndUpdate with $set to update only the mapUrl without triggering full validation
        const building = await Building.findOneAndUpdate(
            { 'floors.id': req.params.floorId },
            { $set: { 'floors.$.mapUrl': mapUrl } },
            { new: true }
        );

        if (!building) {
            res.status(404).json({ message: 'Floor not found' });
            return;
        }

        res.json({
            message: 'Map uploaded successfully',
            mapUrl: mapUrl
        });

    } catch (error) {
        console.error('Upload map error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
