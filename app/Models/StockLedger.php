<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockLedger extends Model
{
    use HasFactory;

    protected $table = 'stock_ledger';

    protected $fillable = [
        'product_id', 'delta', 'balance_after',
        'reason', 'source_document', 'created_by',
        'anomaly_flagged', 'anomaly_reason',
    ];

    protected $casts = [
        'delta'           => 'decimal:3',
        'balance_after'   => 'decimal:3',
        'anomaly_flagged' => 'boolean',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function anomalyFlag()
    {
        return $this->hasOne(AnomalyFlag::class);
    }
}
