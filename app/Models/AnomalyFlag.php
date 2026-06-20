<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnomalyFlag extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id', 'stock_ledger_id',
        'delta', 'mean_delta', 'std_dev', 'z_score',
        'reason', 'is_reviewed',
    ];

    protected $casts = [
        'delta'       => 'decimal:3',
        'mean_delta'  => 'decimal:3',
        'std_dev'     => 'decimal:3',
        'z_score'     => 'decimal:4',
        'is_reviewed' => 'boolean',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function stockLedgerEntry()
    {
        return $this->belongsTo(StockLedger::class, 'stock_ledger_id');
    }
}
