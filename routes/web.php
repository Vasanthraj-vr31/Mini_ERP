<?php

use App\Http\Controllers\AiAlertController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\BillOfMaterialController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ManufacturingOrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\SalesOrderController;
use App\Http\Controllers\StockLedgerController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect()->route('dashboard'));

Auth::routes(['register' => false]);

Route::middleware(['auth'])->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
    Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');

    // Products
    Route::middleware('can:view products')->prefix('products')->name('products.')->group(function () {
        Route::get('/',           [ProductController::class, 'index'])->name('index');
        Route::get('/create',     [ProductController::class, 'create'])->name('create')->middleware('can:manage products');
        Route::post('/',          [ProductController::class, 'store'])->name('store')->middleware('can:manage products');
        Route::get('/{product}',  [ProductController::class, 'show'])->name('show');
        Route::get('/{product}/edit', [ProductController::class, 'edit'])->name('edit')->middleware('can:manage products');
        Route::put('/{product}',  [ProductController::class, 'update'])->name('update')->middleware('can:manage products');
    });

    // Sales Orders
    Route::middleware('can:view sales orders')->prefix('sales-orders')->name('sales-orders.')->group(function () {
        Route::get('/',                          [SalesOrderController::class, 'index'])->name('index');
        Route::get('/create',                    [SalesOrderController::class, 'create'])->name('create')->middleware('can:manage sales orders');
        Route::post('/',                         [SalesOrderController::class, 'store'])->name('store')->middleware('can:manage sales orders');
        Route::get('/{salesOrder}',              [SalesOrderController::class, 'show'])->name('show');
        Route::get('/{salesOrder}/edit',         [SalesOrderController::class, 'edit'])->name('edit')->middleware('can:manage sales orders');
        Route::put('/{salesOrder}',              [SalesOrderController::class, 'update'])->name('update')->middleware('can:manage sales orders');
        Route::post('/{salesOrder}/confirm',     [SalesOrderController::class, 'confirm'])->name('confirm')->middleware('can:manage sales orders');
        Route::post('/{salesOrder}/deliver',     [SalesOrderController::class, 'deliver'])->name('deliver')->middleware('can:manage sales orders');
        Route::post('/{salesOrder}/cancel',      [SalesOrderController::class, 'cancel'])->name('cancel')->middleware('can:manage sales orders');
    });

    // Purchase Orders
    Route::middleware('can:view purchase orders')->prefix('purchase-orders')->name('purchase-orders.')->group(function () {
        Route::get('/',                          [PurchaseOrderController::class, 'index'])->name('index');
        Route::get('/create',                    [PurchaseOrderController::class, 'create'])->name('create')->middleware('can:manage purchase orders');
        Route::post('/',                         [PurchaseOrderController::class, 'store'])->name('store')->middleware('can:manage purchase orders');
        Route::get('/{purchaseOrder}',           [PurchaseOrderController::class, 'show'])->name('show');
        Route::get('/{purchaseOrder}/edit',      [PurchaseOrderController::class, 'edit'])->name('edit')->middleware('can:manage purchase orders');
        Route::put('/{purchaseOrder}',           [PurchaseOrderController::class, 'update'])->name('update')->middleware('can:manage purchase orders');
        Route::post('/{purchaseOrder}/confirm',  [PurchaseOrderController::class, 'confirm'])->name('confirm')->middleware('can:manage purchase orders');
        Route::post('/{purchaseOrder}/receive',  [PurchaseOrderController::class, 'receive'])->name('receive')->middleware('can:manage purchase orders');
        Route::post('/{purchaseOrder}/cancel',   [PurchaseOrderController::class, 'cancel'])->name('cancel')->middleware('can:manage purchase orders');
    });

    // Bills of Materials
    Route::middleware('can:view bom')->prefix('bom')->name('bom.')->group(function () {
        Route::get('/',             [BillOfMaterialController::class, 'index'])->name('index');
        Route::get('/create',       [BillOfMaterialController::class, 'create'])->name('create')->middleware('can:manage bom');
        Route::post('/',            [BillOfMaterialController::class, 'store'])->name('store')->middleware('can:manage bom');
        Route::get('/{bom}',        [BillOfMaterialController::class, 'show'])->name('show');
        Route::get('/{bom}/edit',   [BillOfMaterialController::class, 'edit'])->name('edit')->middleware('can:manage bom');
        Route::put('/{bom}',        [BillOfMaterialController::class, 'update'])->name('update')->middleware('can:manage bom');
        Route::delete('/{bom}',     [BillOfMaterialController::class, 'destroy'])->name('destroy')->middleware('can:manage bom');
    });

    // Manufacturing Orders
    Route::middleware('can:view manufacturing orders')->prefix('manufacturing-orders')->name('manufacturing-orders.')->group(function () {
        Route::get('/',                                        [ManufacturingOrderController::class, 'index'])->name('index');
        Route::get('/create',                                  [ManufacturingOrderController::class, 'create'])->name('create')->middleware('can:manage manufacturing orders');
        Route::post('/',                                       [ManufacturingOrderController::class, 'store'])->name('store')->middleware('can:manage manufacturing orders');
        Route::get('/bom-data/{bom}',                         [ManufacturingOrderController::class, 'bomData'])->name('bom-data');
        Route::get('/{manufacturingOrder}',                    [ManufacturingOrderController::class, 'show'])->name('show');
        Route::get('/{manufacturingOrder}/edit',               [ManufacturingOrderController::class, 'edit'])->name('edit')->middleware('can:manage manufacturing orders');
        Route::put('/{manufacturingOrder}',                    [ManufacturingOrderController::class, 'update'])->name('update')->middleware('can:manage manufacturing orders');
        Route::post('/{manufacturingOrder}/confirm',           [ManufacturingOrderController::class, 'confirm'])->name('confirm')->middleware('can:manage manufacturing orders');
        Route::post('/{manufacturingOrder}/start',             [ManufacturingOrderController::class, 'start'])->name('start')->middleware('can:manage manufacturing orders');
        Route::post('/{manufacturingOrder}/close',             [ManufacturingOrderController::class, 'close'])->name('close')->middleware('can:manage manufacturing orders');
        Route::post('/{manufacturingOrder}/cancel',            [ManufacturingOrderController::class, 'cancel'])->name('cancel')->middleware('can:manage manufacturing orders');
    });

    // Stock Ledger
    Route::middleware('can:view stock ledger')->prefix('stock-ledger')->name('stock-ledger.')->group(function () {
        Route::get('/',              [StockLedgerController::class, 'index'])->name('index');
        Route::post('/adjust',       [StockLedgerController::class, 'adjust'])->name('adjust')->middleware('can:manage stock');
    });

    // Audit Logs
    Route::middleware('can:view audit logs')->get('/audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');

    // AI Alerts
    Route::middleware('can:view ai alerts')->get('/ai-alerts', [AiAlertController::class, 'index'])->name('ai-alerts.index');
    Route::middleware('can:resolve ai alerts')->post('/ai-alerts/{aiAlert}/resolve', [AiAlertController::class, 'resolve'])->name('ai-alerts.resolve');
    Route::middleware('can:view ai alerts')->post('/ai-alerts/run-forecast', [AiAlertController::class, 'runForecast'])->name('ai-alerts.run-forecast');
});
