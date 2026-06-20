<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SaleOrderLine extends Model
{
    use HasFactory;

    protected $fillable = [
        'sales_order_id', 'product_id', 'uom',
        'ordered_qty', 'delivered_qty', 'unit_price',
    ];

    protected $casts = [
        'ordered_qty'   => 'decimal:3',
        'delivered_qty' => 'decimal:3',
        'unit_price'    => 'decimal:2',
    ];

    public function salesOrder()
    {
        return $this->belongsTo(SalesOrder::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function getLineTotalAttribute(): float
    {
        return $this->ordered_qty * $this->unit_price;
    }

    public function getRemainingQtyAttribute(): float
    {
        return max(0, $this->ordered_qty - $this->delivered_qty);
    }
}
