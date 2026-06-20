<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference', 'name', 'description', 'uom',
        'sales_price', 'cost_price',
        'on_hand_qty', 'reserved_qty',
        'procure_on_demand', 'replenishment_route',
        'preferred_vendor_id',
        'reorder_point', 'safety_stock', 'lead_time_days',
        'category',
    ];

    protected $casts = [
        'procure_on_demand' => 'boolean',
        'sales_price'       => 'decimal:2',
        'cost_price'        => 'decimal:2',
        'on_hand_qty'       => 'decimal:3',
        'reserved_qty'      => 'decimal:3',
        'reorder_point'     => 'decimal:3',
        'safety_stock'      => 'decimal:3',
    ];

    public function getFreeToUseQtyAttribute(): float
    {
        return max(0, $this->on_hand_qty - $this->reserved_qty);
    }

    public function preferredVendor()
    {
        return $this->belongsTo(Vendor::class, 'preferred_vendor_id');
    }

    public function saleOrderLines()
    {
        return $this->hasMany(SaleOrderLine::class);
    }

    public function purchaseOrderLines()
    {
        return $this->hasMany(PurchaseOrderLine::class);
    }

    public function billsOfMaterials()
    {
        return $this->hasMany(BillOfMaterial::class, 'finished_product_id');
    }

    public function stockLedger()
    {
        return $this->hasMany(StockLedger::class);
    }

    public function aiAlerts()
    {
        return $this->hasMany(AiAlert::class)->where('is_resolved', false);
    }

    public function vendorScores()
    {
        return $this->hasMany(VendorScore::class);
    }

    public function bestScoredVendor(): ?Vendor
    {
        $score = $this->vendorScores()->with('vendor')->orderByDesc('score')->first();
        return $score?->vendor;
    }
}
