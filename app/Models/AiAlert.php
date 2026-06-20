<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AiAlert extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id', 'alert_type', 'message',
        'reason', 'suggested_qty', 'is_resolved', 'resolved_at',
    ];

    protected $casts = [
        'is_resolved'  => 'boolean',
        'resolved_at'  => 'datetime',
        'suggested_qty' => 'decimal:3',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
