require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Warehouse = require('./models/Warehouse');
const Location = require('./models/Location');
const Category = require('./models/Category');
const Product = require('./models/Product');
const StockLevel = require('./models/StockLevel');
const Receipt = require('./models/Receipt');
const Delivery = require('./models/Delivery');
const Transfer = require('./models/Transfer');
const Adjustment = require('./models/Adjustment');
const StockMove = require('./models/StockMove');

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/ledgra';

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB for seeding...');
    await mongoose.connect(mongoURI);
    console.log('Connected! Clearing database collections...');

    await Promise.all([
      User.deleteMany({}),
      Warehouse.deleteMany({}),
      Location.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      StockLevel.deleteMany({}),
      Receipt.deleteMany({}),
      Delivery.deleteMany({}),
      Transfer.deleteMany({}),
      Adjustment.deleteMany({}),
      StockMove.deleteMany({}),
    ]);

    console.log('Collections cleared. Seeding Users...');
    const admin = await User.create({
      loginId: 'admin123',
      email: 'admin@ledgra.app',
      password: 'Password123!',
      role: 'Inventory Manager',
    });

    const staff = await User.create({
      loginId: 'staff123',
      email: 'staff@ledgra.app',
      password: 'Password123!',
      role: 'Warehouse Staff',
    });

    console.log('Seeding Warehouses & Locations...');
    const mainWh = await Warehouse.create({
      name: 'Main Warehouse',
      shortCode: 'WH',
      address: '100 Central Logistics Pkwy, Industrial Zone',
      isDefault: true,
      isActive: true,
    });

    const eastWh = await Warehouse.create({
      name: 'Eastside Logistics Hub',
      shortCode: 'EH',
      address: '45 East Commercial Blvd, Sector 4',
      isDefault: false,
      isActive: true,
    });

    const mainStore = await Location.create({
      name: 'Main Store',
      shortCode: 'WH/STOCK',
      warehouse: mainWh._id,
      type: 'Internal',
    });

    const prodFloor = await Location.create({
      name: 'Production Floor',
      shortCode: 'WH/PROD',
      warehouse: mainWh._id,
      type: 'Internal',
    });

    const rackB = await Location.create({
      name: 'Rack B',
      shortCode: 'EH/RACK-B',
      warehouse: eastWh._id,
      type: 'Internal',
    });

    const vendorLoc = await Location.create({
      name: 'Vendors',
      shortCode: 'VENDORS',
      warehouse: mainWh._id,
      type: 'Vendor',
    });

    const customerLoc = await Location.create({
      name: 'Customers',
      shortCode: 'CUSTOMERS',
      warehouse: mainWh._id,
      type: 'Customer',
    });

    console.log('Seeding Categories & Products...');
    const catFurniture = await Category.create({ name: 'Furniture', description: 'Office desks, chairs, and storage' });
    const catElectronics = await Category.create({ name: 'Electronics', description: 'Peripherals, mice, keyboards, and docks' });
    const catStorage = await Category.create({ name: 'Storage', description: 'Racks, shelves, and heavy cabinets' });

    const p1 = await Product.create({
      name: 'Ergonomic Office Chair',
      sku: 'CHAIR-001',
      category: catFurniture._id,
      uom: 'pcs',
      costPrice: 15000,
      reorderPoint: 10,
    });

    const p2 = await Product.create({
      name: 'Standing Desk 160cm',
      sku: 'DESK-002',
      category: catFurniture._id,
      uom: 'pcs',
      costPrice: 32000,
      reorderPoint: 5,
    });

    const p3 = await Product.create({
      name: 'Steel Storage Cabinet',
      sku: 'CAB-003',
      category: catStorage._id,
      uom: 'pcs',
      costPrice: 18000,
      reorderPoint: 8,
    });

    const p4 = await Product.create({
      name: 'Wireless Ergonomic Mouse',
      sku: 'MSE-004',
      category: catElectronics._id,
      uom: 'pcs',
      costPrice: 2500,
      reorderPoint: 25,
    });

    const p5 = await Product.create({
      name: 'Mechanical Keyboard',
      sku: 'KBD-005',
      category: catElectronics._id,
      uom: 'pcs',
      costPrice: 6500,
      reorderPoint: 15,
    });

    const p6 = await Product.create({
      name: 'USB-C Docking Station',
      sku: 'DOC-006',
      category: catElectronics._id,
      uom: 'pcs',
      costPrice: 12000,
      reorderPoint: 10,
    });

    console.log('Seeding Initial Stock Levels...');
    await StockLevel.create([
      { product: p1._id, location: mainStore._id, warehouse: mainWh._id, quantityOnHand: 25, quantityReserved: 0 },
      { product: p1._id, location: rackB._id, warehouse: eastWh._id, quantityOnHand: 10, quantityReserved: 0 },
      { product: p2._id, location: mainStore._id, warehouse: mainWh._id, quantityOnHand: 12, quantityReserved: 0 },
      { product: p3._id, location: mainStore._id, warehouse: mainWh._id, quantityOnHand: 15, quantityReserved: 0 },
      { product: p4._id, location: mainStore._id, warehouse: mainWh._id, quantityOnHand: 50, quantityReserved: 0 },
      { product: p5._id, location: mainStore._id, warehouse: mainWh._id, quantityOnHand: 30, quantityReserved: 0 },
      { product: p6._id, location: mainStore._id, warehouse: mainWh._id, quantityOnHand: 20, quantityReserved: 0 },
    ]);

    console.log('Seeding Sample Operations & Ledger Moves...');
    
    // Sample Receipt
    const rec1 = await Receipt.create({
      reference: 'WH/IN/00001',
      sequenceNum: 1,
      receiveFrom: 'Apex Global Supplies',
      scheduleDate: new Date(),
      responsible: admin._id,
      destinationLocation: mainStore._id,
      warehouse: mainWh._id,
      status: 'Done',
      lineItems: [
        { product: p1._id, quantity: 15, done: 15 },
        { product: p4._id, quantity: 30, done: 30 },
      ],
      validatedAt: new Date(),
    });

    // Sample Delivery
    const del1 = await Delivery.create({
      reference: 'WH/OUT/00001',
      sequenceNum: 1,
      deliveryTo: 'Acme Corporate Solutions',
      deliveryAddress: '200 Park Ave, New York',
      operationType: 'Delivery Orders',
      scheduleDate: new Date(),
      responsible: admin._id,
      sourceLocation: mainStore._id,
      warehouse: mainWh._id,
      status: 'Done',
      lineItems: [
        { product: p1._id, demand: 5, reserved: 5, done: 5 },
        { product: p2._id, demand: 2, reserved: 2, done: 2 },
      ],
      validatedAt: new Date(),
    });

    // Sample Transfer
    const tr1 = await Transfer.create({
      reference: 'WH/INT/00001',
      sequenceNum: 1,
      fromLocation: mainStore._id,
      toLocation: prodFloor._id,
      warehouse: mainWh._id,
      scheduleDate: new Date(),
      responsible: admin._id,
      status: 'Done',
      lineItems: [
        { product: p5._id, quantity: 5, done: 5 },
      ],
      validatedAt: new Date(),
    });

    // Sample Adjustment
    const adj1 = await Adjustment.create({
      reference: 'WH/ADJ/00001',
      sequenceNum: 1,
      product: p3._id,
      location: mainStore._id,
      warehouse: mainWh._id,
      recordedQuantity: 18,
      countedQuantity: 15,
      difference: -3,
      reason: 'Damaged during unloading audit',
      responsible: admin._id,
      status: 'Done',
      validatedAt: new Date(),
    });

    // Stock Moves Ledger Entries
    await StockMove.create([
      {
        reference: 'WH/IN/00001',
        moveType: 'Receipt',
        contact: 'Apex Global Supplies',
        product: p1._id,
        toLocation: mainStore._id,
        warehouse: mainWh._id,
        quantity: 15,
        responsible: admin._id,
        status: 'Done',
        notes: 'Incoming receipt WH/IN/00001',
      },
      {
        reference: 'WH/IN/00001',
        moveType: 'Receipt',
        contact: 'Apex Global Supplies',
        product: p4._id,
        toLocation: mainStore._id,
        warehouse: mainWh._id,
        quantity: 30,
        responsible: admin._id,
        status: 'Done',
        notes: 'Incoming receipt WH/IN/00001',
      },
      {
        reference: 'WH/OUT/00001',
        moveType: 'Delivery',
        contact: 'Acme Corporate Solutions',
        product: p1._id,
        fromLocation: mainStore._id,
        warehouse: mainWh._id,
        quantity: -5,
        responsible: admin._id,
        status: 'Done',
        notes: 'Outgoing delivery WH/OUT/00001',
      },
      {
        reference: 'WH/OUT/00001',
        moveType: 'Delivery',
        contact: 'Acme Corporate Solutions',
        product: p2._id,
        fromLocation: mainStore._id,
        warehouse: mainWh._id,
        quantity: -2,
        responsible: admin._id,
        status: 'Done',
        notes: 'Outgoing delivery WH/OUT/00001',
      },
      {
        reference: 'WH/INT/00001',
        moveType: 'Transfer',
        contact: 'Internal Transfer',
        product: p5._id,
        fromLocation: mainStore._id,
        toLocation: prodFloor._id,
        warehouse: mainWh._id,
        quantity: 5,
        responsible: admin._id,
        status: 'Done',
        notes: 'Internal transfer WH/INT/00001',
      },
      {
        reference: 'WH/ADJ/00001',
        moveType: 'Adjustment',
        contact: 'Stock Audit',
        product: p3._id,
        toLocation: mainStore._id,
        warehouse: mainWh._id,
        quantity: -3,
        responsible: admin._id,
        status: 'Done',
        notes: 'Damaged during unloading audit',
      },
    ]);

    console.log('✅ Database successfully seeded!');
    console.log('----------------------------------------------------');
    console.log('Login credentials created:');
    console.log('1. Manager: loginId="admin123" / password="Password123!"');
    console.log('2. Staff:   loginId="staff123" / password="Password123!"');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
