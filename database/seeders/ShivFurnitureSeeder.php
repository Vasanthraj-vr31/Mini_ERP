<?php

namespace Database\Seeders;

use App\Models\BillOfMaterial;
use App\Models\BomComponent;
use App\Models\BomOperation;
use App\Models\Customer;
use App\Models\ManufacturingOrder;
use App\Models\MoComponent;
use App\Models\MoWorkOrder;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderLine;
use App\Models\SalesOrder;
use App\Models\SaleOrderLine;
use App\Models\StockLedger;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorScore;
use App\Models\WorkCenter;
use App\Services\StockService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class ShivFurnitureSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // --- Roles ---
        $roles = [
            'Admin', 'Sales User', 'Purchase User',
            'Manufacturing User', 'Inventory Manager', 'Business Owner',
        ];
        foreach ($roles as $r) Role::firstOrCreate(['name' => $r]);

        // --- Permissions ---
        $permissions = [
            'view dashboard', 'view products', 'manage products',
            'view sales orders', 'manage sales orders',
            'view purchase orders', 'manage purchase orders',
            'view manufacturing orders', 'manage manufacturing orders',
            'view bom', 'manage bom',
            'view stock ledger', 'manage stock',
            'view audit logs',
            'view ai alerts', 'resolve ai alerts',
        ];
        foreach ($permissions as $p) Permission::firstOrCreate(['name' => $p]);

        Role::findByName('Admin')->syncPermissions($permissions);
        Role::findByName('Sales User')->syncPermissions([
            'view dashboard', 'view products', 'view sales orders', 'manage sales orders', 'view ai alerts',
        ]);
        Role::findByName('Purchase User')->syncPermissions([
            'view dashboard', 'view products', 'view purchase orders', 'manage purchase orders', 'view ai alerts',
        ]);
        Role::findByName('Manufacturing User')->syncPermissions([
            'view dashboard', 'view products', 'view manufacturing orders', 'manage manufacturing orders', 'view bom', 'manage bom',
        ]);
        Role::findByName('Inventory Manager')->syncPermissions([
            'view dashboard', 'view products', 'manage products', 'view stock ledger', 'manage stock', 'view ai alerts', 'resolve ai alerts',
        ]);
        Role::findByName('Business Owner')->syncPermissions([
            'view dashboard', 'view products', 'view sales orders', 'view purchase orders',
            'view manufacturing orders', 'view bom', 'view stock ledger', 'view audit logs',
            'view ai alerts',
        ]);

        // --- Users ---
        $admin = User::firstOrCreate(['email' => 'admin@shivfurniture.com'], [
            'name'     => 'Rajesh Kumar',
            'mobile'   => '9876543210',
            'address'  => '12, Industrial Area, Jodhpur, Rajasthan',
            'password' => Hash::make('password'),
        ]);
        $admin->assignRole('Admin');

        $salesUser = User::firstOrCreate(['email' => 'sales@shivfurniture.com'], [
            'name' => 'Priya Sharma', 'mobile' => '9876543211', 'password' => Hash::make('password'),
        ]);
        $salesUser->assignRole('Sales User');

        $purchaseUser = User::firstOrCreate(['email' => 'purchase@shivfurniture.com'], [
            'name' => 'Mohan Das', 'mobile' => '9876543212', 'password' => Hash::make('password'),
        ]);
        $purchaseUser->assignRole('Purchase User');

        $mfgUser = User::firstOrCreate(['email' => 'mfg@shivfurniture.com'], [
            'name' => 'Arjun Patel', 'mobile' => '9876543213', 'password' => Hash::make('password'),
        ]);
        $mfgUser->assignRole('Manufacturing User');

        $invManager = User::firstOrCreate(['email' => 'inventory@shivfurniture.com'], [
            'name' => 'Sunita Mehta', 'mobile' => '9876543214', 'password' => Hash::make('password'),
        ]);
        $invManager->assignRole('Inventory Manager');

        $owner = User::firstOrCreate(['email' => 'owner@shivfurniture.com'], [
            'name' => 'Shiv Agarwal', 'mobile' => '9876543215',
            'address' => 'Shiv Furniture Works, Plot 7, RIICO Industrial Area, Jodhpur 342005',
            'password' => Hash::make('password'),
        ]);
        $owner->assignRole('Business Owner');

        // --- Customers ---
        $cust1 = Customer::firstOrCreate(['email' => 'contact@interiorsbyjaya.com'], [
            'name'    => 'Interiors by Jaya',
            'mobile'  => '8001234567',
            'address' => '45, MG Road, Bangalore 560001',
            'city'    => 'Bangalore',
        ]);
        $cust2 = Customer::firstOrCreate(['email' => 'purchase@homeessentials.in'], [
            'name'    => 'Home Essentials Pvt Ltd',
            'mobile'  => '8002345678',
            'address' => '78, Linking Road, Mumbai 400050',
            'city'    => 'Mumbai',
        ]);
        $cust3 = Customer::firstOrCreate(['email' => 'info@furniturezone.co'], [
            'name'    => 'FurnitureZone Retail',
            'mobile'  => '8003456789',
            'address' => '23, Commercial Street, Delhi 110001',
            'city'    => 'Delhi',
        ]);

        // --- Vendors ---
        $vendor1 = Vendor::firstOrCreate(['email' => 'sales@rajputwood.com'], [
            'name'                  => 'Rajput Timber & Wood Co.',
            'mobile'                => '9001122334',
            'address'               => 'Timber Market, Churu, Rajasthan',
            'city'                  => 'Churu',
            'on_time_delivery_rate' => 92.5,
        ]);
        $vendor2 = Vendor::firstOrCreate(['email' => 'orders@shekhawatwood.com'], [
            'name'                  => 'Shekhawat Wood Suppliers',
            'mobile'                => '9001122335',
            'address'               => 'Wood Nagar, Bikaner, Rajasthan',
            'city'                  => 'Bikaner',
            'on_time_delivery_rate' => 85.0,
        ]);
        $vendor3 = Vendor::firstOrCreate(['email' => 'info@fastenersplus.com'], [
            'name'                  => 'FastenersPlus Hardware',
            'mobile'                => '9001122336',
            'address'               => 'Hardware Market, Jaipur, Rajasthan',
            'city'                  => 'Jaipur',
            'on_time_delivery_rate' => 97.0,
        ]);

        // --- Work Centers ---
        $wcAssembly = WorkCenter::firstOrCreate(['code' => 'WC-ASM'], [
            'name' => 'Assembly Line',
            'description' => 'Main furniture assembly station',
        ]);
        $wcPaint = WorkCenter::firstOrCreate(['code' => 'WC-PNT'], [
            'name' => 'Paint Floor',
            'description' => 'Spray painting and finishing',
        ]);
        $wcPack = WorkCenter::firstOrCreate(['code' => 'WC-PKG'], [
            'name' => 'Packaging Unit',
            'description' => 'Final packaging and dispatch preparation',
        ]);

        // --- Products: Raw Materials ---
        $woodenLegs = Product::firstOrCreate(['reference' => 'RM-001'], [
            'name'               => 'Wooden Legs',
            'category'           => 'Raw Material',
            'uom'                => 'pcs',
            'sales_price'        => 150.00,
            'cost_price'         => 80.00,
            'on_hand_qty'        => 240,
            'reserved_qty'       => 40,
            'procure_on_demand'  => true,
            'replenishment_route' => 'Vendor',
            'preferred_vendor_id' => $vendor1->id,
            'reorder_point'      => 80,
            'safety_stock'       => 40,
            'lead_time_days'     => 5,
        ]);

        $woodenTop = Product::firstOrCreate(['reference' => 'RM-002'], [
            'name'               => 'Wooden Top',
            'category'           => 'Raw Material',
            'uom'                => 'pcs',
            'sales_price'        => 800.00,
            'cost_price'         => 450.00,
            'on_hand_qty'        => 55,
            'reserved_qty'       => 10,
            'procure_on_demand'  => true,
            'replenishment_route' => 'Vendor',
            'preferred_vendor_id' => $vendor1->id,
            'reorder_point'      => 20,
            'safety_stock'       => 10,
            'lead_time_days'     => 7,
        ]);

        $screws = Product::firstOrCreate(['reference' => 'RM-003'], [
            'name'               => 'Screws',
            'category'           => 'Raw Material',
            'uom'                => 'pcs',
            'sales_price'        => 2.00,
            'cost_price'         => 0.80,
            'on_hand_qty'        => 2400,
            'reserved_qty'       => 480,
            'procure_on_demand'  => true,
            'replenishment_route' => 'Vendor',
            'preferred_vendor_id' => $vendor3->id,
            'reorder_point'      => 600,
            'safety_stock'       => 300,
            'lead_time_days'     => 3,
        ]);

        $woodenBoard = Product::firstOrCreate(['reference' => 'RM-004'], [
            'name'               => 'Wooden Board (Chair Seat)',
            'category'           => 'Raw Material',
            'uom'                => 'pcs',
            'sales_price'        => 400.00,
            'cost_price'         => 220.00,
            'on_hand_qty'        => 80,
            'reserved_qty'       => 20,
            'procure_on_demand'  => true,
            'replenishment_route' => 'Vendor',
            'preferred_vendor_id' => $vendor2->id,
            'reorder_point'      => 25,
            'safety_stock'       => 12,
            'lead_time_days'     => 5,
        ]);

        $diningTopLarge = Product::firstOrCreate(['reference' => 'RM-005'], [
            'name'               => 'Dining Table Top (Large)',
            'category'           => 'Raw Material',
            'uom'                => 'pcs',
            'sales_price'        => 1200.00,
            'cost_price'         => 700.00,
            'on_hand_qty'        => 30,
            'reserved_qty'       => 8,
            'procure_on_demand'  => true,
            'replenishment_route' => 'Vendor',
            'preferred_vendor_id' => $vendor1->id,
            'reorder_point'      => 10,
            'safety_stock'       => 5,
            'lead_time_days'     => 10,
        ]);

        // --- Products: Finished Goods ---
        $woodenTable = Product::firstOrCreate(['reference' => 'FG-001'], [
            'name'               => 'Wooden Table',
            'category'           => 'Finished Good',
            'uom'                => 'pcs',
            'sales_price'        => 4500.00,
            'cost_price'         => 2200.00,
            'on_hand_qty'        => 12,
            'reserved_qty'       => 8,
            'procure_on_demand'  => true,
            'replenishment_route' => 'BoM',
            'reorder_point'      => 10,
            'safety_stock'       => 5,
            'lead_time_days'     => 14,
        ]);

        $officeChair = Product::firstOrCreate(['reference' => 'FG-002'], [
            'name'               => 'Office Chair',
            'category'           => 'Finished Good',
            'uom'                => 'pcs',
            'sales_price'        => 3200.00,
            'cost_price'         => 1600.00,
            'on_hand_qty'        => 25,
            'reserved_qty'       => 10,
            'procure_on_demand'  => true,
            'replenishment_route' => 'BoM',
            'reorder_point'      => 8,
            'safety_stock'       => 4,
            'lead_time_days'     => 10,
        ]);

        $diningTable = Product::firstOrCreate(['reference' => 'FG-003'], [
            'name'               => 'Dining Table',
            'category'           => 'Finished Good',
            'uom'                => 'pcs',
            'sales_price'        => 8500.00,
            'cost_price'         => 4200.00,
            'on_hand_qty'        => 5,
            'reserved_qty'       => 3,
            'procure_on_demand'  => true,
            'replenishment_route' => 'BoM',
            'reorder_point'      => 4,
            'safety_stock'       => 2,
            'lead_time_days'     => 18,
        ]);

        // --- Vendor Scores ---
        VendorScore::updateOrCreate(['vendor_id' => $vendor1->id, 'product_id' => $woodenLegs->id], [
            'normalized_price_rank' => 0.85, 'on_time_delivery_rate' => 92.5, 'score' => 0.889,
        ]);
        VendorScore::updateOrCreate(['vendor_id' => $vendor2->id, 'product_id' => $woodenLegs->id], [
            'normalized_price_rank' => 0.65, 'on_time_delivery_rate' => 85.0, 'score' => 0.750,
        ]);
        VendorScore::updateOrCreate(['vendor_id' => $vendor3->id, 'product_id' => $screws->id], [
            'normalized_price_rank' => 0.90, 'on_time_delivery_rate' => 97.0, 'score' => 0.935,
        ]);

        // --- Bill of Materials: Wooden Table ---
        $bomTable = BillOfMaterial::firstOrCreate(['reference' => 'BOM-001'], [
            'finished_product_id' => $woodenTable->id,
            'base_qty'            => 1,
            'uom'                 => 'pcs',
        ]);
        BomComponent::firstOrCreate(['bom_id' => $bomTable->id, 'component_id' => $woodenLegs->id], [
            'to_consume_qty' => 4, 'uom' => 'pcs',
        ]);
        BomComponent::firstOrCreate(['bom_id' => $bomTable->id, 'component_id' => $woodenTop->id], [
            'to_consume_qty' => 1, 'uom' => 'pcs',
        ]);
        BomComponent::firstOrCreate(['bom_id' => $bomTable->id, 'component_id' => $screws->id], [
            'to_consume_qty' => 12, 'uom' => 'pcs',
        ]);
        BomOperation::firstOrCreate(['bom_id' => $bomTable->id, 'operation_name' => 'Assembly', 'sequence' => 1], [
            'work_center_id' => $wcAssembly->id, 'expected_duration_mins' => 60,
        ]);
        BomOperation::firstOrCreate(['bom_id' => $bomTable->id, 'operation_name' => 'Painting', 'sequence' => 2], [
            'work_center_id' => $wcPaint->id, 'expected_duration_mins' => 30,
        ]);
        BomOperation::firstOrCreate(['bom_id' => $bomTable->id, 'operation_name' => 'Packing', 'sequence' => 3], [
            'work_center_id' => $wcPack->id, 'expected_duration_mins' => 20,
        ]);

        // --- Bill of Materials: Office Chair ---
        $bomChair = BillOfMaterial::firstOrCreate(['reference' => 'BOM-002'], [
            'finished_product_id' => $officeChair->id,
            'base_qty'            => 1,
            'uom'                 => 'pcs',
        ]);
        BomComponent::firstOrCreate(['bom_id' => $bomChair->id, 'component_id' => $woodenLegs->id], [
            'to_consume_qty' => 4, 'uom' => 'pcs',
        ]);
        BomComponent::firstOrCreate(['bom_id' => $bomChair->id, 'component_id' => $woodenBoard->id], [
            'to_consume_qty' => 1, 'uom' => 'pcs',
        ]);
        BomComponent::firstOrCreate(['bom_id' => $bomChair->id, 'component_id' => $screws->id], [
            'to_consume_qty' => 8, 'uom' => 'pcs',
        ]);
        BomOperation::firstOrCreate(['bom_id' => $bomChair->id, 'operation_name' => 'Assembly', 'sequence' => 1], [
            'work_center_id' => $wcAssembly->id, 'expected_duration_mins' => 45,
        ]);
        BomOperation::firstOrCreate(['bom_id' => $bomChair->id, 'operation_name' => 'Packing', 'sequence' => 2], [
            'work_center_id' => $wcPack->id, 'expected_duration_mins' => 15,
        ]);

        // --- Bill of Materials: Dining Table ---
        $bomDining = BillOfMaterial::firstOrCreate(['reference' => 'BOM-003'], [
            'finished_product_id' => $diningTable->id,
            'base_qty'            => 1,
            'uom'                 => 'pcs',
        ]);
        BomComponent::firstOrCreate(['bom_id' => $bomDining->id, 'component_id' => $woodenLegs->id], [
            'to_consume_qty' => 6, 'uom' => 'pcs',
        ]);
        BomComponent::firstOrCreate(['bom_id' => $bomDining->id, 'component_id' => $diningTopLarge->id], [
            'to_consume_qty' => 1, 'uom' => 'pcs',
        ]);
        BomComponent::firstOrCreate(['bom_id' => $bomDining->id, 'component_id' => $screws->id], [
            'to_consume_qty' => 18, 'uom' => 'pcs',
        ]);
        BomOperation::firstOrCreate(['bom_id' => $bomDining->id, 'operation_name' => 'Assembly', 'sequence' => 1], [
            'work_center_id' => $wcAssembly->id, 'expected_duration_mins' => 90,
        ]);
        BomOperation::firstOrCreate(['bom_id' => $bomDining->id, 'operation_name' => 'Painting', 'sequence' => 2], [
            'work_center_id' => $wcPaint->id, 'expected_duration_mins' => 45,
        ]);
        BomOperation::firstOrCreate(['bom_id' => $bomDining->id, 'operation_name' => 'Packing', 'sequence' => 3], [
            'work_center_id' => $wcPack->id, 'expected_duration_mins' => 30,
        ]);

        // --- Historical Stock Ledger (for AI algorithms) ---
        $this->seedHistoricalLedger($woodenTable, $admin);
        $this->seedHistoricalLedger($officeChair, $admin);
        $this->seedHistoricalLedger($screws, $admin);

        // --- Sample Sales Orders ---
        $so1 = SalesOrder::firstOrCreate(['reference' => 'SO-0001'], [
            'customer_id'            => $cust1->id,
            'shipping_address'       => '45, MG Road, Bangalore 560001',
            'order_date'             => Carbon::now()->subDays(15)->toDateString(),
            'expected_delivery_date' => Carbon::now()->subDays(2)->toDateString(),
            'sales_person_id'        => $salesUser->id,
            'status'                 => 'Delivered',
        ]);
        SaleOrderLine::firstOrCreate(['sales_order_id' => $so1->id, 'product_id' => $woodenTable->id], [
            'uom' => 'pcs', 'ordered_qty' => 5, 'delivered_qty' => 5, 'unit_price' => 4500,
        ]);

        $so2 = SalesOrder::firstOrCreate(['reference' => 'SO-0002'], [
            'customer_id'            => $cust2->id,
            'shipping_address'       => '78, Linking Road, Mumbai 400050',
            'order_date'             => Carbon::now()->subDays(10)->toDateString(),
            'expected_delivery_date' => Carbon::now()->addDays(2)->toDateString(),
            'sales_person_id'        => $salesUser->id,
            'status'                 => 'Confirmed',
        ]);
        SaleOrderLine::firstOrCreate(['sales_order_id' => $so2->id, 'product_id' => $officeChair->id], [
            'uom' => 'pcs', 'ordered_qty' => 8, 'delivered_qty' => 5, 'unit_price' => 3200,
        ]);
        SaleOrderLine::firstOrCreate(['sales_order_id' => $so2->id, 'product_id' => $woodenTable->id], [
            'uom' => 'pcs', 'ordered_qty' => 3, 'delivered_qty' => 0, 'unit_price' => 4500,
        ]);

        $so3 = SalesOrder::firstOrCreate(['reference' => 'SO-0003'], [
            'customer_id'            => $cust3->id,
            'shipping_address'       => '23, Commercial Street, Delhi 110001',
            'order_date'             => Carbon::now()->subDays(5)->toDateString(),
            'expected_delivery_date' => Carbon::now()->addDays(7)->toDateString(),
            'sales_person_id'        => $salesUser->id,
            'status'                 => 'Draft',
        ]);
        SaleOrderLine::firstOrCreate(['sales_order_id' => $so3->id, 'product_id' => $diningTable->id], [
            'uom' => 'pcs', 'ordered_qty' => 12, 'delivered_qty' => 0, 'unit_price' => 8500,
        ]);

        // --- Sample Purchase Orders ---
        $po1 = PurchaseOrder::firstOrCreate(['reference' => 'PO-0001'], [
            'vendor_id'            => $vendor1->id,
            'vendor_address'       => 'Timber Market, Churu, Rajasthan',
            'order_date'           => Carbon::now()->subDays(20)->toDateString(),
            'expected_receipt_date' => Carbon::now()->subDays(5)->toDateString(),
            'agent_id'             => $purchaseUser->id,
            'status'               => 'Received',
            'notes'                => 'Quarterly wood stock replenishment',
        ]);
        PurchaseOrderLine::firstOrCreate(['purchase_order_id' => $po1->id, 'product_id' => $woodenLegs->id], [
            'uom' => 'pcs', 'ordered_qty' => 200, 'received_qty' => 200, 'cost_price' => 80,
        ]);
        PurchaseOrderLine::firstOrCreate(['purchase_order_id' => $po1->id, 'product_id' => $woodenTop->id], [
            'uom' => 'pcs', 'ordered_qty' => 50, 'received_qty' => 50, 'cost_price' => 450,
        ]);

        $po2 = PurchaseOrder::firstOrCreate(['reference' => 'PO-0002'], [
            'vendor_id'            => $vendor3->id,
            'vendor_address'       => 'Hardware Market, Jaipur, Rajasthan',
            'order_date'           => Carbon::now()->subDays(3)->toDateString(),
            'expected_receipt_date' => Carbon::now()->addDays(2)->toDateString(),
            'agent_id'             => $purchaseUser->id,
            'status'               => 'Confirmed',
        ]);
        PurchaseOrderLine::firstOrCreate(['purchase_order_id' => $po2->id, 'product_id' => $screws->id], [
            'uom' => 'pcs', 'ordered_qty' => 5000, 'received_qty' => 0, 'cost_price' => 0.80,
        ]);

        // --- Sample Manufacturing Orders ---
        $mo1 = ManufacturingOrder::firstOrCreate(['reference' => 'MO-0001'], [
            'finished_product_id' => $woodenTable->id,
            'target_qty'          => 10,
            'uom'                 => 'pcs',
            'bom_id'              => $bomTable->id,
            'scheduled_date'      => Carbon::now()->subDays(8)->toDateString(),
            'assignee_id'         => $mfgUser->id,
            'status'              => 'Done',
        ]);

        $mo2 = ManufacturingOrder::firstOrCreate(['reference' => 'MO-0002'], [
            'finished_product_id' => $officeChair->id,
            'target_qty'          => 15,
            'uom'                 => 'pcs',
            'bom_id'              => $bomChair->id,
            'scheduled_date'      => Carbon::now()->addDays(3)->toDateString(),
            'assignee_id'         => $mfgUser->id,
            'status'              => 'In-Progress',
        ]);
        foreach ($bomChair->components as $comp) {
            MoComponent::firstOrCreate(
                ['manufacturing_order_id' => $mo2->id, 'product_id' => $comp->component_id],
                ['uom' => $comp->uom, 'to_consume_qty' => $comp->to_consume_qty * 15, 'consumed_qty' => 0]
            );
        }
        foreach ($bomChair->operations()->get() as $op) {
            MoWorkOrder::firstOrCreate(
                ['manufacturing_order_id' => $mo2->id, 'operation_name' => $op->operation_name],
                ['work_center_id' => $op->work_center_id, 'expected_duration_mins' => $op->expected_duration_mins, 'sequence' => $op->sequence]
            );
        }

        $mo3 = ManufacturingOrder::firstOrCreate(['reference' => 'MO-0003'], [
            'finished_product_id' => $diningTable->id,
            'target_qty'          => 8,
            'uom'                 => 'pcs',
            'bom_id'              => $bomDining->id,
            'scheduled_date'      => Carbon::now()->subDays(2)->toDateString(),
            'assignee_id'         => $mfgUser->id,
            'status'              => 'Confirmed',
        ]);
        foreach ($bomDining->components as $comp) {
            MoComponent::firstOrCreate(
                ['manufacturing_order_id' => $mo3->id, 'product_id' => $comp->component_id],
                ['uom' => $comp->uom, 'to_consume_qty' => $comp->to_consume_qty * 8, 'consumed_qty' => 0]
            );
        }
    }

    private function seedHistoricalLedger(Product $product, User $user): void
    {
        if (StockLedger::where('product_id', $product->id)->exists()) return;

        $base = $product->on_hand_qty;
        $entries = [
            ['delta' => -5,  'days' => 30],
            ['delta' => -8,  'days' => 27],
            ['delta' => 50,  'days' => 25],
            ['delta' => -6,  'days' => 23],
            ['delta' => -10, 'days' => 20],
            ['delta' => -7,  'days' => 18],
            ['delta' => -9,  'days' => 15],
            ['delta' => 40,  'days' => 12],
            ['delta' => -8,  'days' => 10],
            ['delta' => -12, 'days' => 8],
            ['delta' => -6,  'days' => 6],
            ['delta' => -9,  'days' => 4],
            ['delta' => -80, 'days' => 2],  // anomaly — big unexplained drop
        ];

        $running = $base;
        foreach ($entries as $e) {
            $running += $e['delta'];
            StockLedger::create([
                'product_id'      => $product->id,
                'delta'           => $e['delta'],
                'balance_after'   => max(0, $running),
                'reason'          => $e['delta'] > 0 ? 'Stock receipt' : 'Sales delivery',
                'source_document' => $e['delta'] > 0 ? 'PO-SEED' : 'SO-SEED',
                'created_by'      => $user->id,
                'created_at'      => Carbon::now()->subDays($e['days']),
                'updated_at'      => Carbon::now()->subDays($e['days']),
            ]);
        }
    }
}
