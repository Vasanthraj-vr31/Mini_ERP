<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrderLine extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_order_id', 'product_id', 'uom',
        'ordered_qty', 'received_qty', 'cost_price',
    ];

    protected $casts = [
        'ordered_qty'  => 'decimal:3',
        'received_qty' => 'decimal:3',
        'cost_price'   => 'decimal:2',
    ];

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function getLineTotalAttribute(): float
    {
        return $this->ordered_qty * $this->cost_price;
    }

    public function getPendingQtyAttribute(): float
    {
        return max(0, $this->ordered_qty - $this->received_qty);
    }
}
