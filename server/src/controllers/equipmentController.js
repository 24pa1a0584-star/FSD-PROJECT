const Equipment = require('../models/Equipment');
const EquipmentMaintenance = require('../models/EquipmentMaintenance');
const AuditLog = require('../models/AuditLog');
const {
  createEquipmentSchema,
  reportMaintenanceSchema,
} = require('../validators/equipmentValidator');

/**
 * List equipment (scoped by gym with category and status filter)
 */
const getEquipment = async (req, res, next) => {
  try {
    const { gymId, category, status, condition } = req.query;
    const query = {};
    if (gymId) query.gymId = gymId;
    if (category) query.category = category;
    if (status) query.status = status;
    if (condition) query.condition = condition;

    const items = await Equipment.find(query)
      .sort({ category: 1, name: 1 })
      .populate('gymId', 'name code')
      .lean();

    res.status(200).json({ success: true, count: items.length, equipment: items });
  } catch (error) {
    next(error);
  }
};

/**
 * Add new equipment to gym inventory
 */
const createEquipment = async (req, res, next) => {
  try {
    const validatedData = createEquipmentSchema.parse(req.body);

    const existingCode = await Equipment.findOne({
      gymId: validatedData.gymId,
      code: validatedData.code.toUpperCase(),
    });

    if (existingCode) {
      return res.status(409).json({
        success: false,
        message: `Equipment code '${validatedData.code}' is already assigned in this gym facility.`,
      });
    }

    const equipment = await Equipment.create({
      ...validatedData,
      code: validatedData.code.toUpperCase(),
      availableQuantity: validatedData.availableQuantity || validatedData.quantity,
    });

    await AuditLog.create({
      userId: req.user._id,
      action: 'ADD_EQUIPMENT',
      resource: 'Equipment',
      resourceId: equipment._id.toString(),
      gymId: equipment.gymId,
      ipAddress: req.ip,
      details: { name: equipment.name, code: equipment.code },
    });

    res.status(201).json({
      success: true,
      message: 'Equipment added to facility inventory successfully',
      equipment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update equipment details
 */
const updateEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const equipment = await Equipment.findById(id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment item not found' });
    }

    Object.assign(equipment, req.body);
    await equipment.save();

    res.status(200).json({
      success: true,
      message: 'Equipment item updated successfully',
      equipment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Report maintenance issue on equipment
 */
const reportMaintenance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { issueDescription, status, serviceVendor, cost, resolutionNotes } =
      reportMaintenanceSchema.parse(req.body);

    const equipment = await Equipment.findById(id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    const maintenanceLog = await EquipmentMaintenance.create({
      equipmentId: equipment._id,
      gymId: equipment.gymId,
      reportedBy: req.user._id,
      issueDescription,
      status: status || 'REPORTED',
      serviceVendor: serviceVendor || 'Campus Maintenance Team',
      cost: cost || 0,
      resolutionNotes: resolutionNotes || '',
      serviceDate: status === 'RESOLVED' ? new Date() : null,
    });

    // Update equipment status
    if (status === 'RESOLVED') {
      equipment.status = 'AVAILABLE';
      equipment.lastMaintenanceDate = new Date();
    } else {
      equipment.status = 'UNDER_MAINTENANCE';
    }
    await equipment.save();

    // Socket alert
    const io = req.app.get('io');
    if (io) {
      io.to(`gym_${equipment.gymId}`).emit('equipment:alert', {
        equipmentId: equipment._id,
        name: equipment.name,
        status: equipment.status,
      });
      io.to('super_admin').emit('equipment:alert', {
        equipmentId: equipment._id,
        name: equipment.name,
        status: equipment.status,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Maintenance ticket created successfully',
      maintenanceLog,
      equipment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get maintenance logs for gym equipment
 */
const getMaintenanceLogs = async (req, res, next) => {
  try {
    const { gymId, equipmentId } = req.query;
    const query = {};
    if (gymId) query.gymId = gymId;
    if (equipmentId) query.equipmentId = equipmentId;

    const logs = await EquipmentMaintenance.find(query)
      .sort({ createdAt: -1 })
      .populate('equipmentId', 'name code category')
      .populate('reportedBy', 'name role')
      .lean();

    res.status(200).json({ success: true, count: logs.length, logs });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEquipment,
  createEquipment,
  updateEquipment,
  reportMaintenance,
  getMaintenanceLogs,
};
