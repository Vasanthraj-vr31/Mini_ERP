<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VendorScore extends Model
{
    use HasFactory;

    protected $fillable = [
        'vendor_id', 'product_id',
        'normalized_price_rank', 'on_time_delivery_rate', 'score',
        'computed_at',
    ];

    protected $casts = [
        'normalized_price_rank'  => 'decimal:4',
        'on_time_delivery_rate'  => 'decimal:2',
        'score'                  => 'decimal:4',
        'computed_at'            => 'datetime',
    ];

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
