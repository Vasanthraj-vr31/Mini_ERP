<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MoComponent extends Model
{
    use HasFactory;

    protected $fillable = [
        'manufacturing_order_id', 'product_id', 'uom',
        'to_consume_qty', 'consumed_qty',
    ];

    protected $casts = [
        'to_consume_qty' => 'decimal:3',
        'consumed_qty'   => 'decimal:3',
    ];

    public function manufacturingOrder()
    {
        return $this->belongsTo(ManufacturingOrder::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function getAvailabilityStatusAttribute(): string
    {
        $free = $this->product->free_to_use_qty;
        if ($free >= $this->to_consume_qty) return 'available';
        if ($free > 0) return 'partial';
        return 'unavailable';
    }
}
