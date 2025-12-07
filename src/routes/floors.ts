import { Router, Request, Response } from 'express';
import Building from '../models/Building';

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

        // Return floor with building info
        res.json({
            ...floor,
            buildingId: building.id,
            buildingName: building.name
        });
    } catch (error) {
        console.error('Get floor error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
