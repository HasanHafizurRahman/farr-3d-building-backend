import { Router, Request, Response } from 'express';
import Building from '../models/Building';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all buildings (Public)
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const buildings = await Building.find().sort({ createdAt: -1 });
        res.json(buildings);
    } catch (error) {
        console.error('Get buildings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get building by ID (Public)
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const building = await Building.findOne({ id: req.params.id });
        if (!building) {
            res.status(404).json({ message: 'Building not found' });
            return;
        }
        res.json(building);
    } catch (error) {
        console.error('Get building error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create building (Protected)
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const buildingData = {
            ...req.body,
            id: req.body.id || uuidv4()
        };

        const building = new Building(buildingData);
        await building.save();

        res.status(201).json(building);
    } catch (error) {
        console.error('Create building error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update building (Protected)
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const building = await Building.findOneAndUpdate(
            { id: req.params.id },
            { $set: req.body },
            { new: true }
        );

        if (!building) {
            res.status(404).json({ message: 'Building not found' });
            return;
        }

        res.json(building);
    } catch (error) {
        console.error('Update building error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete building (Protected)
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const building = await Building.findOneAndDelete({ id: req.params.id });

        if (!building) {
            res.status(404).json({ message: 'Building not found' });
            return;
        }

        res.json({ message: 'Building deleted successfully' });
    } catch (error) {
        console.error('Delete building error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add floor to building (Protected)
router.post('/:id/floors', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const floorData = {
            ...req.body,
            id: req.body.id || uuidv4()
        };

        const building = await Building.findOneAndUpdate(
            { id: req.params.id },
            { $push: { floors: floorData } },
            { new: true }
        );

        if (!building) {
            res.status(404).json({ message: 'Building not found' });
            return;
        }

        res.status(201).json(building);
    } catch (error) {
        console.error('Add floor error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update floor (Protected)
router.put('/:id/floors/:floorId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const building = await Building.findOne({ id: req.params.id });

        if (!building) {
            res.status(404).json({ message: 'Building not found' });
            return;
        }

        const floorIndex = building.floors.findIndex(f => f.id === req.params.floorId);
        if (floorIndex === -1) {
            res.status(404).json({ message: 'Floor not found' });
            return;
        }

        // Validate and sanitize level if provided
        if ('level' in req.body) {
            const level = req.body.level;
            if (level === null || level === undefined || level === '' || (typeof level === 'number' && isNaN(level))) {
                res.status(400).json({ message: 'Level must be a valid number' });
                return;
            }
            // Convert to number if it's a string
            const numLevel = Number(level);
            if (isNaN(numLevel)) {
                res.status(400).json({ message: 'Level must be a valid number' });
                return;
            }
            req.body.level = numLevel;
        }

        // Remove MongoDB internal fields that cannot be overwritten
        const { _id, __v, ...updateData } = req.body;

        // Update floor fields
        Object.assign(building.floors[floorIndex], updateData);
        await building.save();

        res.json(building);
    } catch (error) {
        console.error('Update floor error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete floor (Protected)
router.delete('/:id/floors/:floorId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const building = await Building.findOneAndUpdate(
            { id: req.params.id },
            { $pull: { floors: { id: req.params.floorId } } },
            { new: true }
        );

        if (!building) {
            res.status(404).json({ message: 'Building not found' });
            return;
        }

        res.json(building);
    } catch (error) {
        console.error('Delete floor error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
